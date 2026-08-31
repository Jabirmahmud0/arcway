import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const persistence = vi.hoisted(() => ({
  getSchedule: vi.fn(),
  registerSchedule: vi.fn(),
  appendAudit: vi.fn(),
}));
const heartbeat = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return { ...actual, getOperationalSchedule: persistence.getSchedule, registerOperationalSchedule: persistence.registerSchedule, appendAuditRecord: persistence.appendAudit };
});
vi.mock("./_core/heartbeat", () => ({ createHeartbeatJob: heartbeat.create, updateHeartbeatJob: heartbeat.update }));

import { appRouter } from "./routers";

function createReviewerContext(): TrpcContext {
  return {
    user: { id: 42, openId: "reviewer-user", email: "reviewer@example.com", name: "Reviewer User", loginMethod: "manus", role: "reviewer", organizationId: 1, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: { cookie: "app_session_id=session-token" } } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("operations.monitoring.configureOperationalSchedule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    heartbeat.create.mockResolvedValue({ taskUid: "task-created", nextExecutionAt: "2026-08-22T01:00:00.000Z" });
    heartbeat.update.mockResolvedValue({ nextExecutionAt: "2026-08-22T01:00:00.000Z" });
  });

  it("creates a Heartbeat configuration only through a reviewer and durably registers its task UID", async () => {
    persistence.getSchedule.mockResolvedValue(null);
    const caller = appRouter.createCaller(createReviewerContext());

    await expect(caller.operations.monitoring.configureOperationalSchedule({ cronExpression: "0 0 * * * *" })).resolves.toEqual({ taskUid: "task-created", nextExecutionAt: "2026-08-22T01:00:00.000Z" });

    expect(heartbeat.create).toHaveBeenCalledWith(expect.objectContaining({ name: "arcway-operational-sweep", cron: "0 0 * * * *", path: "/api/scheduled/operationalSweep" }), "session-token");
    expect(persistence.registerSchedule).toHaveBeenCalledWith({ scheduleKey: "operational-sweep", taskUid: "task-created", cronExpression: "0 0 * * * *" });
    expect(persistence.appendAudit).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 1, actorId: 42, action: "operational_schedule.configured", objectId: "task-created" }));
  });

  it("updates the existing durable task UID instead of creating a duplicate schedule", async () => {
    persistence.getSchedule.mockResolvedValue({ taskUid: "task-existing" });
    const caller = appRouter.createCaller(createReviewerContext());

    await expect(caller.operations.monitoring.configureOperationalSchedule({ cronExpression: "0 30 * * * *" })).resolves.toEqual({ taskUid: "task-existing", nextExecutionAt: "2026-08-22T01:00:00.000Z" });

    expect(heartbeat.update).toHaveBeenCalledWith("task-existing", { cron: "0 30 * * * *", enable: true }, "session-token");
    expect(heartbeat.create).not.toHaveBeenCalled();
    expect(persistence.registerSchedule).toHaveBeenCalledWith({ scheduleKey: "operational-sweep", taskUid: "task-existing", cronExpression: "0 30 * * * *" });
  });
});

describe("operations.monitoring.operationalSchedule", () => {
  it("returns persisted task UID, cron, enablement, and last execution metadata to a reviewer", async () => {
    persistence.getSchedule.mockResolvedValue({
      scheduleKey: "operational-sweep",
      taskUid: "task-visible",
      cronExpression: "0 0 * * * *",
      enabled: 1,
      lastExecutedAt: new Date("2026-08-22T00:00:00Z"),
      lastResult: { obligations: { escalated: 1 } },
      lastError: null,
    });
    const caller = appRouter.createCaller(createReviewerContext());

    await expect(caller.operations.monitoring.operationalSchedule()).resolves.toMatchObject({
      taskUid: "task-visible",
      cronExpression: "0 0 * * * *",
      enabled: 1,
      lastResult: { obligations: { escalated: 1 } },
    });
    expect(persistence.getSchedule).toHaveBeenCalledWith("operational-sweep");
  });
});
