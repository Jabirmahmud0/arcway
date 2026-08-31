import { describe, expect, it } from "vitest";
import { buildTradeCriticalPath } from "./criticalPath";

describe("buildTradeCriticalPath", () => {
  it("orders retained overdue obligations, booking cut-offs, and planned shipment while excluding fulfilled work", () => {
    const path = buildTradeCriticalPath({ now: new Date("2026-09-10T12:00:00Z"), expectedShipmentDate: new Date("2026-09-15T00:00:00Z"), obligations: [
      { id: 1, actor: "Exporter", action: "Provide certificate", status: "fulfilled", criticality: "warning", deadline: new Date("2026-09-09T00:00:00Z") },
      { id: 2, actor: "Factory", action: "Confirm cargo-ready", status: "open", criticality: "critical", deadline: new Date("2026-09-09T16:00:00Z") },
    ], shipments: [{ bookingReference: "BK-291", etd: new Date("2026-09-15T00:00:00Z"), cutoffs: { shippingInstruction: "2026-09-11T16:00:00Z", cargo: "2026-09-12T12:00:00Z" } }] });
    expect(path.map(item => item.key)).toEqual(["obligation-2", "shipment-BK-291-shippingInstruction", "shipment-BK-291-cargo", "planned-shipment"]);
    expect(path[0]).toMatchObject({ status: "overdue", kind: "obligation" });
    expect(path[1]).toMatchObject({ status: "at_risk", kind: "shipment_cutoff" });
    expect(path.some(item => item.key === "obligation-1")).toBe(false);
  });

  it("includes an undated unresolved release prerequisite without claiming that the planned shipment date is its obligation deadline", () => {
    const path = buildTradeCriticalPath({ now: new Date("2026-09-10T12:00:00Z"), expectedShipmentDate: new Date("2026-09-15T00:00:00Z"), obligations: [
      { id: 10, actor: "Exporter", action: "Provide origin certificate", status: "open", criticality: "warning", deadline: null },
      { id: 11, actor: "Reviewer", action: "Authorize release", status: "open", criticality: "critical", deadline: null },
    ], obligationDependencies: [{ obligationId: 11, dependsOnObligationId: 10, dependencyType: "blocks_release" }], shipments: [] });
    const prerequisite = path.find(item => item.key === "obligation-10");
    expect(prerequisite).toMatchObject({ title: "Provide origin certificate", dueAt: new Date("2026-09-15T00:00:00Z") });
    expect(prerequisite?.detail).toContain("release prerequisite for Authorize release");
    expect(prerequisite?.detail).toContain("no independent obligation deadline retained");
    expect(prerequisite?.action).toContain("Record an evidence-backed obligation deadline");
    expect(path.some(item => item.key === "obligation-11")).toBe(false);
  });
});
