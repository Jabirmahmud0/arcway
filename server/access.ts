import { TRPCError } from "@trpc/server";

export type ArcwayRole = "trader" | "reviewer";

export function requireArcwayRole(requiredRole: ArcwayRole, actualRole: ArcwayRole) {
  if (actualRole !== requiredRole) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `${requiredRole === "trader" ? "Trader" : "Reviewer"} access is required for this action.`,
    });
  }
}

