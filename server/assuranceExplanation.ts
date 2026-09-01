type Input = {
  documents: Array<{ id: number; documentType: string; status: string }>;
  exceptions: Array<{ id: number; title: string; severity: string; status: string }>;
  obligations: Array<{ id: number; action: string; criticality: string; status: string; deadline: Date | null }>;
  fields: Array<{ id: number; fieldName: string; authority: string }>;
  preflightRuns: Array<{ id: number; gate: string; status: string; createdAt: Date }>;
  now: Date;
};
export type AssuranceReason = { kind: "document" | "exception" | "obligation" | "evidence_conflict" | "preflight"; title: string; detail: string; action: string; severity: "critical" | "warning" };

export function buildAssuranceExplanation(input: Input) {
  const reasons: AssuranceReason[] = [];
  for (const document of input.documents.filter(item => item.status === "rejected")) reasons.push({ kind: "document", severity: "critical", title: `${document.documentType} is rejected`, detail: "A retained document is in the rejected state and requires correction or replacement.", action: "Open the Document Workbench and resolve the rejection before relying on this evidence." });
  for (const exception of input.exceptions.filter(item => !["resolved", "closed", "dismissed"].includes(item.status) && ["critical", "high"].includes(item.severity))) reasons.push({ kind: "exception", severity: "critical", title: exception.title, detail: `Retained ${exception.severity} exception is still ${exception.status}.`, action: "Record an evidence-backed exception outcome or escalate the owner." });
  for (const obligation of input.obligations.filter(item => item.status !== "fulfilled" && (item.criticality === "critical" || item.status === "overdue"))) reasons.push({ kind: "obligation", severity: "critical", title: obligation.action, detail: `${obligation.criticality} obligation is ${obligation.status}${obligation.deadline ? ` with retained deadline ${obligation.deadline.toISOString().slice(0, 10)}` : " with no retained deadline"}.`, action: "Fulfil, evidence, or escalate the retained obligation." });
  for (const field of input.fields.filter(item => item.authority === "conflicting")) reasons.push({ kind: "evidence_conflict", severity: "warning", title: `${field.fieldName} has conflicting evidence`, detail: "Retained sources disagree on this field and no automatic canonical selection is made here.", action: "Open the Comparison Matrix and retain a Reviewer canonicalization decision if appropriate." });
  const latest = [...input.preflightRuns].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  if (latest && ["blocked", "at_risk", "insufficient_data"].includes(latest.status)) reasons.push({ kind: "preflight", severity: latest.status === "blocked" ? "critical" : "warning", title: `${latest.gate} preflight is ${latest.status.replaceAll("_", " ")}`, detail: "This is the latest retained preflight result; it is not recalculated by the explanation.", action: "Review the preflight checks, waivers, and underlying retained evidence before release." });
  const critical = reasons.filter(reason => reason.severity === "critical");
  const hasRetainedAssuranceContext = input.documents.length + input.exceptions.length + input.obligations.length + input.fields.length + input.preflightRuns.length > 0;
  return { status: critical.length ? "blocked" as const : reasons.length ? "attention" as const : !hasRetainedAssuranceContext ? "insufficient_evidence" as const : "no_retained_blocker" as const, summary: critical.length ? `${critical.length} retained blocking condition${critical.length === 1 ? "" : "s"} require action before assurance release.` : reasons.length ? `${reasons.length} retained attention signal${reasons.length === 1 ? "" : "s"} should be reviewed before release.` : !hasRetainedAssuranceContext ? "I don't have enough retained assurance evidence to explain whether this Trade Twin is blocked. This is not a release decision or certification." : "No retained blocking condition was identified. This is not a release decision or certification.", reasons };
}
