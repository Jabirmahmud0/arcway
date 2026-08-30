import { createHash } from "node:crypto";
import { extractCommitmentCandidates } from "./commitmentExtraction";
import { rankTradeTwinCandidates } from "./sourceMatching";

type EvaluationCase = { id: string; component: "trade_linking" | "commitment_extraction"; passed: boolean; expectation: string };

const MANIFEST_PAYLOAD = {
  id: "arcway-deterministic-evaluation-manifest-v1",
  suite: "arcway-deterministic-evaluation-v1",
  caseIds: ["linking_shipment_reference", "linking_amount_only", "commitment_relative_date", "commitment_unrelated_text"],
  components: [
    { id: "trade_linking", implementation: "source-matching-v2", coverage: "Shipment-reference candidate and amount-only no-candidate safeguards." },
    { id: "commitment_extraction", implementation: "commitment-extractor-v1", coverage: "Relative-date review preservation and unrelated-text no-candidate safeguards." },
  ],
  boundary: "The manifest records code-level expected-outcome configuration only; it is not a customer-data corpus, calibrated benchmark, or production model evaluation.",
} as const;

const manifestFingerprint = `sha256:${createHash("sha256").update(JSON.stringify(MANIFEST_PAYLOAD)).digest("hex")}`;
const EVALUATION_MANIFEST = Object.freeze({
  ...MANIFEST_PAYLOAD,
  caseIds: Object.freeze([...MANIFEST_PAYLOAD.caseIds]),
  components: Object.freeze(MANIFEST_PAYLOAD.components.map(component => Object.freeze({ ...component }))),
  fingerprint: manifestFingerprint,
});

const trades = [{ id: 1, reference: "AR-EVAL-001", buyerName: "Northstar Foods GmbH", sellerName: "Meridian Export House LLC", commodity: "Arabica coffee", expectedShipmentDate: new Date("2026-09-03T00:00:00Z"), totalValue: "102000", currency: "USD", shipmentReferences: ["BK-EVAL-4402"] }];

export function runDeterministicEvaluation() {
  const linkingMatch = rankTradeTwinCandidates({ notice: { bookingReference: "BK-EVAL-4402", value: "USD 102,000" } }, trades);
  const amountOnly = rankTradeTwinCandidates({ value: "USD 102,000" }, trades);
  const relativeCommitment = extractCommitmentCandidates({ message: "We can deliver the revised 20,000 units by Friday." });
  const unrelatedCommitment = extractCommitmentCandidates({ message: "The invoice was received. Thank you." });
  const cases: EvaluationCase[] = [
    { id: "linking_shipment_reference", component: "trade_linking", passed: linkingMatch.length === 1 && linkingMatch[0].tradeId === 1 && linkingMatch[0].signals.some(signal => signal.field === "shipment reference"), expectation: "Retained shipment reference yields the expected human-review candidate." },
    { id: "linking_amount_only", component: "trade_linking", passed: amountOnly.length === 0, expectation: "Amount-only input yields no Trade Twin candidate." },
    { id: "commitment_relative_date", component: "commitment_extraction", passed: relativeCommitment.length === 1 && relativeCommitment[0].commitment === "delivery" && relativeCommitment[0].date === null && relativeCommitment[0].dateExpression === "Friday" && relativeCommitment[0].reviewRequired, expectation: "Relative-date delivery language remains review-required and is not converted to a calendar date." },
    { id: "commitment_unrelated_text", component: "commitment_extraction", passed: unrelatedCommitment.length === 0, expectation: "Unrelated retained text yields no commitment candidate." },
  ];
  const passed = cases.filter(item => item.passed).length;
  return {
    suite: "arcway-deterministic-evaluation-v1" as const,
    executedAt: new Date().toISOString(),
    total: cases.length,
    passed,
    failed: cases.length - passed,
    passRate: Number((passed / cases.length * 100).toFixed(1)),
    cases,
    manifest: EVALUATION_MANIFEST,
    boundary: "This bounded regression harness covers deterministic trade linking and commitment extraction only. It is not a production model evaluation, does not cover document-field or line-item accuracy, and invokes no external model." as const,
  };
}
