export type ChangeImpactSeverity = "blocker" | "warning" | "information";

export type ChangeImpactItem = {
  category: "document" | "obligation" | "release" | "shipment" | "settlement";
  target: string;
  severity: ChangeImpactSeverity;
  reason: string;
  action: string;
};

type WorkspaceLike = {
  documents: Array<{ documentType: string; status: string }>;
  obligations: Array<{ actor: string; action: string; status: string; deadline: Date | null }>;
  shipments: Array<{ bookingReference: string | null; etd: Date | null; eta: Date | null }>;
  paymentTerms: Array<{ method: string }>;
};

const normalize = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");

function hasDocument(workspace: WorkspaceLike, expression: RegExp) {
  return workspace.documents.some(document => expression.test(document.documentType));
}

function addReleaseImpact(items: ChangeImpactItem[], target: string, severity: ChangeImpactSeverity, reason: string) {
  items.push({ category: "release", target, severity, reason, action: "Rerun the relevant preflight gate after the source decision is retained." });
}

/**
 * Deterministic impact analysis intentionally makes no compliance or legal conclusion.
 * It explains operational artifacts that a reviewer must reconcile before release.
 */
export function buildChangeImpact(input: { fieldName: string; selectedValue?: string; workspace: WorkspaceLike }) {
  const field = normalize(input.fieldName);
  const value = input.selectedValue?.trim();
  const items: ChangeImpactItem[] = [];

  if (/(quantity|weight|dimension|package|carton|volume)/.test(field)) {
    for (const documentType of ["commercial invoice", "packing list", "shipping instruction", "VGM"]) {
      if (hasDocument(input.workspace, new RegExp(documentType.replace(" ", "\\s+"), "i"))) {
        items.push({ category: "document", target: documentType, severity: "blocker", reason: `${input.fieldName} is a cross-document physical or commercial value${value ? ` selected as ${value}` : ""}.`, action: "Reconcile the issued or uploaded document value against the retained canonical decision." });
      }
    }
    addReleaseImpact(items, "Ready to ship", "blocker", "Quantity, weight, and package values are deterministic release checks.");
    addReleaseImpact(items, "Ready for presentation / payment", "warning", "Documentary presentation can inherit commercial and packing discrepancies.");
  } else if (/(incoterm|port|origin|destination|consignee|buyer|seller)/.test(field)) {
    for (const documentType of ["commercial invoice", "packing list", "shipping instruction"]) {
      if (hasDocument(input.workspace, new RegExp(documentType.replace(" ", "\\s+"), "i"))) {
        items.push({ category: "document", target: documentType, severity: "warning", reason: `${input.fieldName} controls trade terms or routing represented in the document.`, action: "Verify parties, route, and commercial terms before issuing or presenting the document." });
      }
    }
    addReleaseImpact(items, "Commercially confirmed", "warning", "Commercial parties, route, and terms must remain internally coherent.");
    addReleaseImpact(items, "Ready to ship", "warning", "Shipping instructions and booking data may need reconciliation.");
  } else if (/(price|currency|amount|payment|deposit|tolerance|lc|letter_of_credit|presentation)/.test(field)) {
    if (hasDocument(input.workspace, /commercial\s+invoice|proforma\s+invoice/i)) {
      items.push({ category: "document", target: "commercial invoice", severity: "blocker", reason: `${input.fieldName} is represented in commercial evidence.`, action: "Reconcile amount, currency, and document wording before issuance or bank presentation." });
    }
    if (input.workspace.paymentTerms.length) {
      items.push({ category: "settlement", target: "payment terms", severity: "warning", reason: "The Trade Twin has retained settlement terms that may rely on this value.", action: "Review settlement conditions and any linked payment evidence." });
    }
    addReleaseImpact(items, "Ready for presentation / payment", "blocker", "Payment and documentary conditions require a reviewer-confirmed evidence trail.");
  } else if (/(date|cargo_ready|etd|eta|deadline|cutoff|cut_off|booking)/.test(field)) {
    if (input.workspace.shipments.length) {
      items.push({ category: "shipment", target: "booking and shipment milestones", severity: "blocker", reason: `${input.fieldName} can change the feasibility of retained shipment cut-offs and timing.`, action: "Review booking, cut-off, ETD, ETA, and the current execution exception state." });
    }
    for (const obligation of input.workspace.obligations.filter(item => item.status !== "fulfilled" && /(cargo|ship|book|pack|present|deliver)/i.test(`${item.actor} ${item.action}`))) {
      items.push({ category: "obligation", target: `${obligation.actor}: ${obligation.action}`, severity: "warning", reason: "This open obligation depends on execution timing.", action: "Confirm or reassign the deadline after the canonical timing decision." });
    }
    addReleaseImpact(items, "Ready for booking", "blocker", "Cargo-ready and cut-off timing are booking readiness controls.");
    addReleaseImpact(items, "Ready to ship", "warning", "Execution timing can invalidate a prior shipment readiness conclusion.");
  } else {
    addReleaseImpact(items, "Relevant preflight gate", "warning", "A material canonical decision may change the evidence used by a release check.");
  }

  const deduped = items.filter((item, index, all) => all.findIndex(candidate => candidate.category === item.category && candidate.target === item.target) === index);
  return {
    fieldName: input.fieldName,
    selectedValue: value ?? null,
    summary: deduped.length ? `${deduped.length} retained artifact${deduped.length === 1 ? "" : "s"} should be reviewed before relying on this canonical decision.` : "No retained artifacts are currently linked to this field; record the decision and rerun preflight when evidence arrives.",
    items: deduped,
  };
}
