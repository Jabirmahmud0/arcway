import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
const evaluation = vi.hoisted(() => ({ latest: vi.fn(), run: vi.fn(), save: vi.fn(), audit: vi.fn(), providers: vi.fn() }));
vi.mock("./aiEvaluation", () => ({ latestAiEvaluation: evaluation.latest, runAiEvaluation: evaluation.run, saveAiEvaluation: evaluation.save }));
vi.mock("./_core/aiProviders", () => ({ getDocumentProviders: evaluation.providers, getAIProviderConfig: () => ({ model: "test-model" }) }));
vi.mock("./db", async original => ({ ...await original<typeof import("./db")>(), appendAuditRecord: evaluation.audit }));
import { appRouter } from "./routers";
const context = (organizationId: number, role: "trader" | "reviewer" = "reviewer"): TrpcContext => ({ user: { id: organizationId, openId: `clerk-${organizationId}`, role, organizationId, loginMethod: "clerk", name: "Reviewer", email: null, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] });
beforeEach(() => { vi.clearAllMocks(); evaluation.providers.mockReturnValue(["gemini"]); evaluation.latest.mockResolvedValue(null); evaluation.run.mockResolvedValue({ id: "report-id", suite: "test-suite", completedCases: 5, f1: 1 }); });
describe("Reviewer-controlled AI benchmark", () => {
  it("does not expose results or invoke providers for a Trader", async () => {
    const caller = appRouter.createCaller(context(10, "trader"));
    await expect(caller.operations.monitoring.aiEvaluation()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.operations.monitoring.runAiEvaluation({ provider: "gemini" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(evaluation.latest).not.toHaveBeenCalled(); expect(evaluation.run).not.toHaveBeenCalled();
  });
  it("loads only the authenticated workspace and never returns API keys", async () => {
    const result = await appRouter.createCaller(context(11)).operations.monitoring.aiEvaluation();
    expect(evaluation.latest).toHaveBeenCalledWith(11);
    expect(result.providers).toEqual([{ provider: "gemini", model: "test-model" }]);
  });
  it("saves and audits measured results in the same workspace and limits repeated calls", async () => {
    const caller = appRouter.createCaller(context(12));
    await caller.operations.monitoring.runAiEvaluation({ provider: "gemini" });
    expect(evaluation.save).toHaveBeenCalledWith(12, expect.objectContaining({ id: "report-id" }));
    expect(evaluation.audit).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 12, actorId: 12, action: "ai.evaluated" }));
    await expect(caller.operations.monitoring.runAiEvaluation({ provider: "gemini" })).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(evaluation.run).toHaveBeenCalledOnce();
  });
  it("rejects an unconfigured provider before making any API request", async () => {
    await expect(appRouter.createCaller(context(13)).operations.monitoring.runAiEvaluation({ provider: "groq" })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(evaluation.run).not.toHaveBeenCalled();
  });
});
