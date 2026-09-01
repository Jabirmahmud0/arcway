import { describe, expect, it } from "vitest";
import { buildAssuranceExplanation } from "./assuranceExplanation";

describe("buildAssuranceExplanation", () => {
  it("explains retained rejection, critical obligation, conflict, and latest blocked preflight without inferring new facts", () => {
    const result = buildAssuranceExplanation({ now: new Date("2026-10-01T00:00:00Z"), documents: [{ id: 1, documentType: "packing list", status: "rejected" }], exceptions: [], obligations: [{ id: 2, action: "Provide origin certificate", criticality: "critical", status: "open", deadline: null }], fields: [{ id: 3, fieldName: "quantity", authority: "conflicting" }], preflightRuns: [{ id: 4, gate: "shipment readiness", status: "blocked", createdAt: new Date("2026-10-01T01:00:00Z") }] });
    expect(result).toMatchObject({ status: "blocked" });
    expect(result.reasons.map(reason => reason.kind)).toEqual(["document", "obligation", "evidence_conflict", "preflight"]);
    expect(result.reasons.find(reason => reason.kind === "obligation")?.detail).toContain("no retained deadline");
  });

  it("does not represent a clean retained set as a release decision", () => {
    const result = buildAssuranceExplanation({ now: new Date(), documents: [{ id: 1, documentType: "invoice", status: "verified" }], exceptions: [], obligations: [{ id: 1, action: "Check invoice", criticality: "information", status: "fulfilled", deadline: null }], fields: [{ id: 1, fieldName: "quantity", authority: "canonical" }], preflightRuns: [] });
    expect(result).toMatchObject({ status: "no_retained_blocker" });
    expect(result.summary).toContain("not a release decision");
  });

  it("states that retained evidence is insufficient when no assurance context exists", () => {
    const result = buildAssuranceExplanation({ now: new Date(), documents: [], exceptions: [], obligations: [], fields: [], preflightRuns: [] });
    expect(result).toMatchObject({ status: "insufficient_evidence", reasons: [] });
    expect(result.summary).toContain("don't have enough retained assurance evidence");
    expect(result.summary).toContain("not a release decision");
  });
});
