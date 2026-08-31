import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const persistence = vi.hoisted(() => ({
  upsertPolicy: vi.fn(),
  appendAudit: vi.fn(),
}));

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    upsertWorkflowAlertPolicy: persistence.upsertPolicy,
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

describe("operations.monitoring.updateAlertPolicy", () => {
  beforeEach(() => vi.clearAllMocks());

  it("persists the reviewer-selected enabled state, severity, and threshold with immutable audit context", async () => {
    const caller = appRouter.createCaller(createReviewerContext());
    const policy = { alertType: "source_health" as const, enabled: false, severity: "information" as const, threshold: 48 };

    await expect(caller.operations.monitoring.updateAlertPolicy(policy)).resolves.toEqual({ success: true });

    expect(persistence.upsertPolicy).toHaveBeenCalledWith({ organizationId: 1, updatedBy: 42, ...policy });
    expect(persistence.appendAudit).toHaveBeenCalledWith(expect.objectContaining({
      organizationId: 1,
      actorId: 42,
      action: "workflow_alert_policy.updated",
      objectType: "workflow_alert_policy",
      objectId: "source_health",
      afterState: policy,
    }));
  });
});
