export type AlertQualityException = { id: number; tradeId: number; category: string; title: string; severity: "critical" | "warning" | "information"; status: "open" | "resolved"; resolutionOutcome: "corrected" | "accepted_with_waiver" | "rejected_source" | "duplicate" | "not_actionable" | null };

const dismissed = new Set(["duplicate", "not_actionable"]);
const percentage = (numerator: number, denominator: number) => denominator ? Number((numerator / denominator * 100).toFixed(1)) : null;

export function buildAlertQualityMetrics(exceptions: AlertQualityException[]) {
  const resolved = exceptions.filter(exception => exception.status === "resolved" && exception.resolutionOutcome);
  const dismissedResolved = resolved.filter(exception => dismissed.has(exception.resolutionOutcome!));
  const actionableResolved = resolved.filter(exception => !dismissed.has(exception.resolutionOutcome!));
  const criticalResolved = resolved.filter(exception => exception.severity === "critical");
  const criticalActionable = criticalResolved.filter(exception => !dismissed.has(exception.resolutionOutcome!));
  const falseGroups = new Map<string, { category: string; title: string; count: number; retainedReferences: Array<{ exceptionId: number; tradeId: number }> }>();
  for (const exception of dismissedResolved) {
    const key = `${exception.category}:${exception.title.trim().toLowerCase()}`;
    const existing = falseGroups.get(key);
    const reference = { exceptionId: exception.id, tradeId: exception.tradeId };
    falseGroups.set(key, existing ? { ...existing, count: existing.count + 1, retainedReferences: [...existing.retainedReferences, reference] } : { category: exception.category, title: exception.title, count: 1, retainedReferences: [reference] });
  }
  const repeatedDismissalPatterns = Array.from(falseGroups.values()).filter(item => item.count > 1).map(item => ({ ...item, repeatedCount: item.count - 1, retainedReferences: item.retainedReferences.sort((left, right) => left.exceptionId - right.exceptionId).slice(0, 3) })).sort((left, right) => right.repeatedCount - left.repeatedCount || left.category.localeCompare(right.category) || left.title.localeCompare(right.title)).slice(0, 5);
  const repeatedFalseAlerts = repeatedDismissalPatterns.reduce((total, item) => total + item.repeatedCount, 0);
  return {
    totalExceptions: exceptions.length,
    resolvedExceptions: resolved.length,
    openExceptions: exceptions.filter(exception => exception.status === "open").length,
    actionableResolved: actionableResolved.length,
    dismissedResolved: dismissedResolved.length,
    exceptionPrecision: percentage(actionableResolved.length, resolved.length),
    criticalAlertPrecision: percentage(criticalActionable.length, criticalResolved.length),
    dismissalRate: percentage(dismissedResolved.length, resolved.length),
    repeatedFalseAlerts,
    repeatedFalseAlertRate: percentage(repeatedFalseAlerts, dismissedResolved.length),
    repeatedDismissalPatterns,
    hasOutcomeData: resolved.length > 0,
    boundary: "Metrics summarize retained reviewer resolution outcomes. They do not infer false-positive causes or predict future alert quality." as const,
  };
}
