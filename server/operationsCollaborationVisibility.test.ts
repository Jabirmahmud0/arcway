import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const persistence = vi.hoisted(() => ({ listForUser: vi.fn() }));

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return { ...actual, listPartnerRequestsForUser: persistence.listForUser };
});

import { appRouter } from "./routers";

function createContext(role: "trader" | "reviewer"): TrpcContext {
  return {
    user: { id: role === "trader" ? 14 : 28, openId: `${role}-user`, email: `${role}@example.com`, name: `${role} user`, loginMethod: "manus", role, organizationId: 1, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("operations.collaboration.partnerRequests visibility", () => {
  it("passes Trader ownership context to the listing helper", async () => {
    persistence.listForUser.mockResolvedValue([]);
    const caller = appRouter.createCaller(createContext("trader"));

    await expect(caller.operations.collaboration.partnerRequests()).resolves.toEqual([]);
    expect(persistence.listForUser).toHaveBeenCalledWith({ id: 14, role: "trader", organizationId: 1 });
  });

  it("passes Reviewer workspace context to the listing helper", async () => {
    persistence.listForUser.mockResolvedValue([]);
    const caller = appRouter.createCaller(createContext("reviewer"));

    await expect(caller.operations.collaboration.partnerRequests()).resolves.toEqual([]);
    expect(persistence.listForUser).toHaveBeenCalledWith({ id: 28, role: "reviewer", organizationId: 1 });
  });
});
