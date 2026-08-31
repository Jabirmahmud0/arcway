export type HistoricalTradeRecord = { id: number; reference: string; buyerName: string; sellerName: string; totalValue: string; currency: string; createdAt: Date; documentCount: number; evidenceFieldCount: number; exceptionCount: number; criticalExceptionCount: number; openCriticalObligationCount: number; sourceReceiptCount: number; shadowEventCount: number };

export function buildHistoricalShadowReview(input: { from: Date; to: Date; trades: HistoricalTradeRecord[]; pendingUnlinkedReceipts: number }) {
  const reconstructed = input.trades.filter(trade => trade.documentCount > 0 && (trade.evidenceFieldCount > 0 || trade.shadowEventCount > 0));
  const clarificationTrades = input.trades.filter(trade => !reconstructed.some(item => item.id === trade.id) || trade.criticalExceptionCount > 0 || trade.openCriticalObligationCount > 0);
  const discrepancies = input.trades.reduce((total, trade) => total + trade.exceptionCount, 0);
  const highRiskExceptions = input.trades.reduce((total, trade) => total + trade.criticalExceptionCount, 0);
  const openCriticalObligations = input.trades.reduce((total, trade) => total + trade.openCriticalObligationCount, 0);
  const estimatedManualReconciliationHours = Number((discrepancies * 1.25 + openCriticalObligations * 0.75 + input.pendingUnlinkedReceipts * 0.5).toFixed(1));
  return {
    boundary: "Read-only historical review of retained ARCWAY records. Reconstruction counts describe available evidence, not legal, regulatory, banking, or trade-compliance certification.",
    period: { from: input.from, to: input.to },
    metrics: { tradesDiscovered: input.trades.length, reconstructedAutomatically: reconstructed.length, needClarification: clarificationTrades.length + input.pendingUnlinkedReceipts, discrepanciesFound: discrepancies, highRiskExceptions, openCriticalObligations, pendingUnlinkedReceipts: input.pendingUnlinkedReceipts, estimatedManualReconciliationHours },
    trades: input.trades.map(trade => ({ ...trade, reconstructionStatus: reconstructed.some(item => item.id === trade.id) ? trade.criticalExceptionCount > 0 || trade.openCriticalObligationCount > 0 ? "reconstructed_with_attention" : "reconstructed" : "needs_clarification" })),
  };
}
