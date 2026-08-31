import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const persistence = vi.hoisted(() => ({
  getWorkspace: vi.fn(),
  getOwnedGrant: vi.fn(),
  createGuestGrant: vi.fn(),
  revokeGuestGrant: vi.fn(),
  appendAudit: vi.fn(),
}));

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getTradeWorkspace: persistence.getWorkspace,
    getGuestGrantForOwner: persistence.getOwnedGrant,
    createGuestGrant: persistence.createGuestGrant,
    revokeGuestGrant: persistence.revokeGuestGrant,
    appendAuditRecord: persistence.appendAudit,
  };
});

import { appRouter } from "./routers";

function createTraderContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "trader-user",
      email: "trader@example.com",
      name: "Trader User",
      loginMethod: "manus",
      role: "trader",
      organizationId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("governance.createGuestLink ownership authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    persistence.getWorkspace.mockResolvedValue({ trade: { id: 7, organizationId: 1, ownerId: 2 } });
  });

  it("rejects a same-organization Trader before a guest grant or audit record can be created for another owner’s Trade Twin", async () => {
    const caller = appRouter.createCaller(createTraderContext());

    await expect(caller.governance.createGuestLink({
      tradeId: 7,
      recipientEmail: "partner@example.com",
      scopes: ["trade.read"],
      expiresInDays: 7,
    })).rejects.toMatchObject({ code: "FORBIDDEN" });

    expect(persistence.createGuestGrant).not.toHaveBeenCalled();
    expect(persistence.appendAudit).not.toHaveBeenCalled();
  });

  it("rejects a same-organization Trader before another owner’s guest link can be revoked", async () => {
    persistence.getOwnedGrant.mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createTraderContext());

    await expect(caller.governance.revokeGuestLink({ grantId: 9 })).rejects.toMatchObject({ code: "NOT_FOUND" });

    expect(persistence.getOwnedGrant).toHaveBeenCalledWith({ id: 9, organizationId: 1, createdBy: 1 });
    expect(persistence.revokeGuestGrant).not.toHaveBeenCalled();
    expect(persistence.appendAudit).not.toHaveBeenCalled();
  });
});
