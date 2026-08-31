export type ProviderType = "email" | "storage" | "erp" | "carrier" | "visibility" | "ebl" | "compliance" | "payment" | "finance" | "identity";

export const providerCatalog: Array<{ type: ProviderType; name: string; description: string; capabilities: string[] }> = [
  { type: "email", name: "Operational Email", description: "Ingest messages and attachments, then propose trade links and commitments for review.", capabilities: ["email", "attachments", "commitments"] },
  { type: "storage", name: "Document Storage", description: "Discover trade evidence in cloud storage while preserving the source of truth.", capabilities: ["documents", "versions", "provenance"] },
  { type: "erp", name: "ERP Adapter", description: "Normalize purchase orders, commercial facts, and order revisions without replacing the ERP.", capabilities: ["orders", "revisions", "references"] },
  { type: "carrier", name: "Carrier Adapter", description: "Normalize booking, cut-off, vessel, and event information for obligation reconciliation.", capabilities: ["bookings", "cutoffs", "tracking"] },
  { type: "visibility", name: "Visibility Adapter", description: "Receive standardized shipment status signals from neutral visibility providers.", capabilities: ["milestones", "ETA", "exceptions"] },
  { type: "ebl", name: "eBL Adapter", description: "Connect to interoperable electronic bill of lading providers without creating a closed network.", capabilities: ["ebl", "endorsement", "documents"] },
  { type: "compliance", name: "Compliance Adapter", description: "Surface configured rule-set findings as reviewable assistance, not legal guarantees.", capabilities: ["screening", "rules", "evidence"] },
  { type: "payment", name: "Payment Evidence Adapter", description: "Record payment-status evidence and bank confirmations without moving funds.", capabilities: ["payment-status", "evidence"] },
  { type: "finance", name: "Finance Readiness Adapter", description: "Prepare permissioned finance-readiness information for partner review without credit decisions.", capabilities: ["finance-pack", "readiness"] },
  { type: "identity", name: "Identity Adapter", description: "Prepare organization verification and future SSO/provider identity connection points.", capabilities: ["identity", "verification"] },
];

export function simulateProviderRun(type: ProviderType, tradeReference: string) {
  const signal = {
    email: { entityType: "message", externalId: `mail-${tradeReference}-delay`, output: { linkedTrade: tradeReference, commitment: "cargo_ready_date", proposedDate: "2026-09-19", confidence: 0.88, requiresHumanConfirmation: true } },
    storage: { entityType: "document", externalId: `storage-${tradeReference}-packing-list`, output: { documentType: "packing list", detected: true, version: "final", confidence: 0.93 } },
    erp: { entityType: "order", externalId: `erp-${tradeReference}`, output: { orderReference: tradeReference, quantity: 24000, currency: "USD", revisionDetected: false } },
    carrier: { entityType: "booking", externalId: `carrier-${tradeReference}-booking`, output: { bookingReference: "BK-AR-88421", event: "shipping_instruction_cutoff", atRisk: true, deadline: "2026-09-01T16:00:00Z" } },
    visibility: { entityType: "shipment_event", externalId: `visibility-${tradeReference}-eta`, output: { milestone: "estimated_departure", eta: "2026-09-30", confidence: 0.78, driver: "booking cut-off risk" } },
    ebl: { entityType: "ebl", externalId: `ebl-${tradeReference}`, output: { status: "draft", issuer: "Demonstration interoperable provider", actionRequired: "Confirm document party data" } },
    compliance: { entityType: "compliance_finding", externalId: `compliance-${tradeReference}`, output: { type: "configured_rule_review", message: "Certificate evidence may be required by configured policy.", requiresReviewer: true } },
    payment: { entityType: "payment_status", externalId: `payment-${tradeReference}`, output: { status: "expected", amount: 102000, currency: "USD", source: "bank evidence adapter" } },
    finance: { entityType: "finance_readiness", externalId: `finance-${tradeReference}`, output: { readiness: "incomplete", missing: ["resolved critical exceptions", "shipment evidence"] } },
    identity: { entityType: "organization_identity", externalId: `identity-${tradeReference}`, output: { verification: "pending", identifiers: ["registered legal name", "country"] } },
  } as const;
  return signal[type];
}

