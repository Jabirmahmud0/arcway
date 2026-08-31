export type AlertPolicyInput = { enabled?: number; threshold?: number } | undefined;

export function shouldEscalateSourceHealth(input: { policy: AlertPolicyInput; status: string; lastSyncedAt: Date | null; now: Date }) {
  if (input.policy?.enabled === 0) return false;
  if (input.status === "degraded") return true;
  const thresholdHours = input.policy?.threshold ?? 24;
  const staleAt = new Date(input.now.getTime() - thresholdHours * 60 * 60 * 1000);
  return input.lastSyncedAt === null || input.lastSyncedAt < staleAt;
}
