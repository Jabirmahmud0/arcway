import { describe, expect, it } from "vitest";
import { calculateTrustScore, DOCUMENT_STATUSES, findCrossDocumentInconsistencies } from "./tradeDomain";

describe("document status vocabulary", () => {
  it("uses the five required document status labels exactly", () => {
    expect(DOCUMENT_STATUSES).toEqual(["pending", "uploaded", "under review", "verified", "rejected"]);
  });
});

describe("ARCWAY trust score", () => {
  it("rewards verified evidence and KYC while exposing a ready band", () => {
    const documents = Array.from({ length: 6 }, () => ({ status: "verified" as const, inconsistencies: [] }));
    expect(calculateTrustScore({ documents, partyKycState: "verified" })).toEqual({ score: 100, band: "ready", components: { evidence: 50, partyKyc: 20, consistency: 30 } });
  });

  it("penalizes missing evidence and identified inconsistencies", () => {
    const result = calculateTrustScore({ documents: [{ status: "uploaded", inconsistencies: ["quantity conflict"] }], partyKycState: "pending" });
    expect(result.score).toBe(34);
    expect(result.band).toBe("critical");
  });
});

describe("cross-document comparison", () => {
  it("flags a conflicting Incoterm without inferring any missing values", () => {
    const fields = { invoiceNumber: "", issueDate: "", currency: "USD", totalAmount: "", sellerName: "ARC Trading", buyerName: "Northstar", quantity: "24000", unit: "kg", incoterm: "CIF", originCountry: "CN", destinationCountry: "AE", transportReference: "", confidence: 0.9, issues: [] };
    const prior = [{ ...fields, incoterm: "FOB" }];
    expect(findCrossDocumentInconsistencies(fields, prior)).toContain("incoterm conflicts with another uploaded document.");
  });
});
