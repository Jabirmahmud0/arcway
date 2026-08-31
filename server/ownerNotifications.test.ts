import { describe, expect, it } from "vitest";
import { buildOwnerNotification } from "./ownerNotifications";

describe("owner notification triggers", () => {
  it("formats the new trade submission alert", () => {
    expect(buildOwnerNotification({ type: "trade_submitted", reference: "AR-2026-7QZK" })).toEqual({ title: "New ARCWAY trade submitted", content: "AR-2026-7QZK was submitted for review." });
  });

  it("formats approval and rejection alerts with reviewer rationale", () => {
    expect(buildOwnerNotification({ type: "trade_decided", reference: "AR-2026-7QZK", decision: "approved", reason: "Evidence reconciled" }).content).toContain("Evidence reconciled");
  });

  it("formats the document inconsistency alert", () => {
    expect(buildOwnerNotification({ type: "document_inconsistent", reference: "AR-2026-7QZK", documentType: "packing list", count: 2 }).title).toBe("ARCWAY document inconsistency flagged");
  });
});

