export type LcReadinessStatus = "ready" | "ready_with_warnings" | "at_risk" | "blocked" | "insufficient_data";

export type LcCheck = {
  key: string;
  title: string;
  status: LcReadinessStatus;
  detail: string;
  action: string;
};

type LcWorkspace = {
  paymentTerms: Array<{ method: string; lcReference: string | null; presentationDays: number | null; latestShipmentDate: Date | null; specialClauses: unknown }>;
  documents: Array<{ documentType: string; status: string }>;
  fields: Array<{ fieldName: string; authority: string }>;
};

const normalize = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");

function documentFor(workspace: LcWorkspace, requirement: string) {
  const expected = normalize(requirement);
  return workspace.documents.find(document => normalize(document.documentType).includes(expected) || expected.includes(normalize(document.documentType)));
}

function worstStatus(checks: LcCheck[]): LcReadinessStatus {
  if (checks.some(check => check.status === "blocked")) return "blocked";
  if (checks.some(check => check.status === "at_risk")) return "at_risk";
  if (checks.some(check => check.status === "insufficient_data")) return "insufficient_data";
  if (checks.some(check => check.status === "ready_with_warnings")) return "ready_with_warnings";
  return "ready";
}

/** Deterministic LC-document readiness only; never a bank, legal, or compliance guarantee. */
export function evaluateLcPreflight(workspace: LcWorkspace, now = new Date()) {
  const term = workspace.paymentTerms.find(item => item.method === "letter_of_credit");
  if (!term) {
    return {
      applicable: false,
      status: "insufficient_data" as LcReadinessStatus,
      documentsVerified: 0,
      documentsRequired: 0,
      checks: [{ key: "lc_not_configured", title: "Letter of credit terms", status: "insufficient_data" as LcReadinessStatus, detail: "No letter-of-credit settlement term is retained for this Trade Twin.", action: "Record the applicable payment method and LC terms before using specialist presentation preflight." }],
      disclaimer: "ARCWAY reports available evidence and configured conditions. It does not provide bank, legal, or regulatory certification.",
    };
  }

  const checks: LcCheck[] = [];
  checks.push(term.lcReference
    ? { key: "lc_reference", title: "LC reference", status: "ready", detail: `LC reference ${term.lcReference} is retained.`, action: "Keep the issuing-bank reference aligned with the presented document set." }
    : { key: "lc_reference", title: "LC reference", status: "blocked", detail: "No LC reference is retained for this documentary presentation.", action: "Record the bank LC reference before presentation readiness can be assessed." });
  checks.push(term.presentationDays
    ? { key: "presentation_period", title: "Presentation period", status: "ready", detail: `${term.presentationDays} presentation day(s) are configured.`, action: "Confirm the actual shipment date before calculating the final presentation deadline." }
    : { key: "presentation_period", title: "Presentation period", status: "ready_with_warnings", detail: "No presentation period is configured.", action: "Record the documentary presentation period or retain an explicit reviewer waiver." });
  if (term.latestShipmentDate) {
    checks.push(term.latestShipmentDate < now
      ? { key: "latest_shipment", title: "Latest shipment date", status: "at_risk", detail: `Configured latest shipment date ${term.latestShipmentDate.toLocaleDateString()} has passed.`, action: "Confirm a bank-approved amendment or record a reviewer exception before release." }
      : { key: "latest_shipment", title: "Latest shipment date", status: "ready", detail: `Latest shipment date ${term.latestShipmentDate.toLocaleDateString()} is still in the future.`, action: "Reassess this deadline whenever cargo-ready or booking dates change." });
  } else {
    checks.push({ key: "latest_shipment", title: "Latest shipment date", status: "ready_with_warnings", detail: "No latest shipment date is retained.", action: "Record the LC latest shipment date when it is available." });
  }

  const clauses = Array.isArray(term.specialClauses) ? term.specialClauses.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
  const requiredDocuments = Array.from(new Set(["commercial invoice", "packing list", ...clauses.map(clause => normalize(clause))]));
  let verified = 0;
  for (const requirement of requiredDocuments) {
    const document = documentFor(workspace, requirement);
    if (document?.status === "verified") {
      verified += 1;
      checks.push({ key: `document_${requirement}`, title: requirement, status: "ready", detail: `Verified ${document.documentType} is retained.`, action: "Confirm issued version, dates, and wording remain aligned at presentation." });
    } else if (document && document.status !== "pending") {
      checks.push({ key: `document_${requirement}`, title: requirement, status: "ready_with_warnings", detail: `${document.documentType} is ${document.status}, not verified.`, action: "Complete reviewer verification before treating this document as presentation-ready." });
    } else {
      checks.push({ key: `document_${requirement}`, title: requirement, status: "blocked", detail: `Required ${requirement} evidence is not verified.`, action: "Upload and verify the required document or retain a reviewer-approved exception." });
    }
  }
  const conflictingFields = workspace.fields.filter(field => field.authority === "conflicting");
  if (conflictingFields.length) checks.push({ key: "cross_document_conflicts", title: "Cross-document consistency", status: "blocked", detail: `${conflictingFields.length} conflicting retained field${conflictingFields.length === 1 ? " remains" : "s remain"}.`, action: "Resolve material source conflicts and rerun this preflight before presentation." });
  else checks.push({ key: "cross_document_conflicts", title: "Cross-document consistency", status: "ready", detail: "No retained evidence field is currently marked conflicting.", action: "Rerun this check after any source or canonical decision changes." });

  return { applicable: true, status: worstStatus(checks), documentsVerified: verified, documentsRequired: requiredDocuments.length, checks, disclaimer: "ARCWAY reports available evidence and configured conditions. It does not provide bank, legal, or regulatory certification." };
}
