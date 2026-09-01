import { describe, expect, it } from "vitest";
import { assertDocumentTransition } from "./documentWorkflow";
import { canTransitionPartnerRequest } from "./partnerAccess";
import { evaluatePreflight } from "./preflight";
import { shouldEscalateSourceHealth } from "./alertPolicy";

describe("ARCWAY end-to-end assurance scenario", () => {
  const requiredDocuments = ["commercial invoice", "packing list", "bill of lading", "certificate of origin", "inspection certificate", "LC/payment terms"];

  it("moves a reconstructed trade from intake through verification to release while retaining operational controls", () => {
    expect(() => assertDocumentTransition("pending", "uploaded")).not.toThrow();
    expect(() => assertDocumentTransition("uploaded", "under review")).not.toThrow();
    expect(() => assertDocumentTransition("under review", "verified")).not.toThrow();
    const documents = requiredDocuments.map(documentType => ({ documentType, status: "verified" as const }));
    const blocked = evaluatePreflight({ trade: { commercialState: "confirmed", assuranceState: "approved" } as any, documents: documents as any, exceptions: [], obligations: [{ id: 1, status: "open", action: "Carrier booking confirmation", deadline: null, criticality: "warning" } as any, { id: 2, status: "open", action: "Release authorization", deadline: null, criticality: "information" } as any], obligationDependencies: [{ obligationId: 2, dependsOnObligationId: 1, dependencyType: "blocks_release" }] });
    expect(blocked.summary).toBe("blocked");
    const ready = evaluatePreflight({ trade: { commercialState: "confirmed", assuranceState: "approved" } as any, documents: documents as any, exceptions: [], obligations: [{ id: 1, status: "fulfilled", action: "Carrier booking confirmation", deadline: null, criticality: "warning" } as any, { id: 2, status: "fulfilled", action: "Release authorization", deadline: null, criticality: "information" } as any], obligationDependencies: [{ obligationId: 2, dependsOnObligationId: 1, dependencyType: "blocks_release" }] });
    expect(ready.summary).toBe("ready");
  });

  it("keeps partner and source-health controls constrained during the trade lifecycle", () => {
    expect(canTransitionPartnerRequest("responded", "accepted")).toBe(true);
    expect(canTransitionPartnerRequest("sent", "completed")).toBe(false);
    expect(shouldEscalateSourceHealth({ policy: { enabled: 1, threshold: 24 }, status: "connected", lastSyncedAt: new Date("2030-01-01T00:00:00Z"), now: new Date("2030-01-02T12:00:00Z") })).toBe(true);
    expect(shouldEscalateSourceHealth({ policy: { enabled: 0, threshold: 1 }, status: "degraded", lastSyncedAt: null, now: new Date("2030-01-02T12:00:00Z") })).toBe(false);
  });
});
