export type OperationalSweepCronUser = { isCron?: boolean; taskUid?: string | null };

export type OperationalSweepDependencies = {
  getScheduleByTaskUid: (taskUid: string) => Promise<{ enabled: number } | null>;
  runObligationSweep: () => Promise<unknown>;
  runSourceHealthSweep: () => Promise<unknown>;
  recordExecution: (input: { taskUid: string; result?: unknown; error?: string }) => Promise<unknown>;
  now?: () => Date;
};

export type OperationalSweepOutcome = { status: number; body: Record<string, unknown> };

/**
 * Executes the platform-owned Heartbeat sweep only for a durable, enabled task UID.
 * Orphaned and disabled jobs return 2xx so the platform does not retry stale schedules.
 */
export async function executeOperationalSweep(user: OperationalSweepCronUser, dependencies: OperationalSweepDependencies): Promise<OperationalSweepOutcome> {
  if (!user.isCron || !user.taskUid) return { status: 403, body: { error: "cron-only" } };

  const taskUid = user.taskUid;
  try {
    const schedule = await dependencies.getScheduleByTaskUid(taskUid);
    if (!schedule || schedule.enabled !== 1) return { status: 200, body: { ok: true, skipped: "orphan-or-disabled", taskUid } };

    const [obligations, sourceHealth] = await Promise.all([dependencies.runObligationSweep(), dependencies.runSourceHealthSweep()]);
    const result = { obligations, sourceHealth };
    await dependencies.recordExecution({ taskUid, result });
    return { status: 200, body: { ok: true, taskUid, ...result, timestamp: (dependencies.now?.() ?? new Date()).toISOString() } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scheduled sweep failed";
    await dependencies.recordExecution({ taskUid, error: message }).catch(() => undefined);
    return { status: 500, body: { error: message, stack: error instanceof Error ? error.stack : undefined, context: { path: "/api/scheduled/operationalSweep", taskUid }, timestamp: (dependencies.now?.() ?? new Date()).toISOString() } };
  }
}
