import type { Trade, TradeDocument } from "../drizzle/schema";

export type PreflightState = "ready" | "warning" | "blocked";
export type PreflightCheck = { id: string; gate: string; state: PreflightState; title: string; detail: string; action: string };

type EvaluationInput = {
  trade: Trade;
  documents: Pick<TradeDocument, "documentType" | "status">[];
  exceptions: Array<{ severity: "critical" | "warning" | "information"; status: "open" | "resolved"; title: string }>;
  obligations: Array<{ id: number; status: "open" | "fulfilled" | "overdue"; action: string; deadline: Date | null; criticality: "critical" | "warning" | "information" }>;
  obligationDependencies?: Array<{ obligationId: number; dependsOnObligationId: number; dependencyType: "blocks_release" | "blocks_task" | "evidence_prerequisite" }>;
};

const verified = (documents: EvaluationInput["documents"], documentType: TradeDocument["documentType"]) => documents.some(document => document.documentType === documentType && document.status === "verified");

export function evaluatePreflight(input: EvaluationInput) {
  const { trade, documents, exceptions, obligations, obligationDependencies = [] } = input;
  const criticalExceptions = exceptions.filter(item => item.status === "open" && item.severity === "critical");
  const openExceptions = exceptions.filter(item => item.status === "open" && item.severity !== "information");
  const overdueObligations = obligations.filter(item => item.status === "overdue" || (item.status === "open" && item.deadline && item.deadline < new Date()));
  const unresolvedReleaseDependencies = obligationDependencies.filter(dependency => {
    if (dependency.dependencyType !== "blocks_release") return false;
    return obligations.find(obligation => obligation.id === dependency.dependsOnObligationId)?.status !== "fulfilled";
  });
  const evidenceReady = ["commercial invoice", "packing list", "bill of lading", "certificate of origin", "inspection certificate", "LC/payment terms"].filter(type => verified(documents, type as TradeDocument["documentType"])).length;

  const checks: PreflightCheck[] = [
    {
      id: "commercial-confirmed", gate: "Gate 1", state: trade.commercialState === "confirmed" ? "ready" : "blocked",
      title: "Commercially confirmed", detail: trade.commercialState === "confirmed" ? "The Trade Twin is confirmed for assurance." : "The trader must submit the commercial truth for assurance.", action: "Submit the Trade Twin for review.",
    },
    {
      id: "production-obligations", gate: "Gate 2", state: unresolvedReleaseDependencies.length || overdueObligations.some(item => item.criticality === "critical") ? "blocked" : overdueObligations.length ? "warning" : "ready",
      title: "Ready for production", detail: unresolvedReleaseDependencies.length ? `${unresolvedReleaseDependencies.length} release dependency${unresolvedReleaseDependencies.length === 1 ? " is" : " are"} unmet.` : overdueObligations.length ? `${overdueObligations.length} obligation${overdueObligations.length === 1 ? " is" : "s are"} overdue or at risk.` : "No overdue production obligations are recorded.", action: "Confirm the prerequisite obligation owner and delivery date.",
    },
    {
      id: "booking-evidence", gate: "Gate 3", state: verified(documents, "packing list") ? "ready" : "warning",
      title: "Ready for booking", detail: verified(documents, "packing list") ? "Packing evidence is verified for booking readiness." : "A verified packing list is not yet available for booking reconciliation.", action: "Upload and verify the final packing list.",
    },
    {
      id: "ship-evidence", gate: "Gate 4", state: verified(documents, "commercial invoice") && verified(documents, "certificate of origin") && verified(documents, "inspection certificate") ? "ready" : "blocked",
      title: "Ready to ship", detail: `Verified shipment-critical evidence: ${["commercial invoice", "certificate of origin", "inspection certificate"].filter(type => verified(documents, type as TradeDocument["documentType"])).length}/3.`, action: "Complete and verify shipment-critical evidence.",
    },
    {
      id: "presentation-payment", gate: "Gate 5", state: verified(documents, "bill of lading") && verified(documents, "LC/payment terms") && criticalExceptions.length === 0 ? "ready" : criticalExceptions.length ? "blocked" : "warning",
      title: "Ready for presentation / payment", detail: criticalExceptions.length ? `${criticalExceptions.length} critical exception${criticalExceptions.length === 1 ? " blocks" : "s block"} presentation.` : "Transport and settlement evidence must be verified before presentation.", action: "Resolve critical exceptions and verify transport and settlement evidence.",
    },
    {
      id: "close-trade", gate: "Gate 6", state: trade.assuranceState === "approved" && evidenceReady === 6 && openExceptions.length === 0 ? "ready" : "warning",
      title: "Ready to close", detail: trade.assuranceState === "approved" && evidenceReady === 6 ? "All expected evidence is verified and assurance has been approved." : "Closure requires an approved decision and a complete verified evidence set.", action: "Complete the assurance decision and close open evidence gaps.",
    },
  ];
  const summary = checks.some(item => item.state === "blocked") ? "blocked" : checks.some(item => item.state === "warning") ? "warning" : "ready";
  return { summary, checks, evidenceReady, criticalExceptions: criticalExceptions.length, openExceptions: openExceptions.length, overdueObligations: overdueObligations.length, unresolvedReleaseDependencies: unresolvedReleaseDependencies.length };
}
