import { describe, expect, it } from "vitest";
import { buildHistoricalShadowReview } from "./shadowAuditReview";

describe("buildHistoricalShadowReview", () => {
  it("derives reconstruction and attention counts only from retained record aggregates", () => {
    const result = buildHistoricalShadowReview({ from: new Date("2026-08-01T00:00:00Z"), to: new Date("2026-08-31T23:59:59Z"), pendingUnlinkedReceipts: 2, trades: [
      { id: 1, reference: "AR-1", buyerName: "Buyer", sellerName: "Seller", totalValue: "100", currency: "USD", createdAt: new Date(), documentCount: 2, evidenceFieldCount: 3, exceptionCount: 2, criticalExceptionCount: 1, openCriticalObligationCount: 1, sourceReceiptCount: 2, shadowEventCount: 1 },
      { id: 2, reference: "AR-2", buyerName: "Buyer", sellerName: "Seller", totalValue: "200", currency: "USD", createdAt: new Date(), documentCount: 0, evidenceFieldCount: 0, exceptionCount: 0, criticalExceptionCount: 0, openCriticalObligationCount: 0, sourceReceiptCount: 0, shadowEventCount: 0 },
    ] });

    expect(result.metrics).toMatchObject({ tradesDiscovered: 2, reconstructedAutomatically: 1, needClarification: 4, discrepanciesFound: 2, highRiskExceptions: 1, openCriticalObligations: 1, pendingUnlinkedReceipts: 2, estimatedManualReconciliationHours: 4.3 });
    expect(result.trades.map(item => item.reconstructionStatus)).toEqual(["reconstructed_with_attention", "needs_clarification"]);
  });
});
