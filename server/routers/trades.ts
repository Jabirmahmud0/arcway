import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { requireArcwayRole } from "../access";
import {
  appendTradeEvent, createDocumentPlaceholders, createInconsistencyExceptions, createPartnerRequest, createShadowAuditTrade, createTrade, fulfillTradeObligation, getDashboardData, getDocumentById, getEvidenceVault, ingestTradeEmail,
  getExceptionById, getObligationById, getTradeById, getTradeDocuments, getTradeWorkspace, listProductConcentrationForOrganization, listTradesForUser, refreshTradeTrustScore, resolveTradeException, updateDocumentReview,
  updateDocumentUpload, updateTradeAssurance, createPreflightRun, getActivePolicySnapshots,
} from "../db";
import { notifyOwner } from "../_core/notification";
import { buildOwnerNotification } from "../ownerNotifications";
import { assertDocumentTransition } from "../documentWorkflow";
import { protectedProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { extractDocumentFields } from "../services/documentIntelligence";
import { calculateTrustScore, findCrossDocumentInconsistencies, REQUIRED_DOCUMENT_TYPES } from "../tradeDomain";
import { evaluatePreflight } from "../preflight";

const documentTypeSchema = z.enum(REQUIRED_DOCUMENT_TYPES);

async function assertTradeAccess(input: { tradeId: number; user: { id: number; role: "trader" | "reviewer"; organizationId?: number | null } }) {
  const trade = await getTradeById(input.tradeId);
  if (!trade) throw new TRPCError({ code: "NOT_FOUND", message: "Trade not found." });
  if (input.user.role === "trader" && trade.ownerId !== input.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "You can access only your own trades." });
  if (input.user.organizationId && trade.organizationId !== input.user.organizationId) throw new TRPCError({ code: "FORBIDDEN", message: "This Trade Twin belongs to another workspace." });
  return trade;
}

async function refreshScore(tradeId: number) {
  const [trade, documents] = await Promise.all([getTradeById(tradeId), getTradeDocuments(tradeId)]);
  if (!trade) return;
  const trust = calculateTrustScore({ documents: documents.map(document => ({ status: document.status, inconsistencies: document.inconsistencies })), partyKycState: trade.partyKycState });
  await refreshTradeTrustScore(tradeId, trust.score, trust.band);
  return trust;
}

