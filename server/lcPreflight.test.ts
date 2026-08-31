import { describe, expect, it } from "vitest";
import { evaluateLcPreflight } from "./lcPreflight";

const baseWorkspace = {
  paymentTerms: [{ method: "letter_of_credit", lcReference: "LC-8841", presentationDays: 21, latestShipmentDate: new Date("2026-10-18T00:00:00Z"), specialClauses: ["insurance certificate"] }],
  documents: [
    { documentType: "commercial invoice", status: "verified" },
    { documentType: "packing list", status: "uploaded" },
  ],
  fields: [{ fieldName: "quantity", authority: "conflicting" }],
};

describe("evaluateLcPreflight", () => {
  it("reports documentary verification and retained field conflict as actionable presentation blockers", () => {
    const result = evaluateLcPreflight(baseWorkspace, new Date("2026-09-01T00:00:00Z"));

    expect(result.applicable).toBe(true);
    expect(result.status).toBe("blocked");
    expect(result.documentsVerified).toBe(1);
    expect(result.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "document_packing list", status: "ready_with_warnings" }),
      expect.objectContaining({ key: "document_insurance certificate", status: "blocked" }),
      expect.objectContaining({ key: "cross_document_conflicts", status: "blocked" }),
    ]));
  });

  it("clearly marks the specialist view as insufficient when no LC settlement term is retained", () => {
    const result = evaluateLcPreflight({ ...baseWorkspace, paymentTerms: [{ ...baseWorkspace.paymentTerms[0], method: "open_account" }] });
    expect(result).toMatchObject({ applicable: false, status: "insufficient_data", documentsRequired: 0 });
  });
});
