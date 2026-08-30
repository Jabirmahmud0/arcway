import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import { requireArcwayRole } from "./access";

describe("ARCWAY role gates", () => {
  it("allows Traders to submit and manage their trade-side actions", () => {
    expect(() => requireArcwayRole("trader", "trader")).not.toThrow();
  });

  it("allows Reviewers to make assurance decisions", () => {
    expect(() => requireArcwayRole("reviewer", "reviewer")).not.toThrow();
  });

  it("rejects a cross-role action with a forbidden error", () => {
    try {
      requireArcwayRole("reviewer", "trader");
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("FORBIDDEN");
    }
  });
});

