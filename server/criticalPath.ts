export type CriticalPathItem = { key: string; kind: "obligation" | "shipment_cutoff" | "planned_shipment"; title: string; dueAt: Date; status: "overdue" | "at_risk" | "planned"; detail: string; action: string };

type Input = {
  now: Date;
  expectedShipmentDate: Date;
  obligations: Array<{ id: number; actor: string; action: string; status: "open" | "fulfilled" | "overdue"; criticality: "critical" | "warning" | "information"; deadline: Date | null }>;
  obligationDependencies?: Array<{ obligationId: number; dependsOnObligationId: number; dependencyType: "blocks_release" | "blocks_task" | "evidence_prerequisite" }>;
  shipments: Array<{ bookingReference: string | null; etd: Date | null; cutoffs: unknown }>;
};

function asDate(value: unknown) { if (typeof value !== "string" && !(value instanceof Date)) return undefined; const date = new Date(value); return Number.isNaN(date.getTime()) ? undefined : date; }
function riskForDate(dueAt: Date, now: Date): CriticalPathItem["status"] { if (dueAt < now) return "overdue"; return dueAt.getTime() - now.getTime() <= 72 * 60 * 60 * 1000 ? "at_risk" : "planned"; }

export function buildTradeCriticalPath(input: Input) {
  const items: CriticalPathItem[] = [];
  const obligationById = new Map(input.obligations.map(obligation => [obligation.id, obligation]));
  const releaseDependencies = new Map<number, string[]>();
  for (const dependency of input.obligationDependencies ?? []) {
    if (dependency.dependencyType !== "blocks_release") continue;
    const prerequisite = obligationById.get(dependency.dependsOnObligationId);
    const blocked = obligationById.get(dependency.obligationId);
    if (!prerequisite || prerequisite.status === "fulfilled" || !blocked) continue;
    releaseDependencies.set(prerequisite.id, [...(releaseDependencies.get(prerequisite.id) ?? []), blocked.action]);
  }
  for (const obligation of input.obligations.filter(item => item.status !== "fulfilled" && (item.deadline || releaseDependencies.has(item.id)))) {
    const dependentActions = releaseDependencies.get(obligation.id) ?? [];
    const hasRetainedDeadline = Boolean(obligation.deadline);
    const dueAt = obligation.deadline ?? input.expectedShipmentDate;
    const status = obligation.status === "overdue" ? "overdue" : riskForDate(dueAt, input.now);
    const releaseDetail = dependentActions.length ? ` · release prerequisite for ${dependentActions.join(", ")}` : "";
    const timingDetail = hasRetainedDeadline ? "" : " · no independent obligation deadline retained; shown against the planned shipment date for sequence only";
    const action = !hasRetainedDeadline ? "Record an evidence-backed obligation deadline and fulfil the release prerequisite." : status === "overdue" ? "Escalate or fulfil the retained obligation before the next handoff." : "Confirm ownership, evidence, and deadline readiness.";
    items.push({ key: `obligation-${obligation.id}`, kind: "obligation", title: obligation.action, dueAt, status, detail: `${obligation.actor} · ${obligation.criticality} obligation${releaseDetail}${timingDetail}`, action });
  }
  for (const shipment of input.shipments) {
    const cutoffs = shipment.cutoffs && typeof shipment.cutoffs === "object" && !Array.isArray(shipment.cutoffs) ? shipment.cutoffs as Record<string, unknown> : {};
    for (const [name, rawDate] of Object.entries(cutoffs)) {
      const dueAt = asDate(rawDate); if (!dueAt) continue;
      const status = riskForDate(dueAt, input.now);
      items.push({ key: `shipment-${shipment.bookingReference ?? "unreferenced"}-${name}`, kind: "shipment_cutoff", title: `${name.replace(/([A-Z])/g, " $1")} cut-off`, dueAt, status, detail: `${shipment.bookingReference ?? "Unreferenced booking"} retained shipment cut-off`, action: "Confirm booking readiness and all cut-off-dependent evidence." });
    }
  }
  items.push({ key: "planned-shipment", kind: "planned_shipment", title: "Expected shipment date", dueAt: input.expectedShipmentDate, status: riskForDate(input.expectedShipmentDate, input.now), detail: "Trade Twin planned shipment milestone", action: "Reassess the path when cargo-ready, booking, or documentary dates change." });
  return items.sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime() || a.key.localeCompare(b.key));
}
