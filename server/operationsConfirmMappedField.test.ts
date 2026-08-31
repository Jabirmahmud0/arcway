import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const persistence = vi.hoisted(() => ({
  getReceipt: vi.fn(),
  createEvidence: vi.fn(),
  createResolution: vi.fn(),
  appendEvent: vi.fn(),
  appendAudit: vi.fn(),
}));

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getSourceIngestionReceiptById: persistence.getReceipt,
    createConfirmedEvidenceField: persistence.createEvidence,
    createCanonicalResolution: persistence.createResolution,
    appendTradeEvent: persistence.appendEvent,
    appendAuditRecord: persistence.appendAudit,
  };
});

import { appRouter } from "./routers";

function createReviewerContext(): TrpcContext {
  return {
    user: {
      id: 42,
      openId: "reviewer-user",
      email: "reviewer@example.com",
      name: "Reviewer User",
      loginMethod: "manus",
      role: "reviewer",
      organizationId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const structuredReceipt = (mappedValue: unknown) => ({
  id: 88,
  organizationId: 1,
  tradeId: 7,
  sourceType: "structured_file" as const,
  fileName: "commercial-invoice.xlsx",
  payloadHash: "source-hash",
  rawPayload: {
    mappingApplication: {
      mappingId: 12,
      sourceName: "commercial-invoice",
      mappedPreview: [{ invoice_number: mappedValue }],
    },
  },
});

describe("operations.integrations.confirmMappedField", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    persistence.createEvidence.mockResolvedValue(301);
    persistence.createResolution.mockResolvedValue(401);
  });

  it("rejects a blank mapped value before any durable evidence or canonical side effect", async () => {
    persistence.getReceipt.mockResolvedValue(structuredReceipt("   "));
    const caller = appRouter.createCaller(createReviewerContext());

    await expect(caller.operations.integrations.confirmMappedField({
      receiptId: 88,
      fieldName: "invoice_number",
      rationale: "Reviewer confirmed the structured invoice source is authoritative.",
    })).rejects.toMatchObject<Partial<TRPCError>>({ code: "BAD_REQUEST" });

    expect(persistence.createEvidence).not.toHaveBeenCalled();
    expect(persistence.createResolution).not.toHaveBeenCalled();
    expect(persistence.appendEvent).not.toHaveBeenCalled();
    expect(persistence.appendAudit).not.toHaveBeenCalled();
  });

  it("persists the complete evidence, canonical-resolution, event, and audit contract for a reviewer confirmation", async () => {
    persistence.getReceipt.mockResolvedValue(structuredReceipt("INV-2026-014"));
    const caller = appRouter.createCaller(createReviewerContext());

    await expect(caller.operations.integrations.confirmMappedField({
      receiptId: 88,
      fieldName: "invoice_number",
      rationale: "Reviewer confirmed the structured invoice source is authoritative.",
    })).resolves.toEqual({ evidenceFieldId: 301, resolutionId: 401 });

    expect(persistence.createEvidence).toHaveBeenCalledWith(expect.objectContaining({
      tradeId: 7,
      fieldName: "invoice_number",
      fieldValue: "INV-2026-014",
      confirmedBy: 42,
    }));
    expect(persistence.createResolution).toHaveBeenCalledWith(expect.objectContaining({
      tradeId: 7,
      fieldName: "invoice_number",
      selectedEvidenceFieldId: 301,
      selectedValue: "INV-2026-014",
      resolvedBy: 42,
    }));
    expect(persistence.appendEvent).toHaveBeenCalledWith(expect.objectContaining({
      tradeId: 7,
      actorId: 42,
      eventType: "structured_source.confirmed",
    }));
    expect(persistence.appendAudit).toHaveBeenCalledWith(expect.objectContaining({
      organizationId: 1,
      actorId: 42,
      action: "structured_source.canonical_confirmation",
      objectId: "88",
    }));
  });
});
