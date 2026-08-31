import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const persistence = vi.hoisted(() => ({ listMasters: vi.fn(), getReceipt: vi.fn(), createVersion: vi.fn(), appendAudit: vi.fn() }));
vi.mock("./db", async importOriginal => { const actual = await importOriginal<typeof import("./db")>(); return { ...actual, listOrganizationMasters: persistence.listMasters, getSourceIngestionReceiptById: persistence.getReceipt, createCounterpartyVersion: persistence.createVersion, appendAuditRecord: persistence.appendAudit }; });
import { appRouter } from "./routers";

function reviewerContext(): TrpcContext { return { user: { id: 15, openId: "reviewer-user", email: "reviewer@example.com", name: "Reviewer User", loginMethod: "manus", role: "reviewer", organizationId: 1, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] }; }

describe("operations.masters.confirmEntityAlias", () => {
  it("creates a versioned trading alias and audit record without modifying or merging a second master", async () => {
    persistence.listMasters.mockResolvedValue({ counterparties: [{ id: 7, organizationId: 1, legalName: "Nord Haus GmbH", tradingNames: ["NORDHAUS"], validTo: null }], products: [] });
    persistence.createVersion.mockResolvedValue(91);
    await expect(appRouter.createCaller(reviewerContext()).operations.masters.confirmEntityAlias({ sourceId: 7, alias: "NordHaus Germany", rationale: "Reviewer confirmed this retained same-country trading alias." })).resolves.toEqual({ id: 91 });
    expect(persistence.createVersion).toHaveBeenCalledWith({ organizationId: 1, sourceId: 7, tradingNames: ["NORDHAUS", "NordHaus Germany"] });
    expect(persistence.appendAudit).toHaveBeenCalledWith(expect.objectContaining({ action: "master.counterparty_alias_confirmed", objectId: "91", afterState: expect.objectContaining({ alias: "NordHaus Germany", successorId: 91 }) }));
  });

  it("retains source receipt provenance when a Reviewer confirms a bounded receipt-derived alias without merging masters", async () => {
    persistence.listMasters.mockResolvedValue({ counterparties: [{ id: 7, organizationId: 1, legalName: "Meridian Export House LLC", countryCode: "US", tradingNames: [], validTo: null }], products: [] }); persistence.getReceipt.mockResolvedValue({ id: 12, organizationId: 1, fileName: "supplier-email.eml", payloadHash: "hash-12", rawPayload: { supplier: "Meridian Export" } }); persistence.createVersion.mockResolvedValue(92);
    await expect(appRouter.createCaller(reviewerContext()).operations.masters.confirmEntityAlias({ sourceId: 7, alias: "Meridian Export", sourceReceiptId: 12, rationale: "Reviewer confirmed the bounded retained supplier alias with receipt provenance." })).resolves.toEqual({ id: 92 });
    expect(persistence.createVersion).toHaveBeenCalledWith({ organizationId: 1, sourceId: 7, tradingNames: ["Meridian Export"] });
    expect(persistence.appendAudit).toHaveBeenCalledWith(expect.objectContaining({ afterState: expect.objectContaining({ sourceReceipt: { id: 12, fileName: "supplier-email.eml", payloadHash: "hash-12" }, noMasterMerge: true }) }));
  });

  it("rejects a receipt from another workspace before creating a versioned alias successor", async () => {
    persistence.listMasters.mockResolvedValue({ counterparties: [{ id: 7, organizationId: 1, legalName: "Meridian Export House LLC", countryCode: "US", tradingNames: [], validTo: null }], products: [] }); persistence.getReceipt.mockResolvedValue({ id: 13, organizationId: 2, fileName: "other-workspace.eml", payloadHash: "hash-13", rawPayload: { supplier: "Meridian Export" } }); vi.clearAllMocks(); persistence.listMasters.mockResolvedValue({ counterparties: [{ id: 7, organizationId: 1, legalName: "Meridian Export House LLC", countryCode: "US", tradingNames: [], validTo: null }], products: [] }); persistence.getReceipt.mockResolvedValue({ id: 13, organizationId: 2, fileName: "other-workspace.eml", payloadHash: "hash-13", rawPayload: { supplier: "Meridian Export" } });
    await expect(appRouter.createCaller(reviewerContext()).operations.masters.confirmEntityAlias({ sourceId: 7, alias: "Meridian Export", sourceReceiptId: 13, rationale: "Reviewer attempted to confirm a cross-workspace source alias." })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(persistence.createVersion).not.toHaveBeenCalled(); expect(persistence.appendAudit).not.toHaveBeenCalled();
  });
});
