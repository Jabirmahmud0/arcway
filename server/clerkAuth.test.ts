import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request } from "express";
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  profile: vi.fn(),
  getUser: vi.fn(),
  upsert: vi.fn(),
}));
vi.mock("@clerk/express", () => ({
  getAuth: mocks.auth,
  clerkClient: { users: { getUser: mocks.profile } },
}));
vi.mock("./db", () => ({
  getUserByOpenId: mocks.getUser,
  upsertUser: mocks.upsert,
}));
vi.mock("./_core/env", () => ({
  ENV: {
    clerkEnabled: true,
    ownerOpenId: "user_owner",
    oAuthServerUrl: "",
    cookieSecret: "test-secret-that-is-at-least-32-characters",
  },
}));
import { authenticateClerkRequest } from "./_core/clerkAuth";
import { sdk } from "./_core/sdk";
const req = { headers: {} } as Request;
const account = {
  id: 7,
  openId: "user_test",
  organizationId: 2,
  role: "trader",
  name: "Test",
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockReturnValue({ userId: "user_test" });
});
describe("Clerk identity and workspace boundaries", () => {
  it("requires a verified Clerk session before looking up a workspace", async () => {
    mocks.auth.mockReturnValue({ userId: null });
    await expect(authenticateClerkRequest(req)).rejects.toThrow(
      "valid Clerk session"
    );
    expect(mocks.getUser).not.toHaveBeenCalled();
  });
  it("preserves roles and organization IDs from the database", async () => {
    const reviewer = { ...account, role: "reviewer" };
    mocks.getUser.mockResolvedValue(reviewer);
    expect(await authenticateClerkRequest(req)).toBe(reviewer);
    expect(mocks.profile).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
  it("creates a trader and ignores client-managed role metadata", async () => {
    mocks.getUser
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(account);
    mocks.profile.mockResolvedValue({
      firstName: "Jane",
      lastName: "Doe",
      primaryEmailAddressId: "mail_1",
      emailAddresses: [
        {
          id: "mail_1",
          emailAddress: "jane@example.com",
          verification: { status: "verified" },
        },
      ],
      unsafeMetadata: { role: "reviewer", organizationId: 1 },
    });
    expect(await authenticateClerkRequest(req)).toBe(account);
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        openId: "user_test",
        email: "jane@example.com",
        role: "trader",
        loginMethod: "clerk",
      })
    );
    expect(mocks.upsert.mock.calls[0][0].organizationId).toBeUndefined();
  });
  it("does not trust an unverified email for an identity link", async () => {
    mocks.getUser
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(account);
    mocks.profile.mockResolvedValue({
      firstName: "Jane",
      primaryEmailAddressId: "mail_1",
      emailAddresses: [
        {
          id: "mail_1",
          emailAddress: "claimed@example.com",
          verification: { status: "unverified" },
        },
      ],
    });
    await authenticateClerkRequest(req);
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ email: null })
    );
    expect(mocks.getUser.mock.calls.every(([id]) => id === "user_test")).toBe(
      true
    );
  });
  it("does not invent a user or tenant when persistence fails", async () => {
    mocks.getUser.mockResolvedValue(undefined);
    mocks.profile.mockResolvedValue({ emailAddresses: [] });
    await expect(authenticateClerkRequest(req)).rejects.toThrow(
      "could not be linked"
    );
  });
  it("only grants initial reviewer access to the explicitly configured owner", async () => {
    mocks.auth.mockReturnValue({ userId: "user_owner" });
    mocks.getUser
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({
        ...account,
        openId: "user_owner",
        role: "reviewer",
      });
    mocks.profile.mockResolvedValue({ emailAddresses: [] });
    await authenticateClerkRequest(req);
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ openId: "user_owner", role: "reviewer" })
    );
  });
  it("never falls back to legacy JWT cookies when Clerk is enabled", async () => {
    mocks.auth.mockReturnValue({ userId: null });
    const token = await sdk.createSessionToken("dev-reviewer-01");
    await expect(
      sdk.authenticateRequest({
        headers: { cookie: `app_session_id=${token}` },
      } as Request)
    ).rejects.toThrow("valid Clerk session");
    expect(mocks.getUser).not.toHaveBeenCalled();
  });
});
