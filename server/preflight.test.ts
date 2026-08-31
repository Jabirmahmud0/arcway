import { describe, expect, it } from "vitest";
import { evaluatePreflight } from "./preflight";

const trade = { commercialState: "confirmed", assuranceState: "submitted" } as any;

describe("ARCWAY Preflight", () => {
  it("explains a blocked release with missing shipment evidence", () => {
    const result = evaluatePreflight({ trade, documents: [], exceptions: [], obligations: [] });
    expect(result.summary).toBe("blocked");
    expect(result.checks.find(check => check.id === "ship-evidence")?.state).toBe("blocked");
  });

  it("moves release gates toward ready after all evidence is verified and no exceptions remain", () => {
    const documents = ["commercial invoice", "packing list", "bill of lading", "certificate of origin", "inspection certificate", "LC/payment terms"].map(documentType => ({ documentType, status: "verified" as const }));
    const result = evaluatePreflight({ trade: { ...trade, assuranceState: "approved" }, documents: documents as any, exceptions: [], obligations: [] });
    expect(result.summary).toBe("ready");
    expect(result.evidenceReady).toBe(6);
  });

  it("blocks the production gate when an explicit release dependency remains unfulfilled", () => {
    const documents = ["commercial invoice", "packing list", "bill of lading", "certificate of origin", "inspection certificate", "LC/payment terms"].map(documentType => ({ documentType, status: "verified" as const }));
    const result = evaluatePreflight({
      trade: { ...trade, assuranceState: "approved" },
      documents: documents as any,
      exceptions: [],
      obligations: [
        { id: 101, status: "open" as const, action: "Present certificate", deadline: null, criticality: "information" as const },
        { id: 102, status: "open" as const, action: "Authorize release", deadline: null, criticality: "information" as const },
      ],
      obligationDependencies: [{ obligationId: 102, dependsOnObligationId: 101, dependencyType: "blocks_release" }],
    });
    expect(result.summary).toBe("blocked");
    expect(result.unresolvedReleaseDependencies).toBe(1);
    expect(result.checks.find(check => check.id === "production-obligations")?.state).toBe("blocked");
  });
});