export const tradeRouter = router({
  dashboard: protectedProcedure.query(async ({ ctx }) => getDashboardData(ctx.user)),
  vault: protectedProcedure.query(async ({ ctx }) => getEvidenceVault(ctx.user)),
  productConcentration: protectedProcedure.query(async ({ ctx }) => {
    requireArcwayRole("reviewer", ctx.user.role);
    if (!ctx.user.organizationId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Workspace provisioning is in progress." });
    return listProductConcentrationForOrganization(ctx.user.organizationId);
  }),
  seedShadowAudit: protectedProcedure.mutation(async ({ ctx }) => {
    requireArcwayRole("reviewer", ctx.user.role);
    return createShadowAuditTrade(ctx.user.id);
  }),
  list: protectedProcedure.query(async ({ ctx }) => listTradesForUser(ctx.user)),
  get: protectedProcedure.input(z.object({ tradeId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    await assertTradeAccess({ tradeId: input.tradeId, user: ctx.user });
    const workspace = await getTradeWorkspace(input.tradeId);
    if (!workspace) throw new TRPCError({ code: "NOT_FOUND", message: "Trade not found." });
    const trust = calculateTrustScore({ documents: workspace.documents.map(document => ({ status: document.status, inconsistencies: document.inconsistencies })), partyKycState: workspace.trade.partyKycState });
    return { ...workspace, trust };
  }),
  preflight: protectedProcedure.input(z.object({ tradeId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    await assertTradeAccess({ tradeId: input.tradeId, user: ctx.user });
    const workspace = await getTradeWorkspace(input.tradeId);
    if (!workspace) throw new TRPCError({ code: "NOT_FOUND", message: "Trade not found." });
    return evaluatePreflight({ trade: workspace.trade, documents: workspace.documents, exceptions: workspace.exceptions, obligations: workspace.obligations, obligationDependencies: workspace.obligationDependencies });
  }),
  rerunPreflight: protectedProcedure.input(z.object({ tradeId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    requireArcwayRole("reviewer", ctx.user.role);
    await assertTradeAccess({ tradeId: input.tradeId, user: ctx.user });
    const workspace = await getTradeWorkspace(input.tradeId);
    if (!workspace) throw new TRPCError({ code: "NOT_FOUND", message: "Trade not found." });
    const result = evaluatePreflight({ trade: workspace.trade, documents: workspace.documents, exceptions: workspace.exceptions, obligations: workspace.obligations, obligationDependencies: workspace.obligationDependencies });
    const status = result.summary === "ready" ? "ready" : result.summary === "warning" ? "ready_with_warnings" : "blocked";
    const policyVersions = workspace.trade.organizationId ? await getActivePolicySnapshots(workspace.trade.organizationId) : [];
    await createPreflightRun({
      tradeId: input.tradeId,
      gate: "full_release_preflight",
      status,
      checks: result.checks,
      policySnapshot: { policyVersions, activeWaivers: workspace.preflightWaivers.filter(waiver => waiver.decision === "active").map(waiver => ({ id: waiver.id, policyVersionId: waiver.policyVersionId, ruleKey: waiver.ruleKey, expiresAt: waiver.expiresAt, reason: waiver.reason })) },
      evidenceSnapshot: { documentStates: workspace.documents.map(document => ({ id: document.id, type: document.documentType, status: document.status })), unresolvedReleaseDependencies: result.unresolvedReleaseDependencies, openExceptions: result.openExceptions },
      runBy: ctx.user.id,
    });
    await appendTradeEvent({ tradeId: input.tradeId, actorId: ctx.user.id, eventType: "preflight.rerun", title: "Preflight rerun retained", detail: `Release result: ${result.summary}. ${result.unresolvedReleaseDependencies} unresolved release dependencies.`, source: "preflight_governance", afterState: { summary: result.summary, unresolvedReleaseDependencies: result.unresolvedReleaseDependencies } });
    return result;
  }),
  create: protectedProcedure.input(z.object({
    buyerName: z.string().min(2).max(180), buyerCountry: z.string().length(2), sellerName: z.string().min(2).max(180), sellerCountry: z.string().length(2),
    commodity: z.string().min(2).max(240), quantity: z.string().regex(/^\d+(\.\d{1,3})?$/), unit: z.string().min(1).max(24),
    unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/), totalValue: z.string().regex(/^\d+(\.\d{1,2})?$/), currency: z.string().length(3),
    incoterm: z.string().min(3).max(8), originCountry: z.string().length(2), destinationCountry: z.string().length(2), expectedShipmentDate: z.coerce.date(),
  })).mutation(async ({ ctx, input }) => {
    requireArcwayRole("trader", ctx.user.role);
    const reference = `AR-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const tradeId = await createTrade({ ownerId: ctx.user.id, organizationId: ctx.user.organizationId, reference, ...input, currency: input.currency.toUpperCase(), buyerCountry: input.buyerCountry.toUpperCase(), sellerCountry: input.sellerCountry.toUpperCase(), originCountry: input.originCountry.toUpperCase(), destinationCountry: input.destinationCountry.toUpperCase() });
    await createDocumentPlaceholders(tradeId);
    await appendTradeEvent({ tradeId, actorId: ctx.user.id, eventType: "trade.created", title: "Trade Twin created", detail: "Trade captured with its required evidence checklist." });
    return { tradeId, reference };
  }),
  submit: protectedProcedure.input(z.object({ tradeId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    requireArcwayRole("trader", ctx.user.role);
    const trade = await assertTradeAccess({ tradeId: input.tradeId, user: ctx.user });
    if (trade.assuranceState !== "draft") throw new TRPCError({ code: "BAD_REQUEST", message: "Only draft trades can be submitted." });
    await updateTradeAssurance({ tradeId: input.tradeId, assuranceState: "submitted", actorId: ctx.user.id });
    await appendTradeEvent({ tradeId: input.tradeId, actorId: ctx.user.id, eventType: "trade.submitted", title: "Submitted for review", detail: "Trader requested an assurance review." });
    await notifyOwner(buildOwnerNotification({ type: "trade_submitted", reference: trade.reference }));
    return { success: true };
  }),
  review: protectedProcedure.input(z.object({ tradeId: z.number().int().positive(), decision: z.enum(["approved", "rejected"]), reason: z.string().min(4).max(1200) })).mutation(async ({ ctx, input }) => {
    requireArcwayRole("reviewer", ctx.user.role);
    const trade = await assertTradeAccess({ tradeId: input.tradeId, user: ctx.user });
    if (!['submitted', 'under_review'].includes(trade.assuranceState)) throw new TRPCError({ code: "BAD_REQUEST", message: "The trade must be submitted before a final review decision." });
    await updateTradeAssurance({ tradeId: input.tradeId, assuranceState: input.decision, actorId: ctx.user.id, reason: input.reason });
    await appendTradeEvent({ tradeId: input.tradeId, actorId: ctx.user.id, eventType: `trade.${input.decision}`, title: `Trade ${input.decision}`, detail: input.reason, beforeState: { assuranceState: trade.assuranceState }, afterState: { assuranceState: input.decision } });
    await notifyOwner(buildOwnerNotification({ type: "trade_decided", reference: trade.reference, decision: input.decision, reason: input.reason }));
    return { success: true };
  }),
  exceptions: router({
    resolve: protectedProcedure.input(z.object({ exceptionId: z.number().int().positive(), outcome: z.enum(["corrected", "accepted_with_waiver", "rejected_source", "duplicate", "not_actionable"]).default("corrected"), rationale: z.string().min(4).max(1200) })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("reviewer", ctx.user.role);
      const exception = await getExceptionById(input.exceptionId);
      if (!exception) throw new TRPCError({ code: "NOT_FOUND", message: "Exception not found." });
      await assertTradeAccess({ tradeId: exception.tradeId, user: ctx.user });
      if (exception.status === "resolved") throw new TRPCError({ code: "BAD_REQUEST", message: "This exception is already resolved." });
      await resolveTradeException({ exceptionId: exception.id, reviewerId: ctx.user.id, outcome: input.outcome, rationale: input.rationale });
      await appendTradeEvent({ tradeId: exception.tradeId, actorId: ctx.user.id, eventType: "exception.resolved", title: "Exception resolved", detail: `${exception.title}: ${input.outcome.replaceAll("_", " ")} · ${input.rationale}`, beforeState: { status: "open" }, afterState: { status: "resolved", outcome: input.outcome } });
      return { success: true };
    }),
  }),
  obligations: router({
    fulfill: protectedProcedure.input(z.object({ obligationId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("trader", ctx.user.role);
      const obligation = await getObligationById(input.obligationId);
      if (!obligation) throw new TRPCError({ code: "NOT_FOUND", message: "Obligation not found." });
      await assertTradeAccess({ tradeId: obligation.tradeId, user: ctx.user });
      if (obligation.status === "fulfilled") throw new TRPCError({ code: "BAD_REQUEST", message: "This obligation is already fulfilled." });
      await fulfillTradeObligation({ obligationId: obligation.id });
      await appendTradeEvent({ tradeId: obligation.tradeId, actorId: ctx.user.id, eventType: "obligation.fulfilled", title: "Obligation fulfilled", detail: obligation.action, beforeState: { status: obligation.status }, afterState: { status: "fulfilled" } });
      return { success: true };
    }),
  }),
  partnerRequests: router({
    create: protectedProcedure.input(z.object({ tradeId: z.number().int().positive(), recipientEmail: z.string().email(), requestType: z.string().min(3).max(120), message: z.string().min(4).max(1200), scopes: z.array(z.enum(["trade.read", "cargo_ready_date.write", "packing_list.upload", "partner_request.respond"])).min(1).default(["partner_request.respond"]), dueAt: z.coerce.date().optional() })).mutation(async ({ ctx, input }) => {
      const trade = await assertTradeAccess({ tradeId: input.tradeId, user: ctx.user });
      const id = await createPartnerRequest({ ...input, requestedBy: ctx.user.id });
      await appendTradeEvent({ tradeId: trade.id, actorId: ctx.user.id, eventType: "partner.requested", title: "Partner evidence request sent", detail: `${input.requestType} requested from ${input.recipientEmail}${input.dueAt ? ` · due ${input.dueAt.toLocaleDateString()}` : ""}.`, afterState: { partnerRequestId: id, scopes: input.scopes } });
      return { id };
    }),
  }),
  ingestion: router({
    email: protectedProcedure.input(z.object({ tradeId: z.number().int().positive(), sender: z.string().email(), subject: z.string().min(3).max(255), body: z.string().min(4).max(20_000) })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("trader", ctx.user.role);
      const trade = await assertTradeAccess({ tradeId: input.tradeId, user: ctx.user });
      await ingestTradeEmail({ ...input, ingestedBy: ctx.user.id });
      await appendTradeEvent({ tradeId: trade.id, actorId: ctx.user.id, eventType: "email.ingested", title: "Email source ingested", detail: `${input.subject} — received from ${input.sender}.`, source: "email" });
      return { success: true };
    }),
  }),
  documents: router({
    upload: protectedProcedure.input(z.object({
      documentId: z.number().int().positive(), fileName: z.string().min(1).max(255), mimeType: z.enum(["application/pdf", "image/jpeg", "image/png", "text/plain", "text/csv"]), base64: z.string().min(10).max(15_000_000),
    })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("trader", ctx.user.role);
      const document = await getDocumentById(input.documentId);
      if (!document) throw new TRPCError({ code: "NOT_FOUND", message: "Document record not found." });
      const trade = await assertTradeAccess({ tradeId: document.tradeId, user: ctx.user });
      const buffer = Buffer.from(input.base64, "base64");
      if (!buffer.length || buffer.length > 10_000_000) throw new TRPCError({ code: "BAD_REQUEST", message: "Files must be between 1 byte and 10 MB." });
      const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const stored = await storagePut(`trades/${trade.id}/${document.documentType.replace(/[^a-z0-9]+/gi, "-")}/${Date.now()}-${safeName}`, buffer, input.mimeType);
      const fields = await extractDocumentFields({ buffer, mimeType: input.mimeType, documentType: document.documentType });
      const others = await getTradeDocuments(trade.id);
      const extracted = others.map(item => item.extractedData).filter((item): item is Record<string, unknown> => Boolean(item)).map(item => item as typeof fields);
      const inconsistencies = [...fields.issues, ...findCrossDocumentInconsistencies(fields, extracted)];
      await updateDocumentUpload({ documentId: document.id, userId: ctx.user.id, fileName: input.fileName, fileKey: stored.key, fileUrl: stored.url, mimeType: input.mimeType, extractedData: fields, inconsistencies });
      await appendTradeEvent({ tradeId: trade.id, actorId: ctx.user.id, eventType: "evidence.received", title: `${document.documentType} uploaded`, detail: inconsistencies.length ? `${inconsistencies.length} consistency flag(s) require reviewer attention.` : "Document saved and structured fields extracted." });
      if (inconsistencies.length) {
        await createInconsistencyExceptions({ tradeId: trade.id, documentId: document.id, issues: inconsistencies });
        await notifyOwner(buildOwnerNotification({ type: "document_inconsistent", reference: trade.reference, documentType: document.documentType, count: inconsistencies.length }));
      }
      const trust = await refreshScore(trade.id);
      return { success: true, fields, inconsistencies, trust };
    }),
    review: protectedProcedure.input(z.object({ documentId: z.number().int().positive(), status: z.enum(["under review", "verified", "rejected"]), reviewerNotes: z.string().max(2000).optional() })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("reviewer", ctx.user.role);
      const document = await getDocumentById(input.documentId);
      if (!document) throw new TRPCError({ code: "NOT_FOUND", message: "Document record not found." });
      const trade = await assertTradeAccess({ tradeId: document.tradeId, user: ctx.user });
      if (document.status === "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "A document must be uploaded before review." });
      assertDocumentTransition(document.status, input.status);
      await updateDocumentReview({ documentId: input.documentId, reviewerId: ctx.user.id, status: input.status, reviewerNotes: input.reviewerNotes });
      await appendTradeEvent({ tradeId: trade.id, actorId: ctx.user.id, eventType: `document.${input.status.replace(/\s+/g, "_")}`, title: `${document.documentType} marked ${input.status}`, detail: input.reviewerNotes ?? "Reviewer status updated." });
      const trust = await refreshScore(trade.id);
      return { success: true, trust };
    }),
  }),
});
