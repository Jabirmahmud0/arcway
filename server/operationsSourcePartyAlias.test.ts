import type { TrpcContext } from "./_core/context";
import { describe, expect, it, vi } from "vitest";

const persistence = vi.hoisted(() => ({ getReceipt: vi.fn(), listMasters: vi.fn(), createVersion: vi.fn(), createEvidence: vi.fn(), createResolution: vi.fn(), appendEvent: vi.fn(), appendAudit: vi.fn() }));
vi.mock("./db", async importOriginal => { const actual = await importOriginal<typeof import("./db")>(); return { ...actual, getSourceIngestionReceiptById: persistence.getReceipt, listOrganizationMasters: persistence.listMasters, createCounterpartyVersion: persistence.createVersion, createConfirmedEvidenceField: persistence.createEvidence, createCanonicalResolution: persistence.createResolution, appendTradeEvent: persistence.appendEvent, appendAuditRecord: persistence.appendAudit }; });
import { appRouter } from "./routers";

function context(role: "trader" | "reviewer"): TrpcContext { return { user: { id: 15, openId: `${role}-user`, email: `${role}@example.com`, name: `${role} User`, loginMethod: "manus", role, organizationId: 1, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] }; }

describe("operations.masters.sourcePartyAliasPreview", () => {
  it("returns read-only no-merge proposals for a Reviewer without changing any retained record", async () => {
    persistence.getReceipt.mockResolvedValue({ id: 8, organizationId: 1, fileName: "supplier-email.eml", sourceType: "email_attachment", tradeId: 4, rawPayload: { supplier: "Meridian Export" } });
    persistence.listMasters.mockResolvedValue({ counterparties: [{ id: 1, legalName: "Meridian Export House LLC", countryCode: "US", tradingNames: ["Meridian Export"], validTo: null }] });
    const result = await appRouter.createCaller(context("reviewer")).operations.masters.sourcePartyAliasPreview({ receiptId: 8 });
    expect(result.proposals).toEqual([expect.objectContaining({ sourceName: "Meridian Export", disposition: "review_required", outcome: "no_merge" })]);
    expect(persistence.createVersion).not.toHaveBeenCalled(); expect(persistence.createEvidence).not.toHaveBeenCalled(); expect(persistence.createResolution).not.toHaveBeenCalled(); expect(persistence.appendEvent).not.toHaveBeenCalled(); expect(persistence.appendAudit).not.toHaveBeenCalled();
  });

  it("rejects a Trader before reading a source receipt or master registry", async () => {
    vi.clearAllMocks();
    await expect(appRouter.createCaller(context("trader")).operations.masters.sourcePartyAliasPreview({ receiptId: 8 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(persistence.getReceipt).not.toHaveBeenCalled(); expect(persistence.listMasters).not.toHaveBeenCalled();
  });
});
