export type TradeCandidateInput = {
  id: number;
  reference: string;
  buyerName: string;
  sellerName: string;
  commodity: string;
  expectedShipmentDate: Date;
  totalValue?: string | null;
  currency?: string | null;
  shipmentReferences?: string[];
};

export type SourceCandidate = {
  tradeId: number;
  reference: string;
  buyerName: string;
  sellerName: string;
  confidence: number;
  signals: Array<{ field: string; matched: string; weight: number }>;
};

function normalize(value: unknown) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function payloadValues(payload: unknown): string[] {
  if (typeof payload === "string" || typeof payload === "number") return [String(payload)];
  if (Array.isArray(payload)) return payload.flatMap(payloadValues);
  if (!payload || typeof payload !== "object") return [];
  return Object.values(payload as Record<string, unknown>).flatMap((value: unknown) => payloadValues(value));
}

function includesValue(values: string[], target: string) {
  const normalizedTarget = normalize(target);
  return normalizedTarget.length >= 3 && values.some(value => normalize(value).includes(normalizedTarget));
}

function amountMatches(values: string[], amount: string | null | undefined) {
  const expected = Number(String(amount ?? "").replace(/,/g, ""));
  if (!Number.isFinite(expected) || expected <= 0) return false;
  return values.some(value => String(value).match(/\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?/g)?.some(token => Number(token.replace(/,/g, "")) === expected));
}

export function rankTradeTwinCandidates(payload: unknown, trades: TradeCandidateInput[]): SourceCandidate[] {
  const values = payloadValues(payload);
  return trades.map(trade => {
    const signals: SourceCandidate["signals"] = [];
    if (includesValue(values, trade.reference)) signals.push({ field: "trade reference", matched: trade.reference, weight: 0.5 });
    if (includesValue(values, trade.buyerName)) signals.push({ field: "buyer", matched: trade.buyerName, weight: 0.18 });
    if (includesValue(values, trade.sellerName)) signals.push({ field: "supplier", matched: trade.sellerName, weight: 0.18 });
    if (includesValue(values, trade.commodity)) signals.push({ field: "commodity", matched: trade.commodity, weight: 0.09 });
    const shipmentDate = trade.expectedShipmentDate.toISOString().slice(0, 10);
    if (values.some(value => value.includes(shipmentDate))) signals.push({ field: "expected shipment date", matched: shipmentDate, weight: 0.05 });
    const shipmentReference = trade.shipmentReferences?.find(reference => includesValue(values, reference));
    if (shipmentReference) signals.push({ field: "shipment reference", matched: shipmentReference, weight: 0.32 });
    if (signals.length && amountMatches(values, trade.totalValue)) signals.push({ field: "trade total amount", matched: `${trade.currency ?? ""} ${trade.totalValue ?? ""}`.trim(), weight: 0.08 });
    return { tradeId: trade.id, reference: trade.reference, buyerName: trade.buyerName, sellerName: trade.sellerName, confidence: Math.min(0.99, Number(signals.reduce((total, signal) => total + signal.weight, 0).toFixed(2))), signals };
  }).filter(candidate => candidate.confidence > 0).sort((a, b) => b.confidence - a.confidence || a.reference.localeCompare(b.reference)).slice(0, 5);
}
