import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const persistence = vi.hoisted(() => ({ getReceipt: vi.fn(), getTrade: vi.fn(), getWorkspace: vi.fn(), createObligation: vi.fn(), createEvidence: vi.fn(), createResolution: vi.fn(), appendEvent: vi.fn(), appendAudit: vi.fn() }));
vi.mock("./db", async importOriginal => { const actual = await importOriginal<typeof import("./db")>(); return { ...actual, getSourceIngestionReceiptById: persistence.getReceipt, getTradeById: persistence.getTrade, getTradeWorkspace: persistence.getWorkspace, createTradeObligation: persistence.createObligation, createConfirmedEvidenceField: persistence.createEvidence, createCanonicalResolution: persistence.createResolution, appendTradeEvent: persistence.appendEvent, appendAuditRecord: persistence.appendAudit }; });
import { appRouter } from "./routers";

function reviewerContext(): TrpcContext { return { user: { id: 15, openId: "reviewer-user", email: "reviewer@example.com", name: "Reviewer User", loginMethod: "manus", role: "reviewer", organizationId: 1, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] }; }
function traderContext(): TrpcContext { return { ...reviewerContext(), user: { ...reviewerContext().user!, id: 16, role: "trader" } }; }

describe("operations.integrations.commitmentPreview", () => {
  it("returns review-required candidates from a retained workspace receipt without creating workflow records", async () => {
    persistence.getReceipt.mockResolvedValue({ id: 8, organizationId: 1, fileName: "supplier-email.eml", sourceType: "email_attachment", receivedAt: new Date("2026-10-01T12:00:00Z"), tradeId: 4, rawPayload: { body: "We can deliver 20,000 units by Friday." } });
    const result = await appRouter.createCaller(reviewerContext()).operations.integrations.commitmentPreview({ receiptId: 8 });
    expect(result).toMatchObject({ extraction: { method: "deterministic_pattern", engineVersion: "commitment-extractor-v1", source: "immutable_source_receipt", humanReviewRequired: true } });
    expect(result.candidates[0]).toMatchObject({ quantity: "20000", unit: "units", dateExpression: "Friday", method: "deterministic_pattern", engineVersion: "commitment-extractor-v1", reviewRequired: true });
    expect(persistence.createObligation).not.toHaveBeenCalled();
    expect(persistence.createEvidence).not.toHaveBeenCalled();
    expect(persistence.createResolution).not.toHaveBeenCalled();
    expect(persistence.appendEvent).not.toHaveBeenCalled();
    expect(persistence.appendAudit).not.toHaveBeenCalled();
  });

  it("rejects a Trader before reading a retained source receipt", async () => {
    vi.clearAllMocks();
    await expect(appRouter.createCaller(traderContext()).operations.integrations.commitmentPreview({ receiptId: 8 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(persistence.getReceipt).not.toHaveBeenCalled();
  });
});

describe("operations.integrations.approveCommitment", () => {
  const prepare = () => { vi.clearAllMocks(); persistence.getTrade.mockResolvedValue({ id: 4, organizationId: 1, ownerId: 15, reference: "AR-004" }); persistence.getWorkspace.mockResolvedValue({ obligations: [] }); persistence.createObligation.mockResolvedValue(44); };

  it("lets a Reviewer retain an exact-date candidate as one provenance-linked obligation without canonical side effects", async () => {
    prepare();
    persistence.getReceipt.mockResolvedValue({ id: 8, organizationId: 1, fileName: "supplier-email.eml", sourceType: "email_attachment", receivedAt: new Date("2026-10-01T12:00:00Z"), tradeId: 4, rawPayload: { body: "Cargo ready 24,000 kg by 2026-10-12." } });
    const result = await appRouter.createCaller(reviewerContext()).operations.integrations.approveCommitment({ receiptId: 8, candidateIndex: 0, action: "Confirm cargo-ready quantity and handoff", criticality: "critical", rationale: "The retained supplier message is sufficient to create a review-owned execution obligation." });
    expect(result).toEqual({ existing: false, id: 44, dateTreatment: "retained_exact_date" });
    expect(persistence.createObligation).toHaveBeenCalledWith(expect.objectContaining({ tradeId: 4, source: "commitment_receipt:8:candidate:0", deadline: new Date("2026-10-12T00:00:00.000Z"), criticality: "critical" }));
    expect(persistence.appendEvent).toHaveBeenCalledWith(expect.objectContaining({ eventType: "commitment.obligation_approved", afterState: expect.objectContaining({ sourceReceiptId: 8, candidateIndex: 0, criticality: "critical", canonicalMutation: false, dateTreatment: "retained_exact_date" }) }));
    expect(persistence.appendAudit).toHaveBeenCalledWith(expect.objectContaining({ afterState: expect.objectContaining({ criticality: "critical" }) }));
    expect(persistence.appendAudit).toHaveBeenCalledWith(expect.objectContaining({ action: "commitment.obligation_approved", objectId: "44" }));
    expect(persistence.createEvidence).not.toHaveBeenCalled(); expect(persistence.createResolution).not.toHaveBeenCalled();
  });

  it("requires an explicit Reviewer-supplied date for a relative expression rather than interpreting it", async () => {
    prepare();
    persistence.getReceipt.mockResolvedValue({ id: 8, organizationId: 1, fileName: "supplier-email.eml", sourceType: "email_attachment", receivedAt: new Date(), tradeId: 4, rawPayload: { body: "We can deliver 20,000 units by Friday." } });
    await expect(appRouter.createCaller(reviewerContext()).operations.integrations.approveCommitment({ receiptId: 8, candidateIndex: 0, action: "Confirm delivery commitment", rationale: "The date expression requires a reviewer to retain an explicit operational deadline." })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(persistence.createObligation).not.toHaveBeenCalled(); expect(persistence.appendEvent).not.toHaveBeenCalled(); expect(persistence.appendAudit).not.toHaveBeenCalled();
  });

  it("returns the existing approved obligation instead of duplicating the same receipt candidate", async () => {
    prepare();
    persistence.getReceipt.mockResolvedValue({ id: 8, organizationId: 1, fileName: "supplier-email.eml", sourceType: "email_attachment", receivedAt: new Date(), tradeId: 4, rawPayload: { body: "Cargo ready 24,000 kg by 2026-10-12." } }); persistence.getWorkspace.mockResolvedValue({ obligations: [{ id: 39, source: "commitment_receipt:8:candidate:0" }] });
    await expect(appRouter.createCaller(reviewerContext()).operations.integrations.approveCommitment({ receiptId: 8, candidateIndex: 0, action: "Confirm cargo-ready quantity and handoff", rationale: "The retained supplier message has already been approved as an operational obligation." })).resolves.toEqual({ existing: true, id: 39, dateTreatment: "retained_exact_date" });
    expect(persistence.createObligation).not.toHaveBeenCalled(); expect(persistence.appendEvent).not.toHaveBeenCalled(); expect(persistence.appendAudit).not.toHaveBeenCalled();
  });

  it("rejects a Trader before it reads a retained receipt or creates an obligation", async () => {
    prepare();
    await expect(appRouter.createCaller(traderContext()).operations.integrations.approveCommitment({ receiptId: 8, candidateIndex: 0, action: "Confirm cargo-ready quantity and handoff", rationale: "This operation requires a Reviewer decision and immutable rationale." })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(persistence.getReceipt).not.toHaveBeenCalled(); expect(persistence.createObligation).not.toHaveBeenCalled();
  });
});
