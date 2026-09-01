export type CommitmentCandidate = { commitment: "cargo_ready" | "delivery" | "shipment"; quantity: string | null; unit: string | null; date: string | null; dateExpression: string | null; actor: string; confidence: number; evidence: string; method: "deterministic_pattern"; engineVersion: "commitment-extractor-v1"; reviewRequired: true };

function payloadValues(payload: unknown): string[] { if (typeof payload === "string" || typeof payload === "number") return [String(payload)]; if (Array.isArray(payload)) return payload.flatMap(payloadValues); if (!payload || typeof payload !== "object") return []; return Object.values(payload as Record<string, unknown>).flatMap(payloadValues); }
function clean(value: string) { return value.replace(/\s+/g, " ").trim(); }
function findDate(text: string) { const iso = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/); if (iso) return { date: iso[1], expression: iso[1] }; const named = text.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow)\b/i); return named ? { date: null, expression: named[1] } : { date: null, expression: null }; }

export function extractCommitmentCandidates(payload: unknown) {
  const text = clean(payloadValues(payload).join(" "));
  if (!text) return [] as CommitmentCandidate[];
  const candidates: CommitmentCandidate[] = [];
  const expression = /(cargo[ -]?ready|deliver(?:y|ed|ing)?|ship(?:ment|ped|ping)?)(?:\s+(?:the|a|our|revised|up to|approximately|about))*\s*([\d,]+(?:\.\d+)?)?\s*(units?|pieces?|pcs|kg|mt|tons?|cartons?)?(?:\s+(?:by|on|before)\s+([^.!?;]+))?/gi;
  for (const match of Array.from(text.matchAll(expression))) {
    const verb = match[1].toLowerCase(); const quantity = match[2]?.replace(/,/g, "") ?? null; const unit = match[3]?.toLowerCase() ?? null; const dateInfo = findDate(match[0]);
    if (!quantity && !dateInfo.expression) continue;
    const commitment = /cargo/.test(verb) ? "cargo_ready" : /ship/.test(verb) ? "shipment" : "delivery";
    const confidence = Number((0.42 + (quantity ? 0.2 : 0) + (unit ? 0.08 : 0) + (dateInfo.expression ? 0.18 : 0) + (dateInfo.date ? 0.08 : 0)).toFixed(2));
    candidates.push({ commitment, quantity, unit, date: dateInfo.date, dateExpression: dateInfo.expression, actor: "source counterparty", confidence, evidence: clean(match[0]), method: "deterministic_pattern", engineVersion: "commitment-extractor-v1", reviewRequired: true });
  }
  return candidates.slice(0, 10);
}
