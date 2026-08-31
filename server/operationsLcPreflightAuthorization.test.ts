import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const persistence = vi.hoisted(() => ({ getTrade: vi.fn(), getWorkspace: vi.fn() }));

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return { ...actual, getTradeById: persistence.getTrade, getTradeWorkspace: persistence.getWorkspace };
});

import { appRouter } from "./routers";

function context(role: "trader" | "reviewer"): TrpcContext {
  return { user: { id: 14, openId: `${role}-user`, email: `${role}@example.com`, name: role, loginMethod: "manus", role, organizationId: 1, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("operations.settlement.lcPreflight", () => {
  it("rejects a Trader before Trade Twin or LC evidence records are read", async () => {
    await expect(appRouter.createCaller(context("trader")).operations.settlement.lcPreflight({ tradeId: 7 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(persistence.getTrade).not.toHaveBeenCalled();
    expect(persistence.getWorkspace).not.toHaveBeenCalled();
  });
});
