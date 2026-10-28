import { clerkClient, getAuth } from "@clerk/express";
import type { Request } from "express";
import { ForbiddenError } from "@shared/_core/errors";
import * as db from "../db";
import { ENV } from "./env";

export async function authenticateClerkRequest(req: Request) {
  const { userId } = getAuth(req);
  if (!userId) throw ForbiddenError("A valid Clerk session is required.");
  const existing = await db.getUserByOpenId(userId);
  if (existing) {
    // Roles and tenant membership always come from our database, never token metadata.
    if (userId === ENV.ownerOpenId && existing.role !== "reviewer") {
      await db.upsertUser({ ...existing, role: "reviewer" });
      return (await db.getUserByOpenId(userId))!;
    }
    return existing;
  }
  const profile = await clerkClient.users.getUser(userId);
  const primaryEmail = profile.emailAddresses.find(
    email =>
      email.id === profile.primaryEmailAddressId &&
      email.verification?.status === "verified"
  );
  await db.upsertUser({
    openId: userId,
    name:
      [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
      profile.username ||
      "ARCWAY user",
    email: primaryEmail?.emailAddress ?? null,
    loginMethod: "clerk",
    role: userId === ENV.ownerOpenId ? "reviewer" : "trader",
    lastSignedIn: new Date(),
  });
  const user = await db.getUserByOpenId(userId);
  if (!user?.organizationId)
    throw new Error("Clerk identity could not be linked to a workspace.");
  return user;
}
