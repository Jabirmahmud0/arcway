export type CounterpartyCandidate = { id: number; legalName: string; countryCode: string; taxId: string | null; tradingNames: unknown; validTo: Date | null };
export type EntityResolutionProposal = { left: Pick<CounterpartyCandidate, "id" | "legalName" | "countryCode">; right: Pick<CounterpartyCandidate, "id" | "legalName" | "countryCode">; confidence: number; signals: string[]; disposition: "review_required" };

const legalSuffixes = new Set(["gmbh", "llc", "ltd", "limited", "inc", "incorporated", "corp", "co", "company", "sa", "bv", "plc"]);
function words(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").split(" ").filter(word => word.length > 1 && !legalSuffixes.has(word)); }
function canonical(value: string) { return words(value).join(""); }
function aliases(counterparty: CounterpartyCandidate) { const extra = Array.isArray(counterparty.tradingNames) ? counterparty.tradingNames.filter((item): item is string => typeof item === "string") : []; return [counterparty.legalName, ...extra].map(canonical).filter(Boolean); }
function overlap(left: string, right: string) { const a = new Set(words(left)); const b = new Set(words(right)); const shared = Array.from(a).filter(word => b.has(word)).length; return shared / Math.max(a.size, b.size, 1); }

export function buildEntityResolutionProposals(counterparties: CounterpartyCandidate[]) {
  const current = counterparties.filter(counterparty => !counterparty.validTo);
  const proposals: EntityResolutionProposal[] = [];
  for (let index = 0; index < current.length; index += 1) for (let otherIndex = index + 1; otherIndex < current.length; otherIndex += 1) {
    const left = current[index]; const right = current[otherIndex]; if (left.countryCode !== right.countryCode) continue;
    const leftAliases = aliases(left); const rightAliases = aliases(right); const signals: string[] = [];
    let confidence = 0;
    if (left.taxId && right.taxId && left.taxId.trim().toLowerCase() === right.taxId.trim().toLowerCase()) { confidence = 0.99; signals.push("same retained tax identifier"); }
    if (leftAliases.some(alias => rightAliases.includes(alias))) { confidence = Math.max(confidence, 0.9); signals.push("exact normalized legal or trading name"); }
    if (leftAliases.some(leftAlias => rightAliases.some(rightAlias => Math.min(leftAlias.length, rightAlias.length) >= 5 && (leftAlias.includes(rightAlias) || rightAlias.includes(leftAlias))))) { confidence = Math.max(confidence, 0.84); signals.push("normalized name containment with same retained country"); }
    const bestOverlap = Math.max(...leftAliases.flatMap(leftAlias => rightAliases.map(rightAlias => overlap(leftAlias, rightAlias))), 0);
    if (bestOverlap >= 0.75) { confidence = Math.max(confidence, Math.round((0.55 + bestOverlap * 0.4) * 100) / 100); signals.push("strong normalized name token overlap"); }
    if (confidence < 0.8) continue;
    proposals.push({ left: { id: left.id, legalName: left.legalName, countryCode: left.countryCode }, right: { id: right.id, legalName: right.legalName, countryCode: right.countryCode }, confidence, signals, disposition: "review_required" });
  }
  return proposals.sort((a, b) => b.confidence - a.confidence || a.left.legalName.localeCompare(b.left.legalName));
}
