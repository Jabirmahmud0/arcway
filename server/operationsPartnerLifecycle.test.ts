import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const persistence = vi.hoisted(() => ({
  getRequest: vi.fn(),
  getTrade: vi.fn(),
  updateStatus: vi.fn(),
  remind: vi.fn(),
  appendEvent: vi.fn(),
}));

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getPartnerRequestById: persistence.getRequest,
    getTradeById: persistence.getTrade,
    updatePartnerRequestStatus: persistence.updateStatus,
    remindPartnerRequest: persistence.remind,
    appendTradeEvent: persistence.appendEvent,
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

const request = (status: string) => ({ id: 55, tradeId: 7, requestType: "Packing-list confirmation", recipientEmail: "partner@example.com", status });

describe("operations.partner lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    persistence.getTrade.mockResolvedValue({ id: 7, organizationId: 1, ownerId: 14 });
  });

  it("records an allowed status transition and its Trade Twin event", async () => {
    persistence.getRequest.mockResolvedValue(request("responded"));
    const caller = appRouter.createCaller(createTraderContext());

    await expect(caller.operations.collaboration.updatePartnerRequest({ requestId: 55, status: "accepted" })).resolves.toEqual({ success: true });

    expect(persistence.updateStatus).toHaveBeenCalledWith({ requestId: 55, status: "accepted" });
    expect(persistence.appendEvent).toHaveBeenCalledWith(expect.objectContaining({ tradeId: 7, actorId: 14, eventType: "partner.status_updated" }));
  });

  it("records the valid accepted-to-completed transition and its final collaboration event", async () => {
    persistence.getRequest.mockResolvedValue(request("accepted"));
    const caller = appRouter.createCaller(createTraderContext());

    await expect(caller.operations.collaboration.updatePartnerRequest({ requestId: 55, status: "completed" })).resolves.toEqual({ success: true });

    expect(persistence.updateStatus).toHaveBeenCalledWith({ requestId: 55, status: "completed" });
    expect(persistence.appendEvent).toHaveBeenCalledWith(expect.objectContaining({
      tradeId: 7,
      eventType: "partner.status_updated",
      afterState: { partnerRequestId: 55, status: "completed" },
    }));
  });

  it("rejects an invalid terminal transition before any persistence side effect", async () => {
    persistence.getRequest.mockResolvedValue(request("sent"));
    const caller = appRouter.createCaller(createTraderContext());

    await expect(caller.operations.collaboration.updatePartnerRequest({ requestId: 55, status: "completed" })).rejects.toMatchObject<Partial<TRPCError>>({ code: "BAD_REQUEST" });

    expect(persistence.updateStatus).not.toHaveBeenCalled();
    expect(persistence.appendEvent).not.toHaveBeenCalled();
  });

  it("rejects a same-organization Trader before another owner’s partner request can be updated", async () => {
    persistence.getRequest.mockResolvedValue(request("responded"));
    persistence.getTrade.mockResolvedValue({ id: 7, organizationId: 1, ownerId: 99 });
    const caller = appRouter.createCaller(createTraderContext());

    await expect(caller.operations.collaboration.updatePartnerRequest({ requestId: 55, status: "accepted" })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });

    expect(persistence.updateStatus).not.toHaveBeenCalled();
    expect(persistence.appendEvent).not.toHaveBeenCalled();
  });

  it("records a scoped partner reminder and related collaboration event", async () => {
    persistence.getRequest.mockResolvedValue(request("viewed"));
    const caller = appRouter.createCaller(createTraderContext());

    await expect(caller.operations.collaboration.remindPartnerRequest({ requestId: 55 })).resolves.toEqual({ success: true });

    expect(persistence.remind).toHaveBeenCalledWith(55);
    expect(persistence.appendEvent).toHaveBeenCalledWith(expect.objectContaining({ tradeId: 7, actorId: 14, eventType: "partner.reminder_recorded" }));
  });
});
