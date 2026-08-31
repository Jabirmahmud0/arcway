import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const persistence = vi.hoisted(() => ({
  runObligationSweep: vi.fn(),
  runSourceHealthSweep: vi.fn(),
  appendAudit: vi.fn(),
}));

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    runObligationEscalationSweep: persistence.runObligationSweep,
    runSourceHealthSweep: persistence.runSourceHealthSweep,
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

describe("operations.monitoring.runOperationalSweep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    persistence.appendAudit.mockResolvedValue(undefined);
  });

  it("retains completed escalation and source-health results in the Reviewer-triggered operational audit record", async () => {
    const obligations = { escalated: 2, notifications: 1 };
    const sourceHealth = { checked: 5, warnings: 1 };
    persistence.runObligationSweep.mockResolvedValue(obligations);
    persistence.runSourceHealthSweep.mockResolvedValue(sourceHealth);
    const caller = appRouter.createCaller(createReviewerContext());

    await expect(caller.operations.monitoring.runOperationalSweep()).resolves.toEqual({ obligations, sourceHealth });

    expect(persistence.runObligationSweep).toHaveBeenCalledOnce();
    expect(persistence.runSourceHealthSweep).toHaveBeenCalledOnce();
    expect(persistence.appendAudit).toHaveBeenCalledWith({
      organizationId: 1,
      actorId: 42,
      action: "monitoring.operational_sweep",
      objectType: "automation",
      objectId: "operational-sweep",
      afterState: { obligations, sourceHealth },
      reason: "Reviewer-triggered operational sweep",
    });
  });
});
