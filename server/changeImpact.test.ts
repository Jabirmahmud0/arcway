import { describe, expect, it } from "vitest";
import { buildChangeImpact } from "./changeImpact";

const workspace = {
  documents: [
    { documentType: "commercial invoice", status: "uploaded" },
    { documentType: "packing list", status: "uploaded" },
    { documentType: "shipping instruction", status: "under review" },
  ],
  obligations: [{ actor: "Forwarder", action: "Confirm cargo-ready booking cut-off", status: "open", deadline: new Date("2026-09-17T16:00:00Z") }],
  shipments: [{ bookingReference: "BK-291", etd: new Date("2026-09-20T00:00:00Z"), eta: new Date("2026-10-18T00:00:00Z") }],
  paymentTerms: [{ method: "letter_of_credit" }],
};

describe("buildChangeImpact", () => {
  it("explains the document and release consequences of a physical-value resolution", () => {
    const result = buildChangeImpact({ fieldName: "quantity", selectedValue: "23800", workspace });

    expect(result.summary).toContain("artifact");
    expect(result.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ category: "document", target: "commercial invoice", severity: "blocker" }),
      expect.objectContaining({ category: "document", target: "packing list", severity: "blocker" }),
      expect.objectContaining({ category: "release", target: "Ready to ship", severity: "blocker" }),
    ]));
  });

  it("explains shipment timing, open obligations, and booking-gate consequences before a date decision", () => {
    const result = buildChangeImpact({ fieldName: "cargo ready date", selectedValue: "2026-09-18", workspace });

    expect(result.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ category: "shipment", target: "booking and shipment milestones", severity: "blocker" }),
      expect.objectContaining({ category: "obligation", target: "Forwarder: Confirm cargo-ready booking cut-off" }),
      expect.objectContaining({ category: "release", target: "Ready for booking", severity: "blocker" }),
    ]));
  });
});
