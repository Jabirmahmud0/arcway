import { TRPCError } from "@trpc/server";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import { addCapabilityGrant, addOrganizationMembership, appendAuditRecord, createGuestGrant, getAuditExport, getGovernanceData, getGuestGrantByTokenHash, getGuestGrantForOwner, getPartnerRequestById, getTradeWorkspace, listPartnerRequestsForGuest, recordGuestCargoReadyDate, recordGuestHandoff, recordGuestPackingListReference, removeCapabilityGrant, removeOrganizationMembership, respondToPartnerRequest, revokeGuestGrant, touchGuestGrant, updateIntegrationSourceConfiguration, updateOrganizationControls, updateOrganizationMembershipRole } from "../db";
import { requireArcwayRole } from "../access";
import { canRespondToPartnerRequest } from "../partnerAccess";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

function orgId(user: { organizationId?: number | null }) { if (!user.organizationId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Workspace provisioning is in progress." }); return user.organizationId; }
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export const governanceRouter = router({
  overview: protectedProcedure.query(({ ctx }) => { requireArcwayRole("reviewer", ctx.user.role); return getGovernanceData(orgId(ctx.user)); }),
  updateControls: protectedProcedure.input(z.object({ dataRetentionDays: z.number().int().min(30).max(3650), allowedAiProviders: z.array(z.string()).optional(), regionalProcessing: z.string().max(80).optional(), piiRedaction: z.enum(["off", "on_upload", "on_model_request"]), publicModelTraining: z.enum(["disallowed", "allowed"]), requireMfa: z.enum(["disabled", "required"]) })).mutation(async ({ ctx, input }) => {
    requireArcwayRole("reviewer", ctx.user.role); const organizationId = orgId(ctx.user);
    await updateOrganizationControls({ organizationId, ...input });
    await appendAuditRecord({ organizationId, actorId: ctx.user.id, action: "organization_controls.updated", objectType: "organization_controls", objectId: String(organizationId), afterState: input, reason: "Security and AI data control update" });
    return { success: true };
  }),
  members: router({
    add: protectedProcedure.input(z.object({ email: z.string().email(), role: z.enum(["trader", "reviewer"]) })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("reviewer", ctx.user.role); const organizationId = orgId(ctx.user); const membership = await addOrganizationMembership({ organizationId, ...input });
      if (!membership) throw new TRPCError({ code: "NOT_FOUND", message: "This person must sign in to ARCWAY before they can be assigned to the organization." });
      await appendAuditRecord({ organizationId, actorId: ctx.user.id, action: "membership.assigned", objectType: "membership", objectId: String(membership.id), afterState: { email: input.email, role: input.role }, reason: "Reviewer organization membership assignment" }); return { membership };
    }),
    updateRole: protectedProcedure.input(z.object({ membershipId: z.number().int().positive(), role: z.enum(["trader", "reviewer"]) })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("reviewer", ctx.user.role); const organizationId = orgId(ctx.user); const membership = await updateOrganizationMembershipRole({ organizationId, ...input }); if (!membership) throw new TRPCError({ code: "NOT_FOUND", message: "Membership not found." });
      await appendAuditRecord({ organizationId, actorId: ctx.user.id, action: "membership.role_updated", objectType: "membership", objectId: String(input.membershipId), afterState: { role: input.role }, reason: "Reviewer role enforcement update" }); return { success: true };
    }),
    remove: protectedProcedure.input(z.object({ membershipId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("reviewer", ctx.user.role); const organizationId = orgId(ctx.user); const membership = await removeOrganizationMembership({ organizationId, ...input }); if (!membership) throw new TRPCError({ code: "NOT_FOUND", message: "Membership not found." });
      await appendAuditRecord({ organizationId, actorId: ctx.user.id, action: "membership.removed", objectType: "membership", objectId: String(input.membershipId), reason: "Reviewer organization membership removal" }); return { success: true };
    }),
    grantCapability: protectedProcedure.input(z.object({ membershipId: z.number().int().positive(), capability: z.string().min(3).max(120) })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("reviewer", ctx.user.role); const organizationId = orgId(ctx.user); const exists = (await getGovernanceData(organizationId)).memberships.some(member => member.id === input.membershipId); if (!exists) throw new TRPCError({ code: "NOT_FOUND", message: "Membership not found." });
      await addCapabilityGrant({ ...input, grantedBy: ctx.user.id }); await appendAuditRecord({ organizationId, actorId: ctx.user.id, action: "capability.granted", objectType: "membership", objectId: String(input.membershipId), afterState: { capability: input.capability }, reason: "Least-privilege capability assignment" }); return { success: true };
    }),
    revokeCapability: protectedProcedure.input(z.object({ membershipId: z.number().int().positive(), capability: z.string().min(3).max(120) })).mutation(async ({ ctx, input }) => {
      requireArcwayRole("reviewer", ctx.user.role); const organizationId = orgId(ctx.user); const exists = (await getGovernanceData(organizationId)).memberships.some(member => member.id === input.membershipId); if (!exists) throw new TRPCError({ code: "NOT_FOUND", message: "Membership not found." });
      await removeCapabilityGrant(input); await appendAuditRecord({ organizationId, actorId: ctx.user.id, action: "capability.revoked", objectType: "membership", objectId: String(input.membershipId), beforeState: { capability: input.capability }, reason: "Least-privilege capability revocation" }); return { success: true };
    }),
  }),
  updateSourceConfiguration: protectedProcedure.input(z.object({ integrationId: z.number().int().positive(), configuration: z.record(z.string(), z.unknown()) })).mutation(async ({ ctx, input }) => {
    requireArcwayRole("reviewer", ctx.user.role); const organizationId = orgId(ctx.user); const source = await updateIntegrationSourceConfiguration({ organizationId, ...input }); if (!source) throw new TRPCError({ code: "NOT_FOUND", message: "Integration source not found." });
    await appendAuditRecord({ organizationId, actorId: ctx.user.id, action: "integration.configuration_updated", objectType: "integration", objectId: String(input.integrationId), afterState: input.configuration, reason: "Reviewer source configuration update" }); return { success: true };
  }),
  exportAudit: protectedProcedure.query(async ({ ctx }) => {
    requireArcwayRole("reviewer", ctx.user.role); const organizationId = orgId(ctx.user); const records = await getAuditExport(organizationId); await appendAuditRecord({ organizationId, actorId: ctx.user.id, action: "audit.exported", objectType: "audit_records", objectId: "organization", afterState: { count: records.length }, reason: "Reviewer audit export" }); return records;
  }),
  createGuestLink: protectedProcedure.input(z.object({ tradeId: z.number().int().positive(), recipientEmail: z.string().email(), scopes: z.array(z.enum(["trade.read", "cargo_ready_date.write", "packing_list.upload", "partner_request.respond"])).min(1), expiresInDays: z.number().int().min(1).max(30).default(7) })).mutation(async ({ ctx, input }) => {
    requireArcwayRole("trader", ctx.user.role); const organizationId = orgId(ctx.user); const workspace = await getTradeWorkspace(input.tradeId);
    if (!workspace || workspace.trade.organizationId !== organizationId) throw new TRPCError({ code: "NOT_FOUND", message: "Trade Twin not found in this workspace." });
    if (workspace.trade.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "Only the owning Trader can issue a guest collaboration link for this Trade Twin." });
    const token = randomBytes(24).toString("base64url"); const expiresAt = new Date(Date.now() + input.expiresInDays * 86400000);
    const id = await createGuestGrant({ organizationId, tradeId: input.tradeId, recipientEmail: input.recipientEmail, tokenHash: hashToken(token), scope: input.scopes, expiresAt, createdBy: ctx.user.id });
    await appendAuditRecord({ organizationId, actorId: ctx.user.id, action: "guest_access.created", objectType: "guest_access", objectId: String(id), afterState: { tradeId: input.tradeId, recipientEmail: input.recipientEmail, scopes: input.scopes, expiresAt }, reason: "Scoped partner collaboration link issued" });
    return { id, token, expiresAt };
  }),
  revokeGuestLink: protectedProcedure.input(z.object({ grantId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    requireArcwayRole("trader", ctx.user.role); const organizationId = orgId(ctx.user); const grant = await getGuestGrantForOwner({ id: input.grantId, organizationId, createdBy: ctx.user.id });
    if (!grant) throw new TRPCError({ code: "NOT_FOUND", message: "Guest collaboration link not found for this Trader." });
    await revokeGuestGrant(input.grantId, organizationId); await appendAuditRecord({ organizationId, actorId: ctx.user.id, action: "guest_access.revoked", objectType: "guest_access", objectId: String(input.grantId), reason: "Scoped partner collaboration link revoked" }); return { success: true };
  }),
  guest: router({
    resolve: publicProcedure.input(z.object({ token: z.string().min(12) })).query(async ({ input }) => {
      const grant = await getGuestGrantByTokenHash(hashToken(input.token));
      if (!grant || grant.status !== "active" || grant.expiresAt < new Date()) throw new TRPCError({ code: "NOT_FOUND", message: "This secure collaboration link is unavailable." });
      const scopes = Array.isArray(grant.scope) ? grant.scope : [];
      const canReadTrade = scopes.includes("trade.read");
      const canRespondToRequests = scopes.includes("partner_request.respond");
      const workspace = canReadTrade ? await getTradeWorkspace(grant.tradeId) : null;
      if (canReadTrade && !workspace) throw new TRPCError({ code: "NOT_FOUND", message: "The shared Trade Twin is unavailable." });
      const partnerRequests = canRespondToRequests ? await listPartnerRequestsForGuest(grant.tradeId, grant.recipientEmail) : [];
      await touchGuestGrant(grant.id);
      return {
        grant: { id: grant.id, scope: grant.scope, expiresAt: grant.expiresAt },
        trade: workspace?.trade ?? null,
        documents: workspace?.documents.map(item => ({ id: item.id, documentType: item.documentType, status: item.status, fileName: item.fileName })) ?? [],
        obligations: workspace?.obligations.map(item => ({ id: item.id, actor: item.actor, action: item.action, deadline: item.deadline, status: item.status })) ?? [],
        partnerRequests: partnerRequests.map(request => ({ id: request.id, requestType: request.requestType, message: request.message, status: request.status, dueAt: request.dueAt, responseSummary: request.responseSummary, responseEvidence: request.responseEvidence })),
      };
    }),
    handoff: publicProcedure.input(z.object({ token: z.string().min(12), summary: z.string().min(6).max(5000) })).mutation(async ({ input }) => {
      const grant = await getGuestGrantByTokenHash(hashToken(input.token));
      if (!grant || grant.status !== "active" || grant.expiresAt < new Date()) throw new TRPCError({ code: "NOT_FOUND", message: "This secure collaboration link is unavailable." });
      const scopes = Array.isArray(grant.scope) ? grant.scope : [];
      if (!scopes.includes("partner_request.respond") && !scopes.includes("packing_list.upload") && !scopes.includes("cargo_ready_date.write")) throw new TRPCError({ code: "FORBIDDEN", message: "This link does not permit an evidence handoff." });
      await recordGuestHandoff({ grantId: grant.id, tradeId: grant.tradeId, summary: input.summary, ingestedBy: grant.createdBy });
      await appendAuditRecord({ organizationId: grant.organizationId, action: "guest_access.handoff_recorded", objectType: "guest_access", objectId: String(grant.id), afterState: { summary: input.summary }, reason: "Scoped partner evidence handoff" });
      return { success: true };
    }),
    respondToPartnerRequest: publicProcedure.input(z.object({ token: z.string().min(12), requestId: z.number().int().positive(), summary: z.string().min(6).max(5000), evidence: z.array(z.object({ label: z.string().min(1).max(120), reference: z.string().min(1).max(500) })).max(20).optional() })).mutation(async ({ input }) => {
      const grant = await getGuestGrantByTokenHash(hashToken(input.token));
      const scopes = grant && Array.isArray(grant.scope) ? grant.scope : [];
      if (!grant || grant.status !== "active" || grant.expiresAt < new Date() || !scopes.includes("partner_request.respond")) throw new TRPCError({ code: "FORBIDDEN", message: "This link does not permit partner-request responses." });
      const request = await getPartnerRequestById(input.requestId);
      if (!canRespondToPartnerRequest(grant, request)) throw new TRPCError({ code: "FORBIDDEN", message: "This named partner request is unavailable within the current scoped link." });
      await respondToPartnerRequest({ requestId: request.id, responseSummary: input.summary, responseEvidence: input.evidence ?? [] }); await recordGuestHandoff({ grantId: grant.id, tradeId: grant.tradeId, summary: input.summary, ingestedBy: grant.createdBy });
      await appendAuditRecord({ organizationId: grant.organizationId, action: "partner_request.responded", objectType: "partner_request", objectId: String(request.id), afterState: { evidence: input.evidence ?? [] }, reason: input.summary, source: "guest_portal" }); return { success: true };
    }),
    updateCargoReadyDate: publicProcedure.input(z.object({ token: z.string().min(12), cargoReadyDate: z.coerce.date(), summary: z.string().min(6).max(2000) })).mutation(async ({ input }) => {
      const grant = await getGuestGrantByTokenHash(hashToken(input.token));
      const scopes = grant && Array.isArray(grant.scope) ? grant.scope : [];
      if (!grant || grant.status !== "active" || grant.expiresAt < new Date() || !scopes.includes("cargo_ready_date.write")) throw new TRPCError({ code: "FORBIDDEN", message: "This link does not permit cargo-ready-date updates." });
      await recordGuestCargoReadyDate({ tradeId: grant.tradeId, cargoReadyDate: input.cargoReadyDate, ingestedBy: grant.createdBy, summary: input.summary });
      await appendAuditRecord({ organizationId: grant.organizationId, action: "guest_access.cargo_ready_date_updated", objectType: "guest_access", objectId: String(grant.id), afterState: { cargoReadyDate: input.cargoReadyDate, summary: input.summary }, reason: "Scoped partner cargo-ready update" });
      return { success: true };
    }),
    submitPackingListReference: publicProcedure.input(z.object({ token: z.string().min(12), reference: z.string().min(3).max(255), summary: z.string().min(6).max(2000) })).mutation(async ({ input }) => {
      const grant = await getGuestGrantByTokenHash(hashToken(input.token));
      const scopes = grant && Array.isArray(grant.scope) ? grant.scope : [];
      if (!grant || grant.status !== "active" || grant.expiresAt < new Date() || !scopes.includes("packing_list.upload")) throw new TRPCError({ code: "FORBIDDEN", message: "This link does not permit packing-list evidence submission." });
      await recordGuestPackingListReference({ tradeId: grant.tradeId, reference: input.reference, ingestedBy: grant.createdBy, summary: input.summary });
      await appendAuditRecord({ organizationId: grant.organizationId, action: "guest_access.packing_list_reference_recorded", objectType: "guest_access", objectId: String(grant.id), afterState: { reference: input.reference, summary: input.summary }, reason: "Scoped partner packing-list handoff" });
      return { success: true };
    }),
  }),
});
