import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const persistence = vi.hoisted(() => ({
  getTrade: vi.fn(),
  getMapping: vi.fn(),
  listMappings: vi.fn(),
  createReceipt: vi.fn(),
}));

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getTradeById: persistence.getTrade,
    getImportMappingForUser: persistence.getMapping,
    listImportMappingsForUser: persistence.listMappings,
    createSourceIngestionReceipt: persistence.createReceipt,
  };
});

import { appRouter } from "./routers";

function createTraderContext(): TrpcContext {
  return {
    user: { id: 14, openId: "trader-user", email: "trader@example.com", name: "Trader User", loginMethod: "manus", role: "trader", organizationId: 1, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("operations.integrations.ingestSource mapping access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    persistence.getTrade.mockResolvedValue({ id: 7, organizationId: 1, ownerId: 14, reference: "AR-OWNER-0001" });
  });

  it("rejects a Trader before source persistence when the selected mapping is unavailable in that Trader’s owner scope", async () => {
    persistence.getMapping.mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createTraderContext());

    await expect(caller.operations.integrations.ingestSource({ tradeId: 7, sourceType: "structured_file", mappingId: 99, payload: {} })).rejects.toMatchObject({ code: "NOT_FOUND" });

    expect(persistence.getMapping).toHaveBeenCalledWith({ mappingId: 99, userId: 14, role: "trader", organizationId: 1 });
    expect(persistence.createReceipt).not.toHaveBeenCalled();
  });
});

describe("operations.integrations.mappings", () => {
  it("lists reusable mappings with the current Trader owner scope", async () => {
    persistence.listMappings.mockResolvedValue([{ id: 21, sourceName: "invoice", entityType: "commercial_invoice" }]);
    const caller = appRouter.createCaller(createTraderContext());

    await expect(caller.operations.integrations.mappings()).resolves.toEqual([{ id: 21, sourceName: "invoice", entityType: "commercial_invoice" }]);
    expect(persistence.listMappings).toHaveBeenCalledWith({ userId: 14, role: "trader", organizationId: 1 });
  });
});
