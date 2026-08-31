import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createTraderContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "trader-user",
      email: "trader@example.com",
      name: "Trader User",
      loginMethod: "manus",
      role: "trader",
      organizationId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("operations.integrations.confirmMappedField authorization", () => {
  it("rejects a Trader before a mapped receipt can be read or canonically adopted", async () => {
    const caller = appRouter.createCaller(createTraderContext());

    await expect(caller.operations.integrations.confirmMappedField({
      receiptId: 999999,
      fieldName: "invoice_number",
      rationale: "Reviewer must validate structured evidence before canonical adoption.",
    })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
  });
});

describe("operations.integrations.list authorization", () => {
  it("rejects a Trader before source receipts, mappings, alerts, or provider records can be read", async () => {
    const caller = appRouter.createCaller(createTraderContext());

    await expect(caller.operations.integrations.list()).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
  });
});

describe("operations.integration recovery authorization", () => {
  it("rejects a Trader before provider-run recovery or failed source replay can access protected records", async () => {
    const caller = appRouter.createCaller(createTraderContext());

    await expect(caller.operations.integrations.runMock({ integrationId: 999999, providerType: "erp", tradeId: 999999 })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    await expect(caller.operations.integrations.replayReceipt({ receiptId: 999999 })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
  });
});

describe("operations.policies.create authorization", () => {
  it("rejects a Trader before Reviewer policy-pack authoring can persist governance state", async () => {
    const caller = appRouter.createCaller(createTraderContext());

    await expect(caller.operations.policies.create({
      name: "Origin evidence gate",
      scope: "jurisdiction",
      jurisdiction: "EU",
      rules: [{ if: { shipment_country: "TR" }, then: { requires: "certificate_of_origin" } }],
    })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
  });
});

describe("operations.policies.list authorization", () => {
  it("rejects a Trader before organization policy packs and immutable versions can be read", async () => {
    const caller = appRouter.createCaller(createTraderContext());

    await expect(caller.operations.policies.list()).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
  });
});

describe("operations policy application and master version authorization", () => {
  it("rejects a Trader before governed bindings, previews, applications, or immutable master successors can read or mutate workspace records", async () => {
    const caller = appRouter.createCaller(createTraderContext());

    await expect(caller.operations.policies.bindObligation({ policyPackId: 999999, obligationTemplateId: 999999, relationshipRole: "buyer" })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    await expect(caller.operations.policies.obligationPreview({ tradeId: 999999 })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    await expect(caller.operations.policies.applyPreview({ tradeId: 999999, bindingId: 999999 })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    await expect(caller.operations.masters.createCounterpartyVersion({ sourceId: 999999 })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    await expect(caller.operations.masters.createProductVersion({ sourceId: 999999 })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    await expect(caller.operations.masters.entityResolutionPreview()).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    await expect(caller.operations.masters.confirmEntityAlias({ sourceId: 999999, alias: "NordHaus", rationale: "Reviewer retained-name review confirms this trading alias." })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    await expect(caller.operations.integrations.commitmentPreview({ receiptId: 999999 })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
  });
});

describe("remaining privileged operations authorization", () => {
  it("rejects a Trader before preflight waivers, obligation templates, canonical resolutions, approval decisions, or revision history can reach protected records", async () => {
    const caller = appRouter.createCaller(createTraderContext());
    const expiresAt = new Date(Date.now() + 86_400_000);

    await expect(caller.operations.preflight.createWaiver({ tradeId: 999999, ruleKey: "invoice.verified", reason: "Reviewer waiver rationale is required.", expiresAt })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    await expect(caller.operations.preflight.revokeWaiver({ waiverId: 999999 })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    await expect(caller.operations.obligations.createTemplate({ name: "Evidence acknowledgement", actor: "Carrier", action: "Acknowledge shipment evidence", criticality: "warning" })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    await expect(caller.operations.canonicalization.resolve({ tradeId: 999999, fieldName: "invoice_number", selectedValue: "INV-001", rationale: "Reviewer selected the corroborated invoice reference." })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    await expect(caller.operations.approvals.decide({ approvalId: 999999, status: "approved", decisionReason: "Reviewer approval rationale." })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    await expect(caller.operations.history.recordRevision({ tradeId: 999999, reason: "Reviewer retained a canonical revision.", afterState: { reference: "AR-001" }, source: "review" })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
  });
});

describe("operations.configureOperationalSchedule authorization", () => {
  it("rejects a Trader before schedule registration can invoke any automation provider", async () => {
    const caller = appRouter.createCaller(createTraderContext());

    await expect(caller.operations.monitoring.configureOperationalSchedule({
      cronExpression: "0 0 * * * *",
    })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
  });
});

describe("operations.operationalSchedule authorization", () => {
  it("rejects a Trader before operational schedule metadata can be read", async () => {
    const caller = appRouter.createCaller(createTraderContext());

    await expect(caller.operations.monitoring.operationalSchedule()).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
  });
});

describe("operations.monitoring.updateAlertPolicy authorization", () => {
  it("rejects a Trader before alert policy thresholds or severity can be persisted", async () => {
    const caller = appRouter.createCaller(createTraderContext());

    await expect(caller.operations.monitoring.updateAlertPolicy({
      alertType: "source_health",
      enabled: true,
      severity: "critical",
      threshold: 24,
    })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
  });
});

describe("governance.updateControls authorization", () => {
  it("rejects a Trader before organization-wide security and AI controls can be persisted", async () => {
    const caller = appRouter.createCaller(createTraderContext());

    await expect(caller.governance.updateControls({
      dataRetentionDays: 365,
      piiRedaction: "on_model_request",
      publicModelTraining: "disallowed",
      requireMfa: "required",
    })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
  });
});

describe("governance.overview authorization", () => {
  it("rejects a Trader before organization controls, audit records, guest grants, or membership data can be read", async () => {
    const caller = appRouter.createCaller(createTraderContext());

    await expect(caller.governance.overview()).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
  });
});

describe("privileged governance operations authorization", () => {
  it("rejects a Trader before audit export, membership administration, or source configuration changes can reach protected records", async () => {
    const caller = appRouter.createCaller(createTraderContext());

    await expect(caller.governance.exportAudit()).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    await expect(caller.governance.members.add({ email: "new.member@example.com", role: "trader" })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    await expect(caller.governance.members.updateRole({ membershipId: 999999, role: "reviewer" })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    await expect(caller.governance.members.remove({ membershipId: 999999 })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    await expect(caller.governance.members.grantCapability({ membershipId: 999999, capability: "review.queue" })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    await expect(caller.governance.members.revokeCapability({ membershipId: 999999, capability: "review.queue" })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    await expect(caller.governance.updateSourceConfiguration({ integrationId: 999999, configuration: { endpoint: "https://example.invalid" } })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
  });
});
