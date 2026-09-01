import { describe, expect, it } from "vitest";
import { buildAlertQualityMetrics } from "./alertQuality";

describe("buildAlertQualityMetrics", () => {
  it("calculates retained outcome metrics and repeated false-alert counts without inferring causes", () => {
    const metrics = buildAlertQualityMetrics([
      { id: 1, tradeId: 101, category: "documentation", title: "Quantity mismatch", severity: "critical", status: "resolved", resolutionOutcome: "corrected" },
      { id: 2, tradeId: 102, category: "documentation", title: "Quantity mismatch", severity: "warning", status: "resolved", resolutionOutcome: "duplicate" },
      { id: 3, tradeId: 103, category: "documentation", title: "Quantity mismatch", severity: "warning", status: "resolved", resolutionOutcome: "not_actionable" },
      { id: 4, tradeId: 104, category: "logistics", title: "Booking cut-off", severity: "critical", status: "open", resolutionOutcome: null },
    ]);
    expect(metrics).toMatchObject({ totalExceptions: 4, resolvedExceptions: 3, openExceptions: 1, actionableResolved: 1, dismissedResolved: 2, exceptionPrecision: 33.3, criticalAlertPrecision: 100, dismissalRate: 66.7, repeatedFalseAlerts: 1, repeatedFalseAlertRate: 50, repeatedDismissalPatterns: [{ category: "documentation", title: "Quantity mismatch", count: 2, repeatedCount: 1 }], hasOutcomeData: true });
    expect(metrics.repeatedDismissalPatterns[0].retainedReferences).toEqual([{ exceptionId: 2, tradeId: 102 }, { exceptionId: 3, tradeId: 103 }]);
  });
  it("returns explicit no-data metrics instead of fabricated quality rates", () => {
    const metrics = buildAlertQualityMetrics([{ id: 4, tradeId: 104, category: "logistics", title: "Booking cut-off", severity: "critical", status: "open", resolutionOutcome: null }]);
    expect(metrics).toMatchObject({ hasOutcomeData: false, exceptionPrecision: null, criticalAlertPrecision: null, dismissalRate: null, repeatedFalseAlertRate: null, repeatedDismissalPatterns: [] });
  });
});
