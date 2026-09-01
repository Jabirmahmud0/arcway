import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const persistence = vi.hoisted(() => ({ listInbox: vi.fn() }));

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return { ...actual, listSourceIngestionReceiptsForUser: persistence.listInbox };
});

import { appRouter } from "./routers";

function createContext(role: "trader" | "reviewer"): TrpcContext {
  return {
    user: { id: role === "trader" ? 14 : 15, openId: `${role}-user`, email: `${role}@example.com`, name: `${role} user`, loginMethod: "manus", role, organizationId: 1, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("operations.inbox.list", () => {
  beforeEach(() => { vi.clearAllMocks(); persistence.listInbox.mockResolvedValue([]); });

  it("passes the current Trader identity to the owner-scoped Trade Inbox query", async () => {
    await expect(appRouter.createCaller(createContext("trader")).operations.inbox.list()).resolves.toEqual([]);
    expect(persistence.listInbox).toHaveBeenCalledWith({ userId: 14, role: "trader", organizationId: 1 });
  });

  it("retains workspace-wide Trade Inbox visibility for a Reviewer", async () => {
    await expect(appRouter.createCaller(createContext("reviewer")).operations.inbox.list()).resolves.toEqual([]);
    expect(persistence.listInbox).toHaveBeenCalledWith({ userId: 15, role: "reviewer", organizationId: 1 });
  });
});
