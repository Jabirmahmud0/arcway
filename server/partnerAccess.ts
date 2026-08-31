export type ScopedGuestGrant = { tradeId: number; recipientEmail: string; status: string; expiresAt: Date; scope: unknown };
export type PartnerRequestAccess = { tradeId: number; recipientEmail: string };

export function canRespondToPartnerRequest(grant: ScopedGuestGrant | null | undefined, request: PartnerRequestAccess | null | undefined, now = new Date()) {
  const scopes = grant && Array.isArray(grant.scope) ? grant.scope.filter((value): value is string => typeof value === "string") : [];
  return Boolean(grant && request && grant.status === "active" && grant.expiresAt > now && scopes.includes("partner_request.respond") && request.tradeId === grant.tradeId && request.recipientEmail.toLowerCase() === grant.recipientEmail.toLowerCase());
}

export function canTransitionPartnerRequest(current: string, next: "viewed" | "accepted" | "completed" | "overdue" | "cancelled") {
  const allowed: Record<string, string[]> = { sent: ["viewed", "overdue", "cancelled"], viewed: ["overdue", "cancelled"], responded: ["accepted", "completed", "cancelled"], accepted: ["completed", "cancelled"], overdue: ["accepted", "completed", "cancelled"] };
  return (allowed[current] ?? []).includes(next);
}
