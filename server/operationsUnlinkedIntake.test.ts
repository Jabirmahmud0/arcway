import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const persistence = vi.hoisted(() => ({ listTrades: vi.fn(), createReceipt: vi.fn(), appendAudit: vi.fn() }));

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return { ...actual, listTradesForUser: persistence.listTrades, createSourceIngestionReceipt: persistence.createReceipt, appendAuditRecord: persistence.appendAudit };
});

import { appRouter } from "./routers";

function traderContext(): TrpcContext { return { user: { id: 14, openId: "trader-user", email: "trader@example.com", name: "Trader User", loginMethod: "manus", role: "trader", organizationId: 1, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] }; }

describe("operations.integrations.ingestSource unlinked receipt", () => {
  beforeEach(() => { vi.clearAllMocks(); persistence.createReceipt.mockResolvedValue(99); persistence.listTrades.mockResolvedValue([{ id: 7, reference: "AR-OWNER-0001", buyerName: "Northstar Foods GmbH", sellerName: "Meridian Export House LLC", commodity: "Arabica coffee", expectedShipmentDate: new Date("2026-09-03T00:00:00Z"), documentSummary: [] }]); });

  it("retains an unlinked receipt as pending with scored candidates and an audit record rather than attaching evidence or changing canonical data", async () => {
    const caller = appRouter.createCaller(traderContext());
    const result = await caller.operations.integrations.ingestSource({ sourceType: "email_attachment", payload: { reference: "AR-OWNER-0001", buyer: "Northstar Foods GmbH" } });

    expect(result).toMatchObject({ receiptId: 99, routingStatus: "pending", candidates: [{ tradeId: 7, confidence: 0.68 }] });
    expect(persistence.createReceipt).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 1, tradeId: undefined, routingStatus: "pending", routingContext: expect.objectContaining({ scoreVersion: "deterministic-v2" }) }));
    expect(persistence.appendAudit).toHaveBeenCalledWith(expect.objectContaining({ action: "source_receipt.unlinked_intake", objectId: "99" }));
  });
});
