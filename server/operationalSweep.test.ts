import { describe, expect, it, vi } from "vitest";
import { executeOperationalSweep } from "./operationalSweep";

const now = () => new Date("2026-08-22T00:00:00.000Z");

function dependencies(overrides: Partial<Parameters<typeof executeOperationalSweep>[1]> = {}) {
  return {
    getScheduleByTaskUid: vi.fn().mockResolvedValue({ enabled: 1 }),
    runObligationSweep: vi.fn().mockResolvedValue({ evaluated: 2, escalated: 1 }),
    runSourceHealthSweep: vi.fn().mockResolvedValue({ evaluated: 3, alerted: 1 }),
    recordExecution: vi.fn().mockResolvedValue(undefined),
    now,
    ...overrides,
  };
}

describe("ARCWAY scheduled operational sweep", () => {
  it("rejects a request that is not authenticated as a cron identity", async () => {
    const deps = dependencies();
    await expect(executeOperationalSweep({}, deps)).resolves.toEqual({ status: 403, body: { error: "cron-only" } });
    expect(deps.getScheduleByTaskUid).not.toHaveBeenCalled();
  });

  it("safely skips orphaned and disabled task UIDs without invoking sweep work", async () => {
    const orphaned = dependencies({ getScheduleByTaskUid: vi.fn().mockResolvedValue(null) });
    const disabled = dependencies({ getScheduleByTaskUid: vi.fn().mockResolvedValue({ enabled: 0 }) });

    await expect(executeOperationalSweep({ isCron: true, taskUid: "task-orphan" }, orphaned)).resolves.toMatchObject({ status: 200, body: { skipped: "orphan-or-disabled" } });
    await expect(executeOperationalSweep({ isCron: true, taskUid: "task-disabled" }, disabled)).resolves.toMatchObject({ status: 200, body: { skipped: "orphan-or-disabled" } });
    expect(orphaned.runObligationSweep).not.toHaveBeenCalled();
    expect(disabled.runSourceHealthSweep).not.toHaveBeenCalled();
  });

  it("records a successful enabled sweep with both operational result sets", async () => {
    const deps = dependencies();
    const outcome = await executeOperationalSweep({ isCron: true, taskUid: "task-live" }, deps);

    expect(outcome).toMatchObject({ status: 200, body: { ok: true, taskUid: "task-live", obligations: { escalated: 1 }, sourceHealth: { alerted: 1 } } });
    expect(deps.recordExecution).toHaveBeenCalledWith({ taskUid: "task-live", result: { obligations: { evaluated: 2, escalated: 1 }, sourceHealth: { evaluated: 3, alerted: 1 } } });
  });

  it("retains an execution error for an enabled task so the platform can investigate and retry", async () => {
    const deps = dependencies({ runSourceHealthSweep: vi.fn().mockRejectedValue(new Error("Provider registry unavailable")) });
    const outcome = await executeOperationalSweep({ isCron: true, taskUid: "task-failed" }, deps);

    expect(outcome).toMatchObject({ status: 500, body: { error: "Provider registry unavailable", stack: expect.stringContaining("Provider registry unavailable"), context: { taskUid: "task-failed" } } });
    expect(deps.recordExecution).toHaveBeenCalledWith({ taskUid: "task-failed", error: "Provider registry unavailable" });
  });
});
