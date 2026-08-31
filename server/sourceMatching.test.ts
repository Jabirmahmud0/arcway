import { describe, expect, it } from "vitest";
import { rankTradeTwinCandidates } from "./sourceMatching";

const trades = [
  { id: 1, reference: "AR-2026-001", buyerName: "Northstar Foods GmbH", sellerName: "Meridian Export House LLC", commodity: "Arabica coffee", expectedShipmentDate: new Date("2026-09-03T00:00:00Z") },
  { id: 2, reference: "AR-2026-002", buyerName: "Baltic Grocers AS", sellerName: "Meridian Export House LLC", commodity: "Tea leaves", expectedShipmentDate: new Date("2026-10-03T00:00:00Z") },
];

describe("rankTradeTwinCandidates", () => {
  it("ranks a retained nested source payload using explicit reference, party, product, and date signals", () => {
    const candidates = rankTradeTwinCandidates({ workbook: { preview: [{ reference: "AR-2026-001", buyer: "Northstar Foods GmbH", item: "Arabica coffee", eta: "2026-09-03" }] } }, trades);
    expect(candidates[0]).toMatchObject({ tradeId: 1, confidence: 0.82 });
    expect(candidates[0].signals.map(signal => signal.field)).toEqual(["trade reference", "buyer", "commodity", "expected shipment date"]);
  });

  it("does not invent a candidate when retained source values contain no trade signals", () => {
    expect(rankTradeTwinCandidates({ supplierInvoice: "INV-993", unrelated: "No trade reference supplied" }, trades)).toEqual([]);
  });

  it("uses a retained shipment identifier plus supporting total amount as an explainable candidate signal", () => {
    const profiles = [{ ...trades[0], totalValue: "102000", currency: "USD", shipmentReferences: ["BK-NS-4402"] }, { ...trades[1], totalValue: "83000", currency: "USD", shipmentReferences: ["BK-BG-202"] }];
    const candidates = rankTradeTwinCandidates({ carrierNotice: { bookingReference: "BK-NS-4402", declaredValue: "USD 102,000" } }, profiles);
    expect(candidates).toEqual([expect.objectContaining({ tradeId: 1, confidence: 0.4, signals: [{ field: "shipment reference", matched: "BK-NS-4402", weight: 0.32 }, { field: "trade total amount", matched: "USD 102000", weight: 0.08 }] })]);
  });

  it("does not propose a Trade Twin from a shared amount alone", () => {
    const profiles = [{ ...trades[0], totalValue: "102000", currency: "USD" }, { ...trades[1], totalValue: "102000", currency: "USD" }];
    expect(rankTradeTwinCandidates({ amount: "USD 102,000" }, profiles)).toEqual([]);
  });
});
