import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
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

function createReviewerContext(): TrpcContext {
  const trader = createTraderContext();
  return { ...trader, user: { ...trader.user!, id: 2, openId: "reviewer-user", email: "reviewer@example.com", name: "Reviewer User", role: "reviewer" } };
}

describe("core Trade Twin reviewer-mutation authorization", () => {
  it("rejects a Trader before Reviewer seed, release, exception, or concentration actions can reach protected data", async () => {
    const caller = appRouter.createCaller(createTraderContext());

    await expect(caller.trades.seedShadowAudit()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.trades.rerunPreflight({ tradeId: 999999 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.trades.review({ tradeId: 999999, decision: "approved", reason: "Reviewer decision required for trade release." })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.trades.exceptions.resolve({ exceptionId: 999999, outcome: "corrected", rationale: "Reviewer resolution is required for material evidence exceptions." })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.trades.productConcentration()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("Trade Twin document role authorization", () => {
  it("rejects a Trader before document review and a Reviewer before evidence upload can access a document record", async () => {
    const trader = appRouter.createCaller(createTraderContext());
    const reviewer = appRouter.createCaller(createReviewerContext());

    await expect(trader.trades.documents.review({ documentId: 999999, status: "verified", reviewerNotes: "Reviewer-only document verification." })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(reviewer.trades.documents.upload({ documentId: 999999, fileName: "invoice.pdf", mimeType: "application/pdf", base64: "dGVzdC1ldmlkZW5jZQ==" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("Trade Twin Trader-only operational authorization", () => {
  it("rejects a Reviewer before obligation fulfillment or source-email ingestion can access the protected Trade Twin", async () => {
    const reviewer = appRouter.createCaller(createReviewerContext());

    await expect(reviewer.trades.obligations.fulfill({ obligationId: 999999 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(reviewer.trades.ingestion.email({ tradeId: 999999, sender: "carrier@example.com", subject: "Carrier booking confirmation", body: "Booking evidence supplied for Trade Twin reconciliation." })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
