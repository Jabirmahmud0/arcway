import { describe, expect, it } from "vitest";
import { runDeterministicEvaluation } from "./deterministicEvaluation";

describe("runDeterministicEvaluation", () => {
  it("reports expected outcomes for bounded deterministic linking and commitment cases", () => {
    const result = runDeterministicEvaluation();
    expect(result).toMatchObject({ suite: "arcway-deterministic-evaluation-v1", total: 4, passed: 4, failed: 0, passRate: 100 });
    expect(result.cases.map(item => item.id)).toEqual(["linking_shipment_reference", "linking_amount_only", "commitment_relative_date", "commitment_unrelated_text"]);
    expect(result.boundary).toContain("not a production model evaluation");
  });

  it("exposes one stable, versioned configuration manifest without calling it a model benchmark", () => {
    const first = runDeterministicEvaluation();
    const second = runDeterministicEvaluation();
    expect(first.manifest).toMatchObject({
      id: "arcway-deterministic-evaluation-manifest-v1",
      suite: "arcway-deterministic-evaluation-v1",
      caseIds: ["linking_shipment_reference", "linking_amount_only", "commitment_relative_date", "commitment_unrelated_text"],
    });
    expect(first.manifest.fingerprint).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(first.manifest.fingerprint).toBe(second.manifest.fingerprint);
    expect(first.manifest.components).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "trade_linking", implementation: "source-matching-v2" }),
      expect.objectContaining({ id: "commitment_extraction", implementation: "commitment-extractor-v1" }),
    ]));
    expect(first.manifest.boundary).toContain("not a customer-data corpus");
  });
});
