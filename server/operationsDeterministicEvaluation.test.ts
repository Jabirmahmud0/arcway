import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

function reviewerContext(): TrpcContext { return { user: { id: 21, openId: "reviewer-eval", email: "reviewer@example.com", name: "Reviewer", loginMethod: "manus", role: "reviewer", organizationId: 1, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] }; }
function traderContext(): TrpcContext { return { ...reviewerContext(), user: { ...reviewerContext().user!, id: 22, role: "trader" } }; }

describe("operations.monitoring.deterministicEvaluation", () => {
  it("returns the bounded deterministic evaluation summary only to a Reviewer", async () => {
    await expect(appRouter.createCaller(reviewerContext()).operations.monitoring.deterministicEvaluation()).resolves.toMatchObject({ suite: "arcway-deterministic-evaluation-v1", passed: 4, failed: 0, passRate: 100, manifest: { id: "arcway-deterministic-evaluation-manifest-v1", suite: "arcway-deterministic-evaluation-v1" } });
  });
  it("rejects a Trader", async () => {
    await expect(appRouter.createCaller(traderContext()).operations.monitoring.deterministicEvaluation()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
