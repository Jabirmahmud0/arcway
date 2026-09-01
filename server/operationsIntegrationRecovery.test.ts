import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const persistence = vi.hoisted(() => ({
  listOperations: vi.fn(),
  recordRun: vi.fn(),
  updateAlert: vi.fn(),
}));

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    listIntegrationOperations: persistence.listOperations,
    recordIntegrationRun: persistence.recordRun,
    updateWorkflowAlert: persistence.updateAlert,
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

describe("operations integration recovery mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    persistence.listOperations.mockResolvedValue({
      integrations: [{ id: 21, providerType: "erp" }],
      alerts: [{ id: 55 }],
    });
    persistence.recordRun.mockResolvedValue(901);
    persistence.updateAlert.mockResolvedValue(undefined);
  });

  it("records a failed provider run with the protected integration identity and operator rationale", async () => {
    const caller = appRouter.createCaller(createReviewerContext());

    await expect(caller.operations.integrations.recordFailure({
      integrationId: 21,
      reason: "ERP provider response was malformed during source normalization.",
    })).resolves.toEqual({ runId: 901 });

    expect(persistence.listOperations).toHaveBeenCalledWith(1);
    expect(persistence.recordRun).toHaveBeenCalledWith({
      organizationId: 1,
      integrationId: 21,
      runType: "operator_failure_record",
      status: "failed",
      inputSummary: { providerType: "erp" },
      errorMessage: "ERP provider response was malformed during source normalization.",
    });
  });

  it("acknowledges a known workflow alert with the Reviewer actor identity", async () => {
    const caller = appRouter.createCaller(createReviewerContext());

    await expect(caller.operations.integrations.updateAlert({ alertId: 55, status: "acknowledged" })).resolves.toEqual({ success: true });

    expect(persistence.listOperations).toHaveBeenCalledWith(1);
    expect(persistence.updateAlert).toHaveBeenCalledWith({ id: 55, status: "acknowledged", actorId: 42 });
  });
});
