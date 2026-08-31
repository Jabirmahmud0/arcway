import { TRPCError } from "@trpc/server";
import { createHash } from "crypto";
import { z } from "zod";
import {
  addShipmentEvent,
  addTradeComment,
  appendAuditRecord,
  createApproval,
  createCounterparty,
  createCounterpartyVersion,
  createPolicyPack,
  createPolicyObligationBinding,
  createProduct,
  createProductVersion,
  createShipment,
  createTradeRevision,
  decideApproval,
  getTradeById,
  listOrganizationMasters,
  recordPayment,
  upsertPaymentTerm,
  connectIntegration,
  createImportMapping,
  getImportMappingForUser,
  listImportMappingsForUser,
  listIntegrationOperations,
  listTradesForUser,
  listShipmentSearchRecordsForUser,
  recordExternalReference,
  recordIntegrationRun,
  routeSourceIngestionReceipt,
  createTradeTask,
  updateTradeTaskStatus,
  createGeneratedDocument,
  createPreflightWaiver,
  revokePreflightWaiver,
  correctDocumentExtraction,
  getDocumentById,
  addObligationDependency,
  createObligationTemplate,
  appendTradeEvent,
  createTradeObligation,
  escalateObligation,
  getTradeWorkspace,
  getPolicyGovernanceData,
  getHistoricalShadowAuditReview,
  getPolicyObligationPreview,
  listObligationTemplates,
  listSourceIngestionReceiptsForUser,
  getTradeTaskById,
  createCanonicalResolution,
  createSourceIngestionReceipt,
  createConfirmedEvidenceField,
  getSourceIngestionReceiptById,
  getPartnerRequestById,
  listPartnerRequestsForUser,
  openWorkflowAlert,
  replaySourceIngestionReceipt,
  remindPartnerRequest,
  updatePartnerRequestStatus,
  runObligationEscalationSweep,
  runSourceHealthSweep,
  updateWorkflowAlert,
  upsertWorkflowAlertPolicy,
  getOperationalSchedule,
  registerOperationalSchedule,
  listOrganizationExceptionsForAlertQuality,
} from "../db";
import { buildChangeImpact } from "../changeImpact";
import { evaluateLcPreflight } from "../lcPreflight";
import { requireArcwayRole } from "../access";
import { protectedProcedure, router } from "../_core/trpc";
import { providerCatalog, simulateProviderRun } from "../integrations/registry";
import { storagePut } from "../storage";
import { applyStructuredFieldMapping } from "../structuredMapping";
import { canTransitionPartnerRequest } from "../partnerAccess";
import { parseStructuredSpreadsheet } from "../structuredSpreadsheet";
import { rankTradeTwinCandidates } from "../sourceMatching";
import { buildTradeCriticalPath } from "../criticalPath";
import { buildEntityResolutionProposals } from "../entityResolution";
import { extractCommitmentCandidates } from "../commitmentExtraction";
import { buildAssuranceExplanation } from "../assuranceExplanation";
import { buildOperationalMessageDraft } from "../messageDrafting";
import { buildSourcePartyAliasProposals } from "../sourcePartyAlias";
import { isValidSixFieldUtcCron } from "../operationalSchedule";
import { buildAlertQualityMetrics } from "../alertQuality";
import { runDeterministicEvaluation } from "../deterministicEvaluation";
import { createHeartbeatJob, updateHeartbeatJob } from "../_core/heartbeat";
import { COOKIE_NAME } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";

