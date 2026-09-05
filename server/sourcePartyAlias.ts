type Counterparty = { id: number; legalName: string; countryCode: string; tradingNames: unknown; validTo: Date | null };
export type SourcePartyAliasProposal = { sourceName: string; master: { id: number; legalName: string; countryCode: string }; confidence: number; signals: string[]; disposition: "review_required"; outcome: "no_merge" };

const suffixes = new Set(["gmbh", "llc", "ltd", "limited", "inc", "incorporated", "corp", "co", "company", "sa", "bv", "plc"]);
function words(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").split(" ").filter(word => word.length > 1 && !suffixes.has(word)); }
function canonical(value: string) { return words(value).join(""); }
function similarity(left: string, right: string) { const a = new Set(words(left)); const b = new Set(words(right)); return Array.from(a).filter(word => b.has(word)).length / Math.max(a.size, b.size, 1); }
function values(payload: unknown, key = ""): Array<{ key: string; value: string }> { if (typeof payload === "string") return [{ key, value: payload }]; if (Array.isArray(payload)) return payload.flatMap(item => values(item, key)); if (!payload || typeof payload !== "object") return []; return Object.entries(payload as Record<string, unknown>).flatMap(([childKey, child]) => values(child, childKey)); }

export function buildSourcePartyAliasProposals(payload: unknown, counterparties: Counterparty[]): SourcePartyAliasProposal[] {
  const sourceNames = Array.from(new Set(values(payload).filter(item => /buyer|seller|supplier|vendor|shipper|consignee|counterparty|party/i.test(item.key) && item.value.trim().length >= 4 && !item.value.includes("@")).map(item => item.value.replace(/\s+/g, " ").trim()))).slice(0, 20);
  const proposals: SourcePartyAliasProposal[] = [];
  for (const sourceName of sourceNames) for (const master of counterparties.filter(item => !item.validTo)) {
    const aliases = [master.legalName, ...(Array.isArray(master.tradingNames) ? master.tradingNames.filter((item): item is string => typeof item === "string") : [])]; const source = canonical(sourceName); let confidence = 0; const signals: string[] = [];
    if (aliases.some(alias => canonical(alias) === source)) { confidence = 0.92; signals.push("exact normalized retained source-party and master name"); }
    else if (words(sourceName).length >= 2 && aliases.some(alias => Math.min(canonical(alias).length, source.length) >= 6 && (canonical(alias).includes(source) || source.includes(canonical(alias))))) { confidence = 0.85; signals.push("normalized retained source-party name containment"); }
    else if (Math.max(...aliases.map(alias => similarity(alias, sourceName)), 0) >= 0.82) { confidence = 0.82; signals.push("strong retained source-party token overlap"); }
    if (confidence >= 0.82) proposals.push({ sourceName, master: { id: master.id, legalName: master.legalName, countryCode: master.countryCode }, confidence, signals, disposition: "review_required", outcome: "no_merge" });
  }
  return proposals.sort((a, b) => b.confidence - a.confidence || a.sourceName.localeCompare(b.sourceName) || a.master.legalName.localeCompare(b.master.legalName));
}
