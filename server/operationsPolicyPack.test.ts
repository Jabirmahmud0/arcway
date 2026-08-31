import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const persistence = vi.hoisted(() => ({
  createPolicyPack: vi.fn(),
  appendAudit: vi.fn(),
}));

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    createPolicyPack: persistence.createPolicyPack,
    appendAuditRecord: persistence.appendAudit,
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

describe("operations.policies.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    persistence.createPolicyPack.mockResolvedValue(701);
    persistence.appendAudit.mockResolvedValue(undefined);
  });

  it("persists Reviewer ownership and immutable audit context for a policy-pack authoring decision", async () => {
    const caller = appRouter.createCaller(createReviewerContext());
    const policy = {
      name: "EU origin evidence gate",
      scope: "jurisdiction" as const,
      jurisdiction: "EU",
      rules: [{ if: { shipment_country: "TR" }, then: { requires: "certificate_of_origin" } }],
    };

    await expect(caller.operations.policies.create(policy)).resolves.toEqual({ id: 701 });

    expect(persistence.createPolicyPack).toHaveBeenCalledWith({
      organizationId: 1,
      ownerId: 42,
      ...policy,
    });
    expect(persistence.appendAudit).toHaveBeenCalledWith({
      organizationId: 1,
      actorId: 42,
      action: "policy_pack.created",
      objectType: "policy_pack",
      objectId: "701",
      afterState: policy,
      reason: "Reviewer policy pack and version authored",
    });
  });
});
