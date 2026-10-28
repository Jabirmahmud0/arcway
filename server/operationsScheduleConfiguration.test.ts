import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
const persistence = vi.hoisted(() => ({ getSchedule: vi.fn(), configure: vi.fn(), audit: vi.fn() }));
vi.mock("./db", async original => ({ ...await original<typeof import("./db")>(), getOperationalSchedule: persistence.getSchedule, configureWorkspaceSchedule: persistence.configure, appendAuditRecord: persistence.audit }));
import { appRouter } from "./routers";
function context(): TrpcContext { return { user: { id: 42, openId: "clerk-reviewer", role: "reviewer", organizationId: 7, loginMethod: "clerk", name: "Reviewer", email: null, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] }; }
beforeEach(() => { vi.clearAllMocks(); persistence.configure.mockResolvedValue({ taskUid: "local-schedule", nextExecutionAt: "2026-10-29T01:00:00.000Z" }); });
describe("native workspace schedule configuration", () => {
  it("allows a Clerk reviewer to configure scheduling without a legacy cookie", async () => {
    const result = await appRouter.createCaller(context()).operations.monitoring.configureOperationalSchedule({ cronExpression: "0 */15 * * * *" });
    expect(result.taskUid).toBe("local-schedule");
    expect(persistence.configure).toHaveBeenCalledWith(7, "0 */15 * * * *", true);
    expect(persistence.audit).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 7, actorId: 42, action: "operational_schedule.configured" }));
  });
  it("can pause an existing schedule", async () => {
    await appRouter.createCaller(context()).operations.monitoring.configureOperationalSchedule({ cronExpression: "0 0 * * * *", enabled: false });
    expect(persistence.configure).toHaveBeenCalledWith(7, "0 0 * * * *", false);
  });
  it("reads only this reviewer's workspace schedule", async () => {
    persistence.getSchedule.mockResolvedValue({ taskUid: "local-schedule", enabled: 1 });
    expect(await appRouter.createCaller(context()).operations.monitoring.operationalSchedule()).toMatchObject({ enabled: 1 });
    expect(persistence.getSchedule).toHaveBeenCalledWith("workspace-sweep-7");
  });
  it("rejects out-of-range cron expressions before persistence", async () => {
    await expect(appRouter.createCaller(context()).operations.monitoring.configureOperationalSchedule({ cronExpression: "99 99 * * * *" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(persistence.configure).not.toHaveBeenCalled();
  });
});
