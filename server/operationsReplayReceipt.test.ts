import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const persistence = vi.hoisted(() => ({
  getReceipt: vi.fn(),
  replayReceipt: vi.fn(),
  recordRun: vi.fn(),
  appendEvent: vi.fn(),
}));

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getSourceIngestionReceiptById: persistence.getReceipt,
    replaySourceIngestionReceipt: persistence.replayReceipt,
    recordIntegrationRun: persistence.recordRun,
    appendTradeEvent: persistence.appendEvent,
  };
});

import { appRouter } from "./routers";

function createReviewerContext(): TrpcContext {
  return {
    user: {
      id: 42,
      openId: "reviewer-user",
      email: "reviewer@example.com",
      name: "Reviewer User",
      loginMethod: "manus",
      role: "reviewer",
      organizationId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("operations.integrations.replayReceipt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    persistence.replayReceipt.mockResolvedValue(undefined);
    persistence.recordRun.mockResolvedValue(501);
    persistence.appendEvent.mockResolvedValue(undefined);
  });

  it("records the complete receipt, integration-run, and Trade Twin activity contract for a Reviewer recovery", async () => {
    persistence.getReceipt.mockResolvedValue({
      id: 88,
      organizationId: 1,
      tradeId: 7,
      integrationId: 21,
      sourceType: "structured_file",
    });
    const caller = appRouter.createCaller(createReviewerContext());

    await expect(caller.operations.integrations.replayReceipt({ receiptId: 88 })).resolves.toEqual({ success: true, runId: 501 });

    expect(persistence.replayReceipt).toHaveBeenCalledWith(88);
    expect(persistence.recordRun).toHaveBeenCalledWith({
      organizationId: 1,
      integrationId: 21,
      runType: "source_replay",
      status: "completed",
      inputSummary: { receiptId: 88, sourceType: "structured_file" },
      outputSummary: { replayed: true },
    });
    expect(persistence.appendEvent).toHaveBeenCalledWith(expect.objectContaining({
      tradeId: 7,
      actorId: 42,
      eventType: "source.replayed",
      title: "Source receipt replayed",
      source: "ingestion",
    }));
  });
});
