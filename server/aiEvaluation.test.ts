import { describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { AI_EVALUATION_CASES, latestAiEvaluation, runAiEvaluation, saveAiEvaluation, scoreExtraction } from "./aiEvaluation";
import { DOCUMENT_FIELD_NAMES } from "./documentEvidence";
import type { ExtractedTradeFields } from "./tradeDomain";

describe("measured document AI evaluation", () => {
  it("normalizes formatting, counts missing facts and penalizes invented facts", () => {
    expect(scoreExtraction({ quantity: "1,000.00", buyerName: " NORTHSTAR   FOODS ", currency: "ZZZ" }, { quantity: "1000", buyerName: "Northstar Foods", sellerName: "Seller" })).toMatchObject({ truePositives: 2, falsePositives: 1, falseNegatives: 1 });
    expect(scoreExtraction({ totalAmount: "0.00" }, { totalAmount: "0" }).mismatches).toHaveLength(0);
    expect(scoreExtraction({ quantity: "2" }, { quantity: "1" })).toMatchObject({ falsePositives: 1, falseNegatives: 1 });
  });
  it("retains provider/model metadata and reproducible measured outcomes", async () => {
    const extract = vi.fn(async (input: { buffer: Buffer }) => {
      const fixture = AI_EVALUATION_CASES.find(item => item.text === input.buffer.toString())!;
      return { ...Object.fromEntries(DOCUMENT_FIELD_NAMES.map(field => [field, ""])), ...fixture.expected, confidence: 0.9, issues: [], extractionMeta: { provider: "gemini", model: "test-model", promptVersion: "test-prompt", durationMs: 10, inputHash: "test", extractedAt: new Date().toISOString() } } as ExtractedTradeFields;
    });
    const report = await runAiEvaluation("gemini", extract);
    expect(report).toMatchObject({ completedCases: 5, passedCases: 5, precision: 1, recall: 1, f1: 1, fieldAccuracy: 1 });
    expect(report.cases.every(item => item.model === "test-model")).toBe(true);
    expect(extract.mock.calls.every(call => (call[0] as any).provider === "gemini")).toBe(true);
    const root = await mkdtemp(path.join(tmpdir(), "arcway-ai-eval-"));
    vi.stubEnv("AI_EVALUATION_DIR", root);
    try {
      await saveAiEvaluation(1, report);
      expect(await latestAiEvaluation(1)).toEqual(report);
      expect(await latestAiEvaluation(2)).toBeNull();
      await expect(latestAiEvaluation(-1)).rejects.toThrow("workspace");
    } finally { vi.unstubAllEnvs(); await rm(root, { recursive: true, force: true }); }
  });
  it("cannot pass empty-answer cases when a provider fails", async () => {
    const failed = vi.fn(async () => ({ ...Object.fromEntries(DOCUMENT_FIELD_NAMES.map(field => [field, ""])), confidence: 0, issues: ["Provider failed"] }) as ExtractedTradeFields);
    expect(await runAiEvaluation("groq", failed)).toMatchObject({ completedCases: 0, passedCases: 0, fieldAccuracy: 0, f1: 0 });
  });
});
