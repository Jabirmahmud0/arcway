import { describe, expect, it } from "vitest";
import { aggregateProductExposure, aggregateTrustNetwork } from "../shared/reporting";

describe("ARCWAY executive reporting aggregations", () => {
  it("aggregates product concentration from real line/product inputs without conflating product and commodity", () => {
    const result = aggregateProductExposure([{ line: { sku: "A-1", description: "Fallback", totalValue: "100" }, trade: { id: 1, executionState: "blocked", trustBand: "critical" }, product: { sku: "COFFEE-1", description: "Arabica" } }, { line: { sku: "A-1", description: "Fallback", totalValue: "50" }, trade: { id: 1, executionState: "blocked", trustBand: "critical" }, product: { sku: "COFFEE-1", description: "Arabica" } }]);
    expect(result).toEqual([{ label: "COFFEE-1 · Arabica", value: 150, lines: 2, trades: 1, blocked: 2, critical: 2 }]);
  });
  it("builds explainable buyer and seller network exposure records", () => {
    const result = aggregateTrustNetwork([{ sellerName: "Seller A", buyerName: "Buyer B", totalValue: "80", executionState: "blocked", trustBand: "guarded" }]);
    expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ label: "Seller A (seller)", value: 80, blocked: 1 }), expect.objectContaining({ label: "Buyer B (buyer)", value: 80, blocked: 1 })]));
  });
});
