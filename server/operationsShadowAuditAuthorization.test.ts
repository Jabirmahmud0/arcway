import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

function context(role: "trader" | "reviewer"): TrpcContext { return { user: { id: 14, openId: `${role}-user`, email: `${role}@example.com`, name: `${role} User`, loginMethod: "manus", role, organizationId: 1, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] }; }

describe("operations.shadowAudit.historicalReview", () => {
  it("denies a Trader before the workspace-wide historical aggregate is read", async () => {
    await expect(appRouter.createCaller(context("trader")).operations.shadowAudit.historicalReview({ from: new Date("2026-08-01"), to: new Date("2026-08-31") })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects a review window longer than 90 days before reading historical records", async () => {
    await expect(appRouter.createCaller(context("reviewer")).operations.shadowAudit.historicalReview({ from: new Date("2026-01-01"), to: new Date("2026-05-01") })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
