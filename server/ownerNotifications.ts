export type OwnerNotificationEvent =
  | { type: "trade_submitted"; reference: string }
  | { type: "trade_decided"; reference: string; decision: "approved" | "rejected"; reason: string }
  | { type: "document_inconsistent"; reference: string; documentType: string; count: number };

export function buildOwnerNotification(event: OwnerNotificationEvent) {
  if (event.type === "trade_submitted") {
    return { title: "New ARCWAY trade submitted", content: `${event.reference} was submitted for review.` };
  }
  if (event.type === "trade_decided") {
    return { title: `ARCWAY trade ${event.decision}`, content: `${event.reference} was ${event.decision}. Rationale: ${event.reason}` };
  }
  return { title: "ARCWAY document inconsistency flagged", content: `${event.reference}: ${event.documentType} has ${event.count} flagged field inconsistency${event.count === 1 ? "" : "ies"}.` };
}

