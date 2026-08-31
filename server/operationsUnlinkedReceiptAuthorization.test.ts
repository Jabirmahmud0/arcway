import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const persistence = vi.hoisted(() => ({ getReceipt: vi.fn(), routeReceipt: vi.fn(), getTrade: vi.fn(), recordExternal: vi.fn(), appendEvent: vi.fn(), appendAudit: vi.fn() }));

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return { ...actual, getSourceIngestionReceiptById: persistence.getReceipt, routeSourceIngestionReceipt: persistence.routeReceipt, getTradeById: persistence.getTrade, recordExternalReference: persistence.recordExternal, appendTradeEvent: persistence.appendEvent, appendAuditRecord: persistence.appendAudit };
});

import { appRouter } from "./routers";

function traderContext(): TrpcContext { return { user: { id: 14, openId: "trader-user", email: "trader@example.com", name: "Trader User", loginMethod: "manus", role: "trader", organizationId: 1, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] }; }
function reviewerContext(): TrpcContext { return { user: { id: 15, openId: "reviewer-user", email: "reviewer@example.com", name: "Reviewer User", loginMethod: "manus", role: "reviewer", organizationId: 1, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] }; }

describe("operations.integrations.routeUnlinkedReceipt ownership", () => {
  it("rejects a Trader before target lookup, route persistence, or Trade Twin activity when the pending receipt belongs to another Trader", async () => {
    persistence.getReceipt.mockResolvedValue({ id: 77, organizationId: 1, tradeId: null, routingStatus: "pending", createdBy: 88 });
    const caller = appRouter.createCaller(traderContext());

    await expect(caller.operations.integrations.routeUnlinkedReceipt({ receiptId: 77, tradeId: 7, rationale: "This source needs an owner-confirmed destination." })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(persistence.getTrade).not.toHaveBeenCalled();
    expect(persistence.routeReceipt).not.toHaveBeenCalled();
  });

  it("does not create external evidence, Trade Twin activity, or audit records when the pending receipt was routed concurrently", async () => {
    persistence.getReceipt.mockResolvedValue({ id: 78, organizationId: 1, tradeId: null, routingStatus: "pending", createdBy: 14, sourceType: "email_attachment", fileName: "source.pdf", payloadHash: "abc123", rawPayload: {}, receivedAt: new Date("2026-08-24T00:00:00Z") });
    persistence.getTrade.mockResolvedValue({ id: 7, organizationId: 1, ownerId: 14, reference: "AR-OWNER-0001" });
    persistence.routeReceipt.mockResolvedValue(0);

    await expect(appRouter.createCaller(reviewerContext()).operations.integrations.routeUnlinkedReceipt({ receiptId: 78, tradeId: 7, rationale: "The retained reference and counterparties identify this Trade Twin." })).rejects.toMatchObject({ code: "CONFLICT" });
    expect(persistence.recordExternal).not.toHaveBeenCalled();
    expect(persistence.appendEvent).not.toHaveBeenCalled();
    expect(persistence.appendAudit).not.toHaveBeenCalled();
  });

  it("records only a decision summary in Trade Twin activity after a successful route, not the retained candidate list", async () => {
    persistence.getReceipt.mockResolvedValue({ id: 79, organizationId: 1, tradeId: null, routingStatus: "pending", createdBy: 14, sourceType: "email_attachment", fileName: "source.pdf", payloadHash: "abc123", rawPayload: {}, receivedAt: new Date("2026-08-24T00:00:00Z"), routingContext: { candidates: [{ tradeId: 7, reference: "AR-OWNER-0001" }, { tradeId: 8, reference: "AR-OTHER-0008" }] } });
    persistence.getTrade.mockResolvedValue({ id: 7, organizationId: 1, ownerId: 14, reference: "AR-OWNER-0001" });
    persistence.routeReceipt.mockResolvedValue(1);

    await expect(appRouter.createCaller(reviewerContext()).operations.integrations.routeUnlinkedReceipt({ receiptId: 79, tradeId: 7, rationale: "The retained reference and counterparties identify this Trade Twin." })).resolves.toMatchObject({ success: true, tradeId: 7 });
    const activity = persistence.appendEvent.mock.calls[0][0];
    expect(activity.afterState).toMatchObject({ receiptId: 79, selectedTradeId: 7 });
    expect(activity.afterState).not.toHaveProperty("routingContext");
    expect(JSON.stringify(activity.afterState)).not.toContain("AR-OTHER-0008");
  });
});
