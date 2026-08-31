import { describe, expect, it } from "vitest";
import { buildOperationalMessageDraft } from "./messageDrafting";

describe("buildOperationalMessageDraft", () => {
  it("creates a factual supplier draft that is explicitly copy-only and human-reviewed", () => {
    const draft = buildOperationalMessageDraft({ reference: "AR-2026-0042", buyerName: "Northstar Foods", sellerName: "Meridian Export", expectedShipmentDate: new Date("2026-10-12T00:00:00Z"), kind: "ask_supplier", focus: "Please confirm the revised cargo-ready date and packed quantity." });
    expect(draft).toMatchObject({ recipientRole: "supplier", delivery: "copy_only", reviewRequired: true });
    expect(draft.subject).toContain("AR-2026-0042");
    expect(draft.body).toContain("2026-10-12");
    expect(draft.body).toContain("has not been sent");
  });
});
