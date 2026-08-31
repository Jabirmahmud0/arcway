import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import { assertDocumentTransition } from "./documentWorkflow";

describe("document verification state transitions", () => {
  it("allows uploaded evidence to enter review and be verified", () => {
    expect(() => assertDocumentTransition("uploaded", "under review")).not.toThrow();
    expect(() => assertDocumentTransition("under review", "verified")).not.toThrow();
  });

  it("requires a replacement upload before a verified document can re-enter review", () => {
    try { assertDocumentTransition("verified", "rejected"); } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("BAD_REQUEST");
    }
  });
});

