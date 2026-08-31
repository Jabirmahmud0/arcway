import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const persistence = vi.hoisted(() => ({
  getGrant: vi.fn(),
  getWorkspace: vi.fn(),
  listRequests: vi.fn(),
  touchGrant: vi.fn(),
  getRequest: vi.fn(),
  respond: vi.fn(),
  recordHandoff: vi.fn(),
  appendAudit: vi.fn(),
}));

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getGuestGrantByTokenHash: persistence.getGrant,
    getTradeWorkspace: persistence.getWorkspace,
    listPartnerRequestsForGuest: persistence.listRequests,
    touchGuestGrant: persistence.touchGrant,
    getPartnerRequestById: persistence.getRequest,
    respondToPartnerRequest: persistence.respond,
    recordGuestHandoff: persistence.recordHandoff,
    appendAuditRecord: persistence.appendAudit,
  };
});

import { appRouter } from "./routers";

function createPublicContext(): TrpcContext {
  return { user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("governance.guest.respondToPartnerRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    persistence.getGrant.mockResolvedValue({
      id: 9,
      organizationId: 1,
      tradeId: 7,
      recipientEmail: "partner@example.com",
      status: "active",
      expiresAt: new Date("2030-01-01T00:00:00Z"),
      scope: ["partner_request.respond"],
      createdBy: 42,
    });
    persistence.getRequest.mockResolvedValue({ id: 55, tradeId: 7, recipientEmail: "partner@example.com", status: "sent" });
  });

  it("retains a scoped partner response with every labeled evidence reference and immutable audit context", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const evidence = [
      { label: "Packing list", reference: "PL-014.pdf" },
      { label: "Container seal", reference: "SEAL-9912" },
    ];

    await expect(caller.governance.guest.respondToPartnerRequest({
      token: "secure-partner-token-2026",
      requestId: 55,
      summary: "Packing-list and container seal evidence are supplied for the named request.",
      evidence,
    })).resolves.toEqual({ success: true });

    expect(persistence.respond).toHaveBeenCalledWith(expect.objectContaining({ requestId: 55, responseEvidence: evidence }));
    expect(persistence.recordHandoff).toHaveBeenCalledWith(expect.objectContaining({ grantId: 9, tradeId: 7, ingestedBy: 42 }));
    expect(persistence.appendAudit).toHaveBeenCalledWith(expect.objectContaining({
      organizationId: 1,
      action: "partner_request.responded",
      objectId: "55",
      afterState: { evidence },
      source: "guest_portal",
    }));
  });

  it("rejects an expired guest link before any response evidence is persisted", async () => {
    persistence.getGrant.mockResolvedValue({
      id: 9,
      organizationId: 1,
      tradeId: 7,
      recipientEmail: "partner@example.com",
      status: "active",
      expiresAt: new Date("2020-01-01T00:00:00Z"),
      scope: ["partner_request.respond"],
      createdBy: 42,
    });
    const caller = appRouter.createCaller(createPublicContext());

    await expect(caller.governance.guest.respondToPartnerRequest({
      token: "expired-partner-token-2026",
      requestId: 55,
      summary: "This response must not be recorded because the secure link has expired.",
      evidence: [{ label: "Packing list", reference: "PL-014.pdf" }],
    })).rejects.toMatchObject({ code: "FORBIDDEN" });

    expect(persistence.getRequest).not.toHaveBeenCalled();
    expect(persistence.respond).not.toHaveBeenCalled();
    expect(persistence.recordHandoff).not.toHaveBeenCalled();
    expect(persistence.appendAudit).not.toHaveBeenCalled();
  });

  it.each([
    { status: "revoked", expiresAt: new Date("2030-01-01T00:00:00Z"), scope: ["partner_request.respond"] },
    { status: "active", expiresAt: new Date("2030-01-01T00:00:00Z"), scope: ["trade.read"] },
  ])("rejects a $status or incorrectly scoped guest link before request lookup", async invalidGrant => {
    persistence.getGrant.mockResolvedValue({
      id: 9,
      organizationId: 1,
      tradeId: 7,
      recipientEmail: "partner@example.com",
      createdBy: 42,
      ...invalidGrant,
    });
    const caller = appRouter.createCaller(createPublicContext());

    await expect(caller.governance.guest.respondToPartnerRequest({
      token: "invalid-partner-token-2026",
      requestId: 55,
      summary: "This response must not be accepted without active scoped access.",
      evidence: [{ label: "Packing list", reference: "PL-014.pdf" }],
    })).rejects.toMatchObject({ code: "FORBIDDEN" });

    expect(persistence.getRequest).not.toHaveBeenCalled();
    expect(persistence.respond).not.toHaveBeenCalled();
    expect(persistence.recordHandoff).not.toHaveBeenCalled();
    expect(persistence.appendAudit).not.toHaveBeenCalled();
  });

  it("returns only action metadata for a valid action-only link and never reads the Trade Twin", async () => {
    persistence.getGrant.mockResolvedValue({
      id: 9,
      organizationId: 1,
      tradeId: 7,
      recipientEmail: "partner@example.com",
      status: "active",
      expiresAt: new Date("2030-01-01T00:00:00Z"),
      scope: ["packing_list.upload"],
      createdBy: 42,
    });
    const caller = appRouter.createCaller(createPublicContext());

    await expect(caller.governance.guest.resolve({ token: "action-only-partner-token-2026" })).resolves.toMatchObject({
      grant: { id: 9, scope: ["packing_list.upload"] },
      trade: null,
      documents: [],
      obligations: [],
      partnerRequests: [],
    });

    expect(persistence.getWorkspace).not.toHaveBeenCalled();
    expect(persistence.listRequests).not.toHaveBeenCalled();
    expect(persistence.touchGrant).toHaveBeenCalledWith(9);
  });
});
