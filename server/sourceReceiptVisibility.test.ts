import { describe, expect, it } from "vitest";
import { redactRoutingContextForRole } from "./sourceReceiptVisibility";

describe("redactRoutingContextForRole", () => {
  const reviewerCandidateContext = { candidates: [{ tradeId: 9, reference: "AR-OTHER-0009" }], confirmedBy: 15, rationale: "Matched by commercial reference." };

  it("retains candidate context for a Trader’s still-unlinked receipt so that explicit routing can be completed", () => {
    expect(redactRoutingContextForRole("trader", { tradeId: null, routingContext: reviewerCandidateContext })).toMatchObject({ routingContext: reviewerCandidateContext });
  });

  it("removes candidate context from a linked receipt returned to a Trader while retaining it for a Reviewer", () => {
    expect(redactRoutingContextForRole("trader", { tradeId: 7, routingContext: reviewerCandidateContext })).toEqual({ tradeId: 7, routingContext: null });
    expect(redactRoutingContextForRole("reviewer", { tradeId: 7, routingContext: reviewerCandidateContext })).toMatchObject({ routingContext: reviewerCandidateContext });
  });
});
