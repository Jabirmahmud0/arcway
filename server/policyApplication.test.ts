import { describe, expect, it } from "vitest";
import { buildPolicyObligationPreview } from "./policyApplication";

const binding = {
  id: 12,
  policyPackId: 8,
  policyName: "German LC presentation",
  policyVersionId: 22,
  policyVersion: 3,
  rules: [{ if: { payment_method: "letter_of_credit", destination: "DE" }, then: { require: "certificate of origin" } }],
  jurisdiction: "DE",
  counterpartyId: 5,
  counterpartyName: "Northstar Foods GmbH",
  productId: 9,
  relationshipRole: "buyer" as const,
  template: { id: 4, name: "Documentary presentation", actor: "Trade operations", action: "Verify presentation evidence", evidenceRequirement: "LC document pack", criticality: "critical" as const, dueOffsetHours: 48, releaseCondition: { release: "verified" } },
};

describe("buildPolicyObligationPreview", () => {
  it("matches active relationship and policy conditions while retaining the policy version provenance", () => {
    const preview = buildPolicyObligationPreview({ trade: { buyerName: "Northstar Foods GmbH", sellerName: "Meridian Export House LLC", buyerCountry: "DE", sellerCountry: "BD", originCountry: "BD", destinationCountry: "DE", incoterm: "FOB" }, paymentMethod: "letter_of_credit", productIds: [9], bindings: [binding], existingSources: [] });
    expect(preview).toHaveLength(1);
    expect(preview[0]).toMatchObject({ eligible: true, alreadyApplied: false, source: "policy_binding:12:policy_version:22", policy: { name: "German LC presentation", version: 3 } });
  });

  it("fails closed for a mismatched relationship or rule and marks the same policy version idempotently once retained", () => {
    const mismatch = buildPolicyObligationPreview({ trade: { buyerName: "Another buyer", sellerName: "Meridian Export House LLC", buyerCountry: "FR", sellerCountry: "BD", originCountry: "BD", destinationCountry: "FR", incoterm: "FOB" }, paymentMethod: "open_account", productIds: [9], bindings: [binding], existingSources: [] });
    expect(mismatch[0]).toMatchObject({ eligible: false, alreadyApplied: false });
    const applied = buildPolicyObligationPreview({ trade: { buyerName: "Northstar Foods GmbH", sellerName: "Meridian Export House LLC", buyerCountry: "DE", sellerCountry: "BD", originCountry: "BD", destinationCountry: "DE", incoterm: "FOB" }, paymentMethod: "letter_of_credit", productIds: [9], bindings: [binding], existingSources: ["policy_binding:12:policy_version:22"] });
    expect(applied[0]).toMatchObject({ eligible: false, alreadyApplied: true });
  });
});