function workspaceId(user: { organizationId?: number | null }) {
  if (!user.organizationId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Workspace provisioning is still completing. Please refresh and retry." });
  return user.organizationId;
}

async function assertWorkspaceTrade(tradeId: number, user: { id: number; role: "trader" | "reviewer"; organizationId?: number | null }) {
  const trade = await getTradeById(tradeId);
  if (!trade || trade.organizationId !== workspaceId(user)) throw new TRPCError({ code: "NOT_FOUND", message: "Trade Twin not found in this workspace." });
  if (user.role === "trader" && trade.ownerId !== user.id) throw new TRPCError({ code: "FORBIDDEN", message: "You can operate only on your own Trade Twins." });
  return trade;
}

export const operationsRouter = router({
  masters: router({
    list: protectedProcedure.query(({ ctx }) => listOrganizationMasters(workspaceId(ctx.user))),
    createCounterparty: protectedProcedure.input(z.object({ legalName: z.string().min(2), countryCode: z.string().length(2), tradingNames: z.array(z.string()).optional(), contacts: z.array(z.object({ name: z.string(), email: z.string().email().optional(), phone: z.string().optional() })).optional(), requiredCertificates: z.array(z.string()).optional() })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("trader", ctx.user.role);
      return { id: await createCounterparty({ ...input, organizationId: workspaceId(ctx.user), countryCode: input.countryCode.toUpperCase() }) };
    }),
    createProduct: protectedProcedure.input(z.object({ sku: z.string().min(1), description: z.string().min(2), buyerSku: z.string().optional(), countryOfOrigin: z.string().length(2).optional(), hsClassification: z.string().optional(), leadTimeDays: z.number().int().nonnegative().optional(), certifications: z.array(z.string()).optional() })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("trader", ctx.user.role);
      return { id: await createProduct({ ...input, organizationId: workspaceId(ctx.user), countryOfOrigin: input.countryOfOrigin?.toUpperCase() }) };
    }),
    createCounterpartyVersion: protectedProcedure.input(z.object({ sourceId: z.number().int().positive(), legalName: z.string().min(2).optional(), countryCode: z.string().length(2).optional(), tradingNames: z.array(z.string().min(2).max(255)).optional(), requiredCertificates: z.array(z.string()).optional(), contacts: z.array(z.object({ name: z.string(), email: z.string().email().optional(), phone: z.string().optional() })).optional() })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("reviewer", ctx.user.role);
      const organizationId = workspaceId(ctx.user); const id = await createCounterpartyVersion({ ...input, organizationId, countryCode: input.countryCode?.toUpperCase() });
      await appendAuditRecord({ organizationId, actorId: ctx.user.id, action: "master.counterparty_version_created", objectType: "counterparty", objectId: String(id), afterState: input, reason: "Reviewer created immutable counterparty master successor" }); return { id };
    }),
    entityResolutionPreview: protectedProcedure.query(async ({ ctx }) => {
      requireArcwayRole("reviewer", ctx.user.role);
      const masters = await listOrganizationMasters(workspaceId(ctx.user));
      return buildEntityResolutionProposals(masters.counterparties);
    }),
    sourcePartyAliasPreview: protectedProcedure.input(z.object({ receiptId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      requireArcwayRole("reviewer", ctx.user.role);
      const organizationId = workspaceId(ctx.user); const receipt = await getSourceIngestionReceiptById(input.receiptId);
      if (!receipt || receipt.organizationId !== organizationId) throw new TRPCError({ code: "NOT_FOUND", message: "Source receipt not found in this workspace." });
      const masters = await listOrganizationMasters(organizationId);
      return { receipt: { id: receipt.id, fileName: receipt.fileName, sourceType: receipt.sourceType, tradeId: receipt.tradeId }, proposals: buildSourcePartyAliasProposals(receipt.rawPayload, masters.counterparties) };
    }),
    confirmEntityAlias: protectedProcedure.input(z.object({ sourceId: z.number().int().positive(), alias: z.string().min(2).max(255), rationale: z.string().min(12).max(1000), sourceReceiptId: z.number().int().positive().optional() })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("reviewer", ctx.user.role);
      const organizationId = workspaceId(ctx.user); const masters = await listOrganizationMasters(organizationId); const source = masters.counterparties.find(counterparty => counterparty.id === input.sourceId && !counterparty.validTo);
      if (!source) throw new TRPCError({ code: "NOT_FOUND", message: "An active counterparty master was not found in this workspace." });
      let receiptProvenance: { id: number; fileName: string | null; payloadHash: string | null } | undefined;
      if (input.sourceReceiptId) {
        const receipt = await getSourceIngestionReceiptById(input.sourceReceiptId);
        if (!receipt || receipt.organizationId !== organizationId) throw new TRPCError({ code: "NOT_FOUND", message: "Source receipt not found in this workspace." });
        const proposed = buildSourcePartyAliasProposals(receipt.rawPayload, masters.counterparties).some(proposal => proposal.master.id === source.id && proposal.sourceName.trim().toLowerCase() === input.alias.trim().toLowerCase());
        if (!proposed) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The retained source receipt does not contain this bounded alias proposal for the selected master." });
        receiptProvenance = { id: receipt.id, fileName: receipt.fileName, payloadHash: receipt.payloadHash };
      }
      const existing = Array.isArray(source.tradingNames) ? source.tradingNames.filter((item): item is string => typeof item === "string") : [];
      const alias = input.alias.trim(); if ([source.legalName, ...existing].some(item => item.toLowerCase() === alias.toLowerCase())) throw new TRPCError({ code: "CONFLICT", message: "This alias is already retained for the active counterparty master." });
      const id = await createCounterpartyVersion({ organizationId, sourceId: source.id, tradingNames: [...existing, alias] });
      await appendAuditRecord({ organizationId, actorId: ctx.user.id, action: "master.counterparty_alias_confirmed", objectType: "counterparty", objectId: String(id), beforeState: { sourceId: source.id, tradingNames: existing }, afterState: { alias, rationale: input.rationale, successorId: id, sourceReceipt: receiptProvenance, noMasterMerge: true }, reason: "Reviewer confirmed a deterministic entity-resolution alias; no master records were merged." });
      return { id };
    }),
    createProductVersion: protectedProcedure.input(z.object({ sourceId: z.number().int().positive(), description: z.string().min(2).optional(), buyerSku: z.string().optional(), countryOfOrigin: z.string().length(2).optional(), hsClassification: z.string().optional(), leadTimeDays: z.number().int().nonnegative().optional(), certifications: z.array(z.string()).optional() })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("reviewer", ctx.user.role);
      const organizationId = workspaceId(ctx.user); const id = await createProductVersion({ ...input, organizationId, countryOfOrigin: input.countryOfOrigin?.toUpperCase() });
      await appendAuditRecord({ organizationId, actorId: ctx.user.id, action: "master.product_version_created", objectType: "product", objectId: String(id), afterState: input, reason: "Reviewer created immutable product master successor" }); return { id };
    }),
  }),
  policies: router({
    list: protectedProcedure.query(({ ctx }) => { requireArcwayRole("reviewer", ctx.user.role); return getPolicyGovernanceData(workspaceId(ctx.user)); }),
    create: protectedProcedure.input(z.object({ name: z.string().min(3), scope: z.enum(["company", "counterparty", "product", "route", "payment", "transport", "jurisdiction"]), rules: z.array(z.object({ if: z.record(z.string(), z.unknown()), then: z.record(z.string(), z.unknown()) })), jurisdiction: z.string().optional() })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("reviewer", ctx.user.role);
      const organizationId = workspaceId(ctx.user); const id = await createPolicyPack({ organizationId, ownerId: ctx.user.id, ...input }); await appendAuditRecord({ organizationId, actorId: ctx.user.id, action: "policy_pack.created", objectType: "policy_pack", objectId: String(id), afterState: input, reason: "Reviewer policy pack and version authored" }); return { id };
    }),
    bindObligation: protectedProcedure.input(z.object({ policyPackId: z.number().int().positive(), obligationTemplateId: z.number().int().positive(), counterpartyId: z.number().int().positive().optional(), productId: z.number().int().positive().optional(), relationshipRole: z.enum(["buyer", "supplier", "forwarder", "carrier", "bank", "inspector", "any"]).default("any"), source: z.string().max(180).optional() })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("reviewer", ctx.user.role);
      const organizationId = workspaceId(ctx.user); const id = await createPolicyObligationBinding({ ...input, organizationId, createdBy: ctx.user.id });
      await appendAuditRecord({ organizationId, actorId: ctx.user.id, action: "policy_obligation_binding.created", objectType: "policy_obligation_binding", objectId: String(id), afterState: input, reason: "Reviewer bound a governed policy to a reusable obligation template" }); return { id };
    }),
    obligationPreview: protectedProcedure.input(z.object({ tradeId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      requireArcwayRole("reviewer", ctx.user.role); await assertWorkspaceTrade(input.tradeId, ctx.user); return getPolicyObligationPreview(input.tradeId, workspaceId(ctx.user));
    }),
    applyPreview: protectedProcedure.input(z.object({ tradeId: z.number().int().positive(), bindingId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("reviewer", ctx.user.role); const trade = await assertWorkspaceTrade(input.tradeId, ctx.user); const preview = await getPolicyObligationPreview(trade.id, workspaceId(ctx.user)); const candidate = preview.find(item => item.bindingId === input.bindingId);
      if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "The policy binding is not active for this Trade Twin." });
      if (candidate.alreadyApplied) return { existing: true, id: null };
      if (!candidate.eligible) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Configured policy conditions do not currently match this Trade Twin." });
      const deadline = candidate.template.dueOffsetHours !== null ? new Date(Date.now() + candidate.template.dueOffsetHours * 60 * 60 * 1000) : undefined;
      const id = await createTradeObligation({ tradeId: trade.id, actor: candidate.template.actor, action: candidate.template.action, evidenceRequirement: candidate.template.evidenceRequirement ?? undefined, criticality: candidate.template.criticality, deadline, source: candidate.source });
      await appendTradeEvent({ tradeId: trade.id, actorId: ctx.user.id, eventType: "policy.obligation_applied", title: "Policy-derived obligation instantiated", detail: `${candidate.policy.name} v${candidate.policy.version} → ${candidate.template.name}`, source: "policy_engine", afterState: { policyBindingId: candidate.bindingId, policyVersionId: candidate.policy.versionId, obligationId: id, boundary: candidate.boundary } }); return { existing: false, id };
    }),
  }),
  preflight: router({
    createWaiver: protectedProcedure.input(z.object({ tradeId: z.number().int().positive(), policyVersionId: z.number().int().positive().optional(), ruleKey: z.string().min(3), reason: z.string().min(12), expiresAt: z.coerce.date() })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("reviewer", ctx.user.role);
      await assertWorkspaceTrade(input.tradeId, ctx.user);
      if (input.expiresAt <= new Date()) throw new TRPCError({ code: "BAD_REQUEST", message: "A waiver expiry must be in the future." });
      return { id: await createPreflightWaiver({ ...input, approvedBy: ctx.user.id }) };
    }),
    revokeWaiver: protectedProcedure.input(z.object({ waiverId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("reviewer", ctx.user.role);
      await revokePreflightWaiver(input.waiverId);
      return { success: true };
    }),
  }),
  obligations: router({
    listTemplates: protectedProcedure.query(({ ctx }) => listObligationTemplates(workspaceId(ctx.user))),
    createTemplate: protectedProcedure.input(z.object({ name: z.string().min(3), actor: z.string().min(2), action: z.string().min(4), evidenceRequirement: z.string().min(3).optional(), criticality: z.enum(["critical", "warning", "information"]).default("information"), dueOffsetHours: z.number().int().min(0).max(8760).optional(), releaseCondition: z.record(z.string(), z.unknown()).optional() })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("reviewer", ctx.user.role);
      const id = await createObligationTemplate({ organizationId: workspaceId(ctx.user), createdBy: ctx.user.id, ...input });
      return { id };
    }),
    applyTemplate: protectedProcedure.input(z.object({ tradeId: z.number().int().positive(), templateId: z.number().int().positive(), deadline: z.coerce.date().optional() })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("trader", ctx.user.role);
      const trade = await assertWorkspaceTrade(input.tradeId, ctx.user);
      const template = (await listObligationTemplates(workspaceId(ctx.user))).find(item => item.id === input.templateId && item.active === 1);
      if (!template) throw new TRPCError({ code: "NOT_FOUND", message: "Active obligation template not found in this workspace." });
      const deadline = input.deadline ?? (template.dueOffsetHours !== null ? new Date(Date.now() + template.dueOffsetHours * 60 * 60 * 1000) : undefined);
      const id = await createTradeObligation({ tradeId: trade.id, actor: template.actor, action: template.action, evidenceRequirement: template.evidenceRequirement ?? undefined, criticality: template.criticality, deadline, source: `template:${template.id}` });
      await appendTradeEvent({ tradeId: trade.id, actorId: ctx.user.id, eventType: "obligation_created", title: "Obligation instantiated from template", detail: `${template.name} · ${template.actor}: ${template.action}`, source: "obligation_management" });
      return { id };
    }),
    addDependency: protectedProcedure.input(z.object({ tradeId: z.number().int().positive(), obligationId: z.number().int().positive(), dependsOnObligationId: z.number().int().positive(), dependencyType: z.enum(["blocks_release", "blocks_task", "evidence_prerequisite"]).default("blocks_release") })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("reviewer", ctx.user.role);
      if (input.obligationId === input.dependsOnObligationId) throw new TRPCError({ code: "BAD_REQUEST", message: "An obligation cannot depend on itself." });
      await assertWorkspaceTrade(input.tradeId, ctx.user);
      const workspace = await getTradeWorkspace(input.tradeId);
      const ids = new Set(workspace?.obligations.map(item => item.id) ?? []);
      if (!ids.has(input.obligationId) || !ids.has(input.dependsOnObligationId)) throw new TRPCError({ code: "BAD_REQUEST", message: "Both obligations must belong to this Trade Twin." });
      if (workspace?.obligationDependencies.some(item => item.obligationId === input.dependsOnObligationId && item.dependsOnObligationId === input.obligationId)) throw new TRPCError({ code: "BAD_REQUEST", message: "This dependency would create a two-node release cycle." });
      await addObligationDependency(input);
      await appendTradeEvent({ tradeId: input.tradeId, actorId: ctx.user.id, eventType: "obligation_dependency_added", title: "Obligation dependency recorded", detail: `${input.obligationId} depends on ${input.dependsOnObligationId} (${input.dependencyType})`, source: "obligation_management" });
      return { success: true };
    }),
    escalate: protectedProcedure.input(z.object({ tradeId: z.number().int().positive(), obligationId: z.number().int().positive(), reason: z.string().min(8).max(2000) })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("reviewer", ctx.user.role);
      await assertWorkspaceTrade(input.tradeId, ctx.user);
      const workspace = await getTradeWorkspace(input.tradeId);
      const obligation = workspace?.obligations.find(item => item.id === input.obligationId);
      if (!obligation) throw new TRPCError({ code: "NOT_FOUND", message: "Obligation not found in this Trade Twin." });
      await escalateObligation({ obligationId: input.obligationId, reason: input.reason, escalatedBy: ctx.user.id });
      await appendTradeEvent({ tradeId: input.tradeId, actorId: ctx.user.id, eventType: "obligation_escalated", title: "Obligation escalated", detail: `${obligation.actor}: ${obligation.action}. ${input.reason}`, source: "obligation_management" });
      return { success: true };
    }),
  }),
  canonicalization: router({
    impact: protectedProcedure.input(z.object({ tradeId: z.number().int().positive(), fieldName: z.string().min(2).max(120), selectedValue: z.string().max(20_000).optional() })).query(async ({ ctx, input }) => {
      requireArcwayRole("reviewer", ctx.user.role);
      await assertWorkspaceTrade(input.tradeId, ctx.user);
      const workspace = await getTradeWorkspace(input.tradeId);
      if (!workspace) throw new TRPCError({ code: "NOT_FOUND", message: "Trade Twin not found." });
      return buildChangeImpact({ fieldName: input.fieldName, selectedValue: input.selectedValue, workspace });
    }),
    resolve: protectedProcedure.input(z.object({ tradeId: z.number().int().positive(), fieldName: z.string().min(2).max(120), selectedEvidenceFieldId: z.number().int().positive().optional(), selectedValue: z.string().min(1).max(20_000), conflictingEvidenceFieldIds: z.array(z.number().int().positive()).max(50).optional(), rationale: z.string().min(12).max(5000), policyContext: z.record(z.string(), z.unknown()).optional() })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("reviewer", ctx.user.role);
      await assertWorkspaceTrade(input.tradeId, ctx.user);
      const workspace = await getTradeWorkspace(input.tradeId);
      if (!workspace) throw new TRPCError({ code: "NOT_FOUND", message: "Trade Twin not found." });
      const evidenceIds = new Set(workspace.fields.map(field => field.id));
      if (input.selectedEvidenceFieldId && !evidenceIds.has(input.selectedEvidenceFieldId)) throw new TRPCError({ code: "BAD_REQUEST", message: "Selected evidence field is not part of this Trade Twin." });
      if (input.conflictingEvidenceFieldIds?.some(id => !evidenceIds.has(id))) throw new TRPCError({ code: "BAD_REQUEST", message: "A conflicting evidence field is not part of this Trade Twin." });
      const id = await createCanonicalResolution({ ...input, resolvedBy: ctx.user.id });
      await appendTradeEvent({ tradeId: input.tradeId, actorId: ctx.user.id, eventType: "canonical.resolved", title: `Canonical ${input.fieldName} resolved`, detail: input.rationale, source: "canonicalization", afterState: { selectedValue: input.selectedValue, selectedEvidenceFieldId: input.selectedEvidenceFieldId, canonicalResolutionId: id } });
      return { id };
    }),
  }),
  shipments: router({
    list: protectedProcedure.query(({ ctx }) => listShipmentSearchRecordsForUser({ id: ctx.user.id, role: ctx.user.role, organizationId: workspaceId(ctx.user) })),
    create: protectedProcedure.input(z.object({ tradeId: z.number().int().positive(), mode: z.enum(["sea", "air", "road", "rail", "multimodal"]), carrier: z.string().optional(), forwarder: z.string().optional(), bookingReference: z.string().optional(), origin: z.string().optional(), destination: z.string().optional(), etd: z.coerce.date().optional(), eta: z.coerce.date().optional(), vessel: z.string().optional(), voyage: z.string().optional(), allocatedQuantity: z.string().optional(), allocatedValue: z.string().optional() })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("trader", ctx.user.role); await assertWorkspaceTrade(input.tradeId, ctx.user);
      return { id: await createShipment({ organizationId: workspaceId(ctx.user), ...input }) };
    }),
    addEvent: protectedProcedure.input(z.object({ tradeId: z.number().int().positive(), shipmentId: z.number().int().positive(), eventType: z.string().min(2), location: z.string().optional(), plannedAt: z.coerce.date().optional(), actualAt: z.coerce.date().optional() })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("trader", ctx.user.role); await assertWorkspaceTrade(input.tradeId, ctx.user);
      await addShipmentEvent(input); return { success: true };
    }),
  }),
  settlement: router({
    lcPreflight: protectedProcedure.input(z.object({ tradeId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      requireArcwayRole("reviewer", ctx.user.role);
      await assertWorkspaceTrade(input.tradeId, ctx.user);
      const workspace = await getTradeWorkspace(input.tradeId);
      if (!workspace) throw new TRPCError({ code: "NOT_FOUND", message: "Trade Twin not found." });
      return evaluateLcPreflight(workspace);
    }),
    upsertTerms: protectedProcedure.input(z.object({ tradeId: z.number().int().positive(), method: z.enum(["open_account", "advance", "letter_of_credit", "documentary_collection", "other"]), depositPercent: z.string().optional(), presentationDays: z.number().int().positive().optional(), latestShipmentDate: z.coerce.date().optional(), dueDate: z.coerce.date().optional(), lcReference: z.string().optional(), specialClauses: z.array(z.string()).optional() })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("trader", ctx.user.role); await assertWorkspaceTrade(input.tradeId, ctx.user); await upsertPaymentTerm(input); return { success: true };
    }),
    recordPayment: protectedProcedure.input(z.object({ tradeId: z.number().int().positive(), paymentTermId: z.number().int().positive().optional(), amount: z.string(), currency: z.string().length(3), status: z.enum(["expected", "received", "overdue", "disputed"]), evidenceDocumentId: z.number().int().positive().optional() })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("trader", ctx.user.role); await assertWorkspaceTrade(input.tradeId, ctx.user); await recordPayment({ ...input, currency: input.currency.toUpperCase() }); return { success: true };
    }),
  }),
  approvals: router({
    request: protectedProcedure.input(z.object({ tradeId: z.number().int().positive(), exceptionId: z.number().int().positive().optional(), type: z.string().min(3), approverId: z.number().int().positive().optional(), reason: z.string().min(4) })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("trader", ctx.user.role); await assertWorkspaceTrade(input.tradeId, ctx.user);
      return { id: await createApproval({ organizationId: workspaceId(ctx.user), requestedBy: ctx.user.id, ...input }) };
    }),
    decide: protectedProcedure.input(z.object({ approvalId: z.number().int().positive(), status: z.enum(["approved", "rejected"]), decisionReason: z.string().min(4) })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("reviewer", ctx.user.role); await decideApproval({ ...input, approverId: ctx.user.id }); return { success: true };
    }),
  }),
  collaboration: router({
    comment: protectedProcedure.input(z.object({ tradeId: z.number().int().positive(), exceptionId: z.number().int().positive().optional(), parentId: z.number().int().positive().optional(), body: z.string().min(1).max(5000) })).mutation(async ({ ctx, input }) => {
      await assertWorkspaceTrade(input.tradeId, ctx.user); await addTradeComment({ ...input, authorId: ctx.user.id }); return { success: true };
    }),
    partnerRequests: protectedProcedure.query(({ ctx }) => listPartnerRequestsForUser({ id: ctx.user.id, role: ctx.user.role, organizationId: workspaceId(ctx.user) })),
    updatePartnerRequest: protectedProcedure.input(z.object({ requestId: z.number().int().positive(), status: z.enum(["viewed", "accepted", "completed", "overdue", "cancelled"]) })).mutation(async ({ ctx, input }) => {
      const request = await getPartnerRequestById(input.requestId); if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Partner request not found." }); await assertWorkspaceTrade(request.tradeId, ctx.user); if (!canTransitionPartnerRequest(request.status, input.status)) throw new TRPCError({ code: "BAD_REQUEST", message: "This partner-request status transition is not permitted." });
      await updatePartnerRequestStatus(input); await appendTradeEvent({ tradeId: request.tradeId, actorId: ctx.user.id, eventType: "partner.status_updated", title: "Partner request status updated", detail: `${request.requestType} marked ${input.status}.`, source: "collaboration", afterState: { partnerRequestId: request.id, status: input.status } }); return { success: true };
    }),
    remindPartnerRequest: protectedProcedure.input(z.object({ requestId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const request = await getPartnerRequestById(input.requestId); if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Partner request not found." }); await assertWorkspaceTrade(request.tradeId, ctx.user);
      await remindPartnerRequest(request.id); await appendTradeEvent({ tradeId: request.tradeId, actorId: ctx.user.id, eventType: "partner.reminder_recorded", title: "Partner reminder recorded", detail: `${request.requestType} reminder to ${request.recipientEmail}.`, source: "collaboration" }); return { success: true };
    }),
  }),
  history: router({
    recordRevision: protectedProcedure.input(z.object({ tradeId: z.number().int().positive(), reason: z.string().min(4), beforeState: z.unknown().optional(), afterState: z.unknown(), source: z.string().min(2), observedAt: z.coerce.date().optional() })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("reviewer", ctx.user.role); await assertWorkspaceTrade(input.tradeId, ctx.user); await createTradeRevision({ ...input, recordedBy: ctx.user.id }); return { success: true };
    }),
  }),
  integrations: router({
    catalog: protectedProcedure.query(() => providerCatalog),
    mappings: protectedProcedure.query(({ ctx }) => listImportMappingsForUser({ userId: ctx.user.id, role: ctx.user.role, organizationId: workspaceId(ctx.user) })),
    list: protectedProcedure.query(({ ctx }) => { requireArcwayRole("reviewer", ctx.user.role); return listIntegrationOperations(workspaceId(ctx.user)); }),
    connect: protectedProcedure.input(z.object({ providerType: z.enum(["email", "storage", "erp", "carrier", "visibility", "ebl", "compliance", "payment", "finance", "identity"]) })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("reviewer", ctx.user.role);
      const provider = providerCatalog.find(item => item.type === input.providerType);
      if (!provider) throw new TRPCError({ code: "BAD_REQUEST", message: "Unsupported provider type." });
      const id = await connectIntegration({ organizationId: workspaceId(ctx.user), providerType: input.providerType, providerName: provider.name, createdBy: ctx.user.id });
      return { id };
    }),
    runMock: protectedProcedure.input(z.object({ integrationId: z.number().int().positive(), providerType: z.enum(["email", "storage", "erp", "carrier", "visibility", "ebl", "compliance", "payment", "finance", "identity"]), tradeId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("reviewer", ctx.user.role);
      const trade = await assertWorkspaceTrade(input.tradeId, ctx.user);
      const normalized = simulateProviderRun(input.providerType, trade.reference);
      await recordIntegrationRun({ organizationId: workspaceId(ctx.user), integrationId: input.integrationId, runType: "operator_mock_ingestion", status: "completed", inputSummary: { tradeReference: trade.reference }, outputSummary: normalized.output });
      await recordExternalReference({ organizationId: workspaceId(ctx.user), tradeId: trade.id, entityType: normalized.entityType, providerName: input.providerType, externalId: normalized.externalId, payload: normalized.output, observedAt: new Date() });
      return { normalized };
    }),
    ingestSource: protectedProcedure.input(z.object({ tradeId: z.number().int().positive().optional(), integrationId: z.number().int().positive().optional(), mappingId: z.number().int().positive().optional(), sourceType: z.enum(["email_attachment", "structured_file", "webhook"]), fileName: z.string().min(1).max(255).optional(), mimeType: z.enum(["application/pdf", "image/jpeg", "image/png", "text/plain", "text/csv", "application/json", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]).optional(), base64: z.string().min(4).max(15_000_000).optional(), payload: z.record(z.string(), z.unknown()).optional(), simulateFailure: z.boolean().default(false) })).mutation(async ({ ctx, input }) => {
      if (input.sourceType === "webhook") requireArcwayRole("reviewer", ctx.user.role); else requireArcwayRole("trader", ctx.user.role);
      const trade = input.tradeId ? await assertWorkspaceTrade(input.tradeId, ctx.user) : undefined;
      if (input.base64 && (!input.fileName || !input.mimeType)) throw new TRPCError({ code: "BAD_REQUEST", message: "A file name and MIME type are required for attachment intake." });
      const buffer = input.base64 ? Buffer.from(input.base64, "base64") : undefined;
      if (buffer && (!buffer.length || buffer.length > 10_000_000)) throw new TRPCError({ code: "BAD_REQUEST", message: "Source files must be between 1 byte and 10 MB." });
      const payloadHash = createHash("sha256").update(input.base64 ?? JSON.stringify(input.payload ?? {})).digest("hex");
      const stored = buffer && input.fileName && input.mimeType ? await storagePut(`ingestion/${workspaceId(ctx.user)}/${trade?.id ?? "unlinked"}/${Date.now()}-${input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`, buffer, input.mimeType) : undefined;
      let normalizedPayload = input.payload ?? { fileName: input.fileName, byteLength: buffer?.length ?? 0 };
      if (buffer && (input.mimeType === "text/csv" || input.mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")) {
        try {
          normalizedPayload = { ...normalizedPayload, workbook: parseStructuredSpreadsheet(buffer) };
        } catch (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `The uploaded structured file could not be parsed: ${error instanceof Error ? error.message : "unknown workbook error"}` });
        }
      }
      if (input.mappingId) {
        const mapping = await getImportMappingForUser({ mappingId: input.mappingId, userId: ctx.user.id, role: ctx.user.role, organizationId: workspaceId(ctx.user) });
        if (!mapping) throw new TRPCError({ code: "NOT_FOUND", message: "The selected structured-file mapping is unavailable in this workspace." });
        const map = (mapping.mapping && typeof mapping.mapping === "object" ? mapping.mapping : {}) as Record<string, string>;
        const preview = Array.isArray((normalizedPayload as { workbook?: { preview?: unknown[] } }).workbook?.preview) ? (normalizedPayload as { workbook: { preview: Record<string, unknown>[] } }).workbook.preview : [];
        const mappedPreview = applyStructuredFieldMapping(preview, map);
        normalizedPayload = { ...normalizedPayload, mappingApplication: { mappingId: mapping.id, sourceName: mapping.sourceName, canonicalFieldMap: map, mappedPreview, adoption: "review_required" } };
      }
      const normalizedStatus = input.simulateFailure ? "failed" as const : "normalized" as const;
      const candidates = trade ? [] : rankTradeTwinCandidates(normalizedPayload, (await listTradesForUser(ctx.user)).map(item => ({ id: item.id, reference: item.reference, buyerName: item.buyerName, sellerName: item.sellerName, commodity: item.commodity, expectedShipmentDate: item.expectedShipmentDate, totalValue: item.totalValue, currency: item.currency, shipmentReferences: item.shipmentReferences })));
      const routingContext = trade ? undefined : { scoreVersion: "deterministic-v2", evaluatedAt: new Date().toISOString(), candidates };
      const receiptId = await createSourceIngestionReceipt({ organizationId: workspaceId(ctx.user), tradeId: trade?.id, integrationId: input.integrationId, sourceType: input.sourceType, fileName: input.fileName, fileKey: stored?.key, fileUrl: stored?.url, mimeType: input.mimeType, payloadHash, rawPayload: normalizedPayload, normalizedStatus, routingStatus: trade ? "routed" : "pending", routingContext, errorMessage: input.simulateFailure ? "Normalization failed by operator test; replay is required." : undefined, createdBy: ctx.user.id });
      if (input.simulateFailure) {
        await openWorkflowAlert({ organizationId: workspaceId(ctx.user), integrationId: input.integrationId, severity: "warning", title: "Source normalization requires recovery", detail: `${input.sourceType.replaceAll("_", " ")} receipt ${receiptId} failed normalization and is queued for replay.`, dedupeKey: `receipt-${receiptId}-normalization` });
      } else if (trade) {
        await recordExternalReference({ organizationId: workspaceId(ctx.user), tradeId: trade.id, entityType: input.sourceType, providerName: input.sourceType, externalId: `receipt-${receiptId}-${payloadHash.slice(0, 12)}`, payload: normalizedPayload, observedAt: new Date() });
      }
      if (trade) await appendTradeEvent({ tradeId: trade.id, actorId: ctx.user.id, eventType: `source.${input.sourceType}`, title: `${input.sourceType.replaceAll("_", " ")} intake ${input.simulateFailure ? "failed" : "normalized"}`, detail: input.fileName ?? `Receipt ${receiptId}`, source: "ingestion" });
      else await appendAuditRecord({ organizationId: workspaceId(ctx.user), actorId: ctx.user.id, action: "source_receipt.unlinked_intake", objectType: "source_receipt", objectId: String(receiptId), afterState: { sourceType: input.sourceType, normalizedStatus, candidateCount: candidates.length, payloadHash }, reason: "Source receipt retained without a Trade Twin; explicit human routing is required." });
      return { receiptId, status: normalizedStatus, routingStatus: trade ? "routed" as const : "pending" as const, candidates, fileUrl: stored?.url };
    }),
    routeUnlinkedReceipt: protectedProcedure.input(z.object({ receiptId: z.number().int().positive(), tradeId: z.number().int().positive(), rationale: z.string().min(12).max(2000) })).mutation(async ({ ctx, input }) => {
      const receipt = await getSourceIngestionReceiptById(input.receiptId);
      if (!receipt || receipt.organizationId !== workspaceId(ctx.user) || receipt.tradeId || receipt.routingStatus !== "pending") throw new TRPCError({ code: "NOT_FOUND", message: "An unlinked pending source receipt was not found in this workspace." });
      if (ctx.user.role === "trader" && receipt.createdBy !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "You can route only source receipts you submitted." });
      const trade = await assertWorkspaceTrade(input.tradeId, ctx.user);
      const routingContext = { prior: receipt.routingContext, confirmedAt: new Date().toISOString(), confirmedBy: ctx.user.id, rationale: input.rationale, selectedTradeId: trade.id };
      const activityContext = { receiptId: receipt.id, selectedTradeId: trade.id, routedAt: routingContext.confirmedAt, routedBy: ctx.user.id, rationale: input.rationale };
      const routed = await routeSourceIngestionReceipt({ receiptId: receipt.id, tradeId: trade.id, routedBy: ctx.user.id, routingContext });
      if (routed !== 1) throw new TRPCError({ code: "CONFLICT", message: "This source receipt was already routed or otherwise changed. Refresh the Trade Inbox before retrying." });
      await recordExternalReference({ organizationId: workspaceId(ctx.user), tradeId: trade.id, entityType: receipt.sourceType, providerName: receipt.sourceType, externalId: `receipt-${receipt.id}-${(receipt.payloadHash ?? String(receipt.id)).slice(0, 12)}`, payload: receipt.rawPayload, observedAt: receipt.receivedAt });
      await appendTradeEvent({ tradeId: trade.id, actorId: ctx.user.id, eventType: "source.routed", title: "Unlinked source receipt routed", detail: `${receipt.fileName ?? `Receipt ${receipt.id}`} was explicitly routed. ${input.rationale}`, source: "ingestion", afterState: activityContext });
      await appendAuditRecord({ organizationId: workspaceId(ctx.user), actorId: ctx.user.id, action: "source_receipt.routed", objectType: "source_receipt", objectId: String(receipt.id), afterState: { tradeId: trade.id, routingContext }, reason: "Explicit human routing completed; no canonical field was changed." });
      return { success: true, tradeId: trade.id };
    }),
    commitmentPreview: protectedProcedure.input(z.object({ receiptId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      requireArcwayRole("reviewer", ctx.user.role);
      const receipt = await getSourceIngestionReceiptById(input.receiptId);
      if (!receipt || receipt.organizationId !== workspaceId(ctx.user)) throw new TRPCError({ code: "NOT_FOUND", message: "Source receipt not found in this workspace." });
      return { receipt: { id: receipt.id, fileName: receipt.fileName, sourceType: receipt.sourceType, receivedAt: receipt.receivedAt, tradeId: receipt.tradeId }, extraction: { method: "deterministic_pattern" as const, engineVersion: "commitment-extractor-v1" as const, source: "immutable_source_receipt" as const, humanReviewRequired: true as const }, candidates: extractCommitmentCandidates(receipt.rawPayload) };
    }),
    approveCommitment: protectedProcedure.input(z.object({ receiptId: z.number().int().positive(), candidateIndex: z.number().int().min(0).max(9), action: z.string().min(6).max(255), criticality: z.enum(["critical", "warning", "information"]).default("warning"), deadline: z.coerce.date().optional(), rationale: z.string().min(12).max(2000) })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("reviewer", ctx.user.role);
      const organizationId = workspaceId(ctx.user); const receipt = await getSourceIngestionReceiptById(input.receiptId);
      if (!receipt || receipt.organizationId !== organizationId || !receipt.tradeId) throw new TRPCError({ code: "NOT_FOUND", message: "A Trade Twin-linked source receipt was not found in this workspace." });
      await assertWorkspaceTrade(receipt.tradeId, ctx.user);
      const candidate = extractCommitmentCandidates(receipt.rawPayload)[input.candidateIndex];
      if (!candidate) throw new TRPCError({ code: "BAD_REQUEST", message: "The selected commitment candidate is no longer present in the retained source receipt." });
      const workspace = await getTradeWorkspace(receipt.tradeId);
      if (!workspace) throw new TRPCError({ code: "NOT_FOUND", message: "Trade Twin workspace was not found." });
      const source = `commitment_receipt:${receipt.id}:candidate:${input.candidateIndex}`;
      const existing = workspace.obligations.find(item => item.source === source);
      if (existing) return { existing: true, id: existing.id, dateTreatment: candidate.date ? "retained_exact_date" : "reviewer_supplied_for_relative_expression" as const };
      if (!candidate.date && !input.deadline) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A relative or undated commitment requires a Reviewer-supplied deadline; ARCWAY will not interpret the expression as a calendar date." });
      const retainedExactDeadline = candidate.date ? new Date(`${candidate.date}T00:00:00.000Z`) : undefined;
      const deadline = input.deadline ?? retainedExactDeadline;
      const dateTreatment = candidate.date ? (input.deadline ? "reviewer_override_of_retained_exact_date" : "retained_exact_date") : "reviewer_supplied_for_relative_expression";
      const id = await createTradeObligation({ tradeId: receipt.tradeId, actor: candidate.actor, action: input.action.trim(), evidenceRequirement: `Retained source receipt #${receipt.id}: ${candidate.evidence}`.slice(0, 255), criticality: input.criticality, deadline, source });
      const provenance = { sourceReceiptId: receipt.id, candidateIndex: input.candidateIndex, candidate, criticality: input.criticality, dateTreatment, deadline: deadline?.toISOString() ?? null, rationale: input.rationale, canonicalMutation: false };
      await appendTradeEvent({ tradeId: receipt.tradeId, actorId: ctx.user.id, eventType: "commitment.obligation_approved", title: "Source commitment approved as obligation", detail: `Receipt ${receipt.id} candidate ${input.candidateIndex} retained as an obligation.`, source: "commitment_review", afterState: { obligationId: id, ...provenance } });
      await appendAuditRecord({ organizationId, actorId: ctx.user.id, action: "commitment.obligation_approved", objectType: "trade_obligation", objectId: String(id), afterState: { obligationId: id, ...provenance }, reason: input.rationale });
      return { existing: false, id, dateTreatment };
    }),
    replayReceipt: protectedProcedure.input(z.object({ receiptId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("reviewer", ctx.user.role);
      const receipt = await getSourceIngestionReceiptById(input.receiptId);
      if (!receipt || receipt.organizationId !== workspaceId(ctx.user)) throw new TRPCError({ code: "NOT_FOUND", message: "Source receipt not found in this workspace." });
      await replaySourceIngestionReceipt(receipt.id);
      let runId: number | undefined;
      if (receipt.integrationId) runId = await recordIntegrationRun({ organizationId: workspaceId(ctx.user), integrationId: receipt.integrationId, runType: "source_replay", status: "completed", inputSummary: { receiptId: receipt.id, sourceType: receipt.sourceType }, outputSummary: { replayed: true } });
      if (receipt.tradeId) await appendTradeEvent({ tradeId: receipt.tradeId, actorId: ctx.user.id, eventType: "source.replayed", title: "Source receipt replayed", detail: `Receipt ${receipt.id} was normalized after operator recovery.`, source: "ingestion" });
      return { success: true, runId };
    }),
    confirmMappedField: protectedProcedure.input(z.object({ receiptId: z.number().int().positive(), rowIndex: z.number().int().min(0).default(0), fieldName: z.string().min(1).max(120), rationale: z.string().min(12).max(2000) })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("reviewer", ctx.user.role);
      const receipt = await getSourceIngestionReceiptById(input.receiptId);
      if (!receipt || receipt.organizationId !== workspaceId(ctx.user) || !receipt.tradeId) throw new TRPCError({ code: "NOT_FOUND", message: "Mapped source receipt not found in this workspace." });
      const raw = (receipt.rawPayload ?? {}) as { mappingApplication?: { mappingId?: number; sourceName?: string; mappedPreview?: Array<Record<string, unknown>> } };
      const mapping = raw.mappingApplication;
      const row = mapping?.mappedPreview?.[input.rowIndex];
      const value = row?.[input.fieldName];
      if (value === undefined || value === null || String(value).trim() === "") throw new TRPCError({ code: "BAD_REQUEST", message: "The requested mapped field is not present in this source row." });
      const evidenceFieldId = await createConfirmedEvidenceField({ tradeId: receipt.tradeId, fieldName: input.fieldName, fieldValue: String(value), sourceLocation: { sourceType: receipt.sourceType, receiptId: receipt.id, fileName: receipt.fileName, payloadHash: receipt.payloadHash, mappingId: mapping?.mappingId, sourceName: mapping?.sourceName, rowIndex: input.rowIndex }, confirmedBy: ctx.user.id });
      const resolutionId = await createCanonicalResolution({ tradeId: receipt.tradeId, fieldName: input.fieldName, selectedEvidenceFieldId: evidenceFieldId, selectedValue: String(value), conflictingEvidenceFieldIds: [], rationale: input.rationale, policyContext: { source: "structured_file_mapping", receiptId: receipt.id, mappingId: mapping?.mappingId, rowIndex: input.rowIndex }, resolvedBy: ctx.user.id });
      await appendTradeEvent({ tradeId: receipt.tradeId, actorId: ctx.user.id, eventType: "structured_source.confirmed", title: `Mapped ${input.fieldName} confirmed for canonicalization`, detail: `Receipt ${receipt.id} · ${input.rationale}`, source: "structured_file", afterState: { evidenceFieldId, canonicalResolutionId: resolutionId, fieldName: input.fieldName, value: String(value) } });
      await appendAuditRecord({ organizationId: workspaceId(ctx.user), actorId: ctx.user.id, action: "structured_source.canonical_confirmation", objectType: "source_receipt", objectId: String(receipt.id), afterState: { evidenceFieldId, canonicalResolutionId: resolutionId, fieldName: input.fieldName, rowIndex: input.rowIndex }, reason: input.rationale });
      return { evidenceFieldId, resolutionId };
    }),
    recordFailure: protectedProcedure.input(z.object({ integrationId: z.number().int().positive(), reason: z.string().min(8).max(2000) })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("reviewer", ctx.user.role);
      const record = (await listIntegrationOperations(workspaceId(ctx.user))).integrations.find(item => item.id === input.integrationId);
      if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "Integration not found in this workspace." });
      const runId = await recordIntegrationRun({ organizationId: workspaceId(ctx.user), integrationId: record.id, runType: "operator_failure_record", status: "failed", inputSummary: { providerType: record.providerType }, errorMessage: input.reason });
      return { runId };
    }),
    updateAlert: protectedProcedure.input(z.object({ alertId: z.number().int().positive(), status: z.enum(["acknowledged", "resolved"]) })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("reviewer", ctx.user.role);
      const alert = (await listIntegrationOperations(workspaceId(ctx.user))).alerts.find(item => item.id === input.alertId);
      if (!alert) throw new TRPCError({ code: "NOT_FOUND", message: "Workflow alert not found in this workspace." });
      await updateWorkflowAlert({ id: alert.id, status: input.status, actorId: ctx.user.id });
      return { success: true };
    }),
    saveMapping: protectedProcedure.input(z.object({ sourceName: z.string().min(2), entityType: z.string().min(2), mapping: z.record(z.string(), z.string()) })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("trader", ctx.user.role);
      return { id: await createImportMapping({ organizationId: workspaceId(ctx.user), createdBy: ctx.user.id, ...input }) };
    }),
  }),
  inbox: router({
    list: protectedProcedure.query(({ ctx }) => listSourceIngestionReceiptsForUser({ userId: ctx.user.id, role: ctx.user.role, organizationId: workspaceId(ctx.user) })),
  }),
  assurance: router({
    explain: protectedProcedure.input(z.object({ tradeId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      await assertWorkspaceTrade(input.tradeId, ctx.user);
      const workspace = await getTradeWorkspace(input.tradeId);
      if (!workspace) throw new TRPCError({ code: "NOT_FOUND", message: "Trade Twin workspace was not found." });
      return buildAssuranceExplanation({ documents: workspace.documents, exceptions: workspace.exceptions, obligations: workspace.obligations, fields: workspace.fields, preflightRuns: workspace.preflightRuns, now: new Date() });
    }),
  }),
  drafting: router({
    message: protectedProcedure.input(z.object({ tradeId: z.number().int().positive(), kind: z.enum(["ask_supplier", "request_correction", "notify_buyer", "ask_forwarder", "request_bank_clarification"]), focus: z.string().min(8).max(2000) })).query(async ({ ctx, input }) => {
      const trade = await assertWorkspaceTrade(input.tradeId, ctx.user);
      return buildOperationalMessageDraft({ reference: trade.reference, buyerName: trade.buyerName, sellerName: trade.sellerName, expectedShipmentDate: trade.expectedShipmentDate, kind: input.kind, focus: input.focus });
    }),
  }),
  shadowAudit: router({
    historicalReview: protectedProcedure.input(z.object({ from: z.coerce.date(), to: z.coerce.date() })).query(async ({ ctx, input }) => {
      requireArcwayRole("reviewer", ctx.user.role);
      if (input.to < input.from) throw new TRPCError({ code: "BAD_REQUEST", message: "The historical review end must be after its start." });
      if (input.to.getTime() - input.from.getTime() > 90 * 24 * 60 * 60 * 1000) throw new TRPCError({ code: "BAD_REQUEST", message: "Historical Shadow Audit review is bounded to a maximum 90-day window." });
      return getHistoricalShadowAuditReview({ organizationId: workspaceId(ctx.user), from: input.from, to: input.to });
    }),
  }),
  criticalPath: router({
    get: protectedProcedure.input(z.object({ tradeId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      await assertWorkspaceTrade(input.tradeId, ctx.user);
      const workspace = await getTradeWorkspace(input.tradeId);
      if (!workspace) throw new TRPCError({ code: "NOT_FOUND", message: "Trade Twin not found in this workspace." });
      return buildTradeCriticalPath({ now: new Date(), expectedShipmentDate: workspace.trade.expectedShipmentDate, obligations: workspace.obligations, obligationDependencies: workspace.obligationDependencies, shipments: workspace.shipments });
    }),
  }),
  monitoring: router({
    deterministicEvaluation: protectedProcedure.query(async ({ ctx }) => {
      requireArcwayRole("reviewer", ctx.user.role);
      return runDeterministicEvaluation();
    }),
    alertQuality: protectedProcedure.query(async ({ ctx }) => {
      requireArcwayRole("reviewer", ctx.user.role);
      return buildAlertQualityMetrics(await listOrganizationExceptionsForAlertQuality(workspaceId(ctx.user)));
    }),
    operationalSchedule: protectedProcedure.query(async ({ ctx }) => {
      requireArcwayRole("reviewer", ctx.user.role);
      return getOperationalSchedule("operational-sweep");
    }),
    configureOperationalSchedule: protectedProcedure.input(z.object({ cronExpression: z.string().refine(isValidSixFieldUtcCron, "Use a six-field UTC cron expression.") })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("reviewer", ctx.user.role);
      const sessionToken = parseCookieHeader(ctx.req.headers.cookie ?? "")[COOKIE_NAME];
      if (!sessionToken) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in again before configuring the production operational schedule." });
      const existing = await getOperationalSchedule("operational-sweep");
      const job = existing?.taskUid
        ? await updateHeartbeatJob(existing.taskUid, { cron: input.cronExpression, enable: true }, sessionToken)
        : await createHeartbeatJob({ name: "arcway-operational-sweep", cron: input.cronExpression, path: "/api/scheduled/operationalSweep", description: "Runs ARCWAY obligation SLA escalation and source-health monitoring." }, sessionToken);
      const taskUid = existing?.taskUid ?? (job as { taskUid: string }).taskUid;
      await registerOperationalSchedule({ scheduleKey: "operational-sweep", taskUid, cronExpression: input.cronExpression });
      await appendAuditRecord({ organizationId: workspaceId(ctx.user), actorId: ctx.user.id, action: "operational_schedule.configured", objectType: "operational_schedule", objectId: taskUid, afterState: { cronExpression: input.cronExpression, taskUid }, reason: "Reviewer configured project operational sweep" });
      return { taskUid, nextExecutionAt: job.nextExecutionAt ?? null };
    }),
    updateAlertPolicy: protectedProcedure.input(z.object({ alertType: z.enum(["source_failure", "source_health", "obligation_sla"]), enabled: z.boolean(), severity: z.enum(["critical", "warning", "information"]), threshold: z.number().int().min(1).max(720) })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("reviewer", ctx.user.role); const organizationId = workspaceId(ctx.user);
      await upsertWorkflowAlertPolicy({ organizationId, updatedBy: ctx.user.id, ...input });
      await appendAuditRecord({ organizationId, actorId: ctx.user.id, action: "workflow_alert_policy.updated", objectType: "workflow_alert_policy", objectId: input.alertType, afterState: input, reason: "Reviewer workflow alert configuration update" });
      return { success: true };
    }),
    runOperationalSweep: protectedProcedure.mutation(async ({ ctx }) => {
      requireArcwayRole("reviewer", ctx.user.role);
      const [obligations, sourceHealth] = await Promise.all([runObligationEscalationSweep(), runSourceHealthSweep()]);
      await appendAuditRecord({ organizationId: workspaceId(ctx.user), actorId: ctx.user.id, action: "monitoring.operational_sweep", objectType: "automation", objectId: "operational-sweep", afterState: { obligations, sourceHealth }, reason: "Reviewer-triggered operational sweep" });
      return { obligations, sourceHealth };
    }),
  }),
  tasks: router({
    create: protectedProcedure.input(z.object({ tradeId: z.number().int().positive(), exceptionId: z.number().int().positive().optional(), obligationId: z.number().int().positive().optional(), title: z.string().min(4), detail: z.string().min(4), assigneeId: z.number().int().positive().optional(), deadline: z.coerce.date().optional() })).mutation(async ({ ctx, input }) => {
      await assertWorkspaceTrade(input.tradeId, ctx.user);
      if (input.obligationId) {
        const workspace = await getTradeWorkspace(input.tradeId);
        if (!workspace?.obligations.some(obligation => obligation.id === input.obligationId)) throw new TRPCError({ code: "BAD_REQUEST", message: "The selected obligation is not part of this Trade Twin." });
      }
      const id = await createTradeTask({ organizationId: workspaceId(ctx.user), createdBy: ctx.user.id, ...input });
      await appendTradeEvent({ tradeId: input.tradeId, actorId: ctx.user.id, eventType: "task.created", title: "Contextual task created", detail: `${input.title}${input.obligationId ? ` · obligation #${input.obligationId}` : ""}`, source: "action_center" });
      return { id };
    }),
    updateStatus: protectedProcedure.input(z.object({ taskId: z.number().int().positive(), status: z.enum(["open", "in_progress", "completed", "cancelled"]) })).mutation(async ({ ctx, input }) => {
      const task = await getTradeTaskById(input.taskId);
      if (!task) throw new TRPCError({ code: "NOT_FOUND", message: "Task not found." });
      await assertWorkspaceTrade(task.tradeId, ctx.user);
      await updateTradeTaskStatus({ id: input.taskId, status: input.status });
      await appendTradeEvent({ tradeId: task.tradeId, actorId: ctx.user.id, eventType: `task.${input.status}`, title: `Task marked ${input.status}`, detail: `${task.title}${task.obligationId ? ` · obligation #${task.obligationId}` : ""}`, source: "action_center", beforeState: { status: task.status }, afterState: { status: input.status } });
      return { success: true };
    }),
  }),
  documents: router({
    generateDraft: protectedProcedure.input(z.object({ tradeId: z.number().int().positive(), documentType: z.enum(["quotation", "proforma invoice", "commercial invoice", "packing list", "purchase order", "sales confirmation", "shipping instruction", "VGM", "document cover schedule"]), issueNow: z.boolean().default(false) })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("trader", ctx.user.role); const workspace = await assertWorkspaceTrade(input.tradeId, ctx.user);
      const snapshot = { reference: workspace.reference, buyer: workspace.buyerName, seller: workspace.sellerName, commodity: workspace.commodity, quantity: workspace.quantity, unit: workspace.unit, unitPrice: workspace.unitPrice, totalValue: workspace.totalValue, currency: workspace.currency, incoterm: workspace.incoterm, origin: workspace.originCountry, destination: workspace.destinationCountry, generatedAt: new Date().toISOString() };
      const renderedContent = `${input.documentType.toUpperCase()}\n\nTrade: ${workspace.reference}\nSeller: ${workspace.sellerName}\nBuyer: ${workspace.buyerName}\nGoods: ${workspace.commodity}\nQuantity: ${workspace.quantity} ${workspace.unit}\nValue: ${workspace.currency} ${workspace.totalValue}\nIncoterm: ${workspace.incoterm}\nRoute: ${workspace.originCountry} → ${workspace.destinationCountry}`;
      const id = await createGeneratedDocument({ tradeId: input.tradeId, documentType: input.documentType, templateVersion: "arcway-core-1", dataSnapshot: snapshot, renderedContent, contentHash: createHash("sha256").update(renderedContent).digest("hex"), issuedBy: input.issueNow ? ctx.user.id : undefined, status: input.issueNow ? "issued" : "draft" });
      return { id, renderedContent, status: input.issueNow ? "issued" : "draft" };
    }),
    correctExtraction: protectedProcedure.input(z.object({ documentId: z.number().int().positive(), reviewerNotes: z.string().min(6), extractedData: z.record(z.string(), z.unknown()) })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("reviewer", ctx.user.role);
      const document = await getDocumentById(input.documentId);
      if (!document) throw new TRPCError({ code: "NOT_FOUND", message: "Evidence record not found." });
      await assertWorkspaceTrade(document.tradeId, ctx.user);
      await correctDocumentExtraction({ ...input, reviewerId: ctx.user.id });
      return { success: true };
    }),
  }),
});
