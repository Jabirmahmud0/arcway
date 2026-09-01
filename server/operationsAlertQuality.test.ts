import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const persistence = vi.hoisted(() => ({ listExceptions: vi.fn() }));
vi.mock("./db", async importOriginal => { const actual = await importOriginal<typeof import("./db")>(); return { ...actual, listOrganizationExceptionsForAlertQuality: persistence.listExceptions }; });
import { appRouter } from "./routers";

function reviewerContext(): TrpcContext { return { user: { id: 15, openId: "reviewer-user", email: "reviewer@example.com", name: "Reviewer User", loginMethod: "manus", role: "reviewer", organizationId: 1, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] }; }
function traderContext(): TrpcContext { return { ...reviewerContext(), user: { ...reviewerContext().user!, id: 16, role: "trader" } }; }

describe("operations.monitoring.alertQuality", () => {
  it("returns deterministic retained outcome metrics for a Reviewer", async () => {
    persistence.listExceptions.mockResolvedValue([{ id: 1, tradeId: 101, category: "documentation", title: "Quantity mismatch", severity: "critical", status: "resolved", resolutionOutcome: "corrected" }, { id: 2, tradeId: 102, category: "documentation", title: "Quantity mismatch", severity: "warning", status: "resolved", resolutionOutcome: "duplicate" }, { id: 3, tradeId: 103, category: "documentation", title: "Quantity mismatch", severity: "warning", status: "resolved", resolutionOutcome: "not_actionable" }]);
    await expect(appRouter.createCaller(reviewerContext()).operations.monitoring.alertQuality()).resolves.toMatchObject({ totalExceptions: 3, resolvedExceptions: 3, exceptionPrecision: 33.3, criticalAlertPrecision: 100, dismissalRate: 66.7, hasOutcomeData: true, repeatedDismissalPatterns: [{ category: "documentation", title: "Quantity mismatch", retainedReferences: [{ exceptionId: 2, tradeId: 102 }, { exceptionId: 3, tradeId: 103 }] }] });
    expect(persistence.listExceptions).toHaveBeenCalledWith(1);
  });

  it("rejects a Trader before reading workspace exception outcomes", async () => {
    vi.clearAllMocks();
    await expect(appRouter.createCaller(traderContext()).operations.monitoring.alertQuality()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(persistence.listExceptions).not.toHaveBeenCalled();
  });
});
