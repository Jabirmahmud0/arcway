import { describe, expect, it } from "vitest";
import { extractCommitmentCandidates } from "./commitmentExtraction";

describe("extractCommitmentCandidates", () => {
  it("extracts a structured cargo-ready candidate from retained email text while keeping a relative date as review-required context", () => {
    const candidates = extractCommitmentCandidates({ subject: "Revised delivery", body: "We can deliver the revised 20,000 units by Friday." });
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({ commitment: "delivery", quantity: "20000", unit: "units", date: null, dateExpression: "Friday", actor: "source counterparty", method: "deterministic_pattern", engineVersion: "commitment-extractor-v1", reviewRequired: true });
    expect(candidates[0].confidence).toBeGreaterThan(0.8);
  });

  it("keeps exact retained dates when present and ignores unrelated text", () => {
    const candidates = extractCommitmentCandidates({ message: "Cargo ready 24000 kg by 2026-10-12. Thank you." });
    expect(candidates[0]).toMatchObject({ commitment: "cargo_ready", quantity: "24000", unit: "kg", date: "2026-10-12" });
    expect(extractCommitmentCandidates({ message: "The invoice was received." })).toEqual([]);
  });
});
