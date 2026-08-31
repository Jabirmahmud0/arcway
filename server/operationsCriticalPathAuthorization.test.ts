import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const persistence = vi.hoisted(() => ({ getTrade: vi.fn(), getWorkspace: vi.fn() }));
vi.mock("./db", async importOriginal => { const actual = await importOriginal<typeof import("./db")>(); return { ...actual, getTradeById: persistence.getTrade, getTradeWorkspace: persistence.getWorkspace }; });
import { appRouter } from "./routers";

function traderContext(): TrpcContext { return { user: { id: 14, openId: "trader-user", email: "trader@example.com", name: "Trader User", loginMethod: "manus", role: "trader", organizationId: 1, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] }; }

describe("operations.criticalPath.get", () => {
  it("rejects a Trader before reading the workspace when the Trade Twin belongs to another owner", async () => {
    persistence.getTrade.mockResolvedValue({ id: 7, organizationId: 1, ownerId: 88, reference: "AR-OTHER-0007" });
    await expect(appRouter.createCaller(traderContext()).operations.criticalPath.get({ tradeId: 7 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(persistence.getWorkspace).not.toHaveBeenCalled();
  });
});

describe("operations.assurance.explain", () => {
  it("rejects a Trader before reading retained explanation inputs when the Trade Twin belongs to another owner", async () => {
    persistence.getTrade.mockResolvedValue({ id: 9, organizationId: 1, ownerId: 88, reference: "AR-OTHER-0009" });
    await expect(appRouter.createCaller(traderContext()).operations.assurance.explain({ tradeId: 9 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(persistence.getWorkspace).not.toHaveBeenCalled();
  });
});

describe("operations.drafting.message", () => {
  it("rejects a Trader before drafting from another owner's retained Trade Twin context", async () => {
    persistence.getTrade.mockResolvedValue({ id: 11, organizationId: 1, ownerId: 88, reference: "AR-OTHER-0011" });
    await expect(appRouter.createCaller(traderContext()).operations.drafting.message({ tradeId: 11, kind: "ask_supplier", focus: "Please confirm the retained cargo-ready detail." })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(persistence.getWorkspace).not.toHaveBeenCalled();
  });
});
