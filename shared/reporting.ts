export type ProductExposureInput = { line: { sku: string | null; description: string; totalValue: string | number | null }; trade: { id: number; executionState: string; trustBand: string }; product: { sku: string; description: string } | null };
export type ExposureAggregate = { label: string; value: number; lines: number; trades: number; blocked: number; critical: number };

export function aggregateProductExposure(rows: ProductExposureInput[]): ExposureAggregate[] {
  const values = new Map<string, ExposureAggregate & { tradeIds: Set<number> }>();
  rows.forEach(row => { const label = row.product ? `${row.product.sku} · ${row.product.description}` : `${row.line.sku || "Unlinked SKU"} · ${row.line.description}`; const entry = values.get(label) ?? { label, value: 0, lines: 0, trades: 0, blocked: 0, critical: 0, tradeIds: new Set<number>() }; entry.value += Number(row.line.totalValue || 0); entry.lines += 1; entry.tradeIds.add(row.trade.id); entry.blocked += row.trade.executionState === "blocked" ? 1 : 0; entry.critical += row.trade.trustBand === "critical" ? 1 : 0; values.set(label, entry); });
  return Array.from(values.values()).map(({ tradeIds, ...entry }) => ({ ...entry, trades: tradeIds.size })).sort((a, b) => b.value - a.value);
}

export function aggregateTrustNetwork(rows: Array<{ sellerName: string; buyerName: string; totalValue: string | number; executionState: string; trustBand: string }>) {
  const participants = new Map<string, { label: string; value: number; trades: number; blocked: number; critical: number }>();
  rows.forEach(row => [row.sellerName, row.buyerName].forEach((name, index) => { const label = `${name} (${index === 0 ? "seller" : "buyer"})`; const entry = participants.get(label) ?? { label, value: 0, trades: 0, blocked: 0, critical: 0 }; entry.value += Number(row.totalValue || 0); entry.trades += 1; entry.blocked += row.executionState === "blocked" ? 1 : 0; entry.critical += row.trustBand === "critical" ? 1 : 0; participants.set(label, entry); }));
  return Array.from(participants.values()).sort((a, b) => b.value - a.value);
}
