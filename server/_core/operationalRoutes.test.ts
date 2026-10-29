import express from "express";
import { createServer } from "node:http";
import { describe, expect, it, vi } from "vitest";
import { registerHealthRoutes } from "./health";
import { registerSchedulerRoutes } from "./schedulerRoutes";

describe("health and external scheduler HTTP boundaries", () => {
  it("keeps health public, protects scheduling separately from Clerk, and redacts failures", async () => {
    const ready = vi.fn().mockResolvedValue(undefined);
    const sweep = vi.fn().mockResolvedValue({ executed: 1 });
    const app = express(); registerHealthRoutes(app, ready); registerSchedulerRoutes(app, sweep);
    const server = createServer(app);
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    const address = server.address() as import("node:net").AddressInfo;
    const url = `http://127.0.0.1:${address.port}`;
    vi.stubEnv("SCHEDULER_SECRET", "x".repeat(40));
    vi.stubEnv("CRON_SECRET", "");
    try {
      expect((await fetch(`${url}/api/health/live`)).status).toBe(200);
      expect((await fetch(`${url}/api/health`)).status).toBe(200);
      expect((await fetch(`${url}/api/scheduled/operationalSweep`, { method: "POST" })).status).toBe(401);
      expect((await fetch(`${url}/api/scheduled/operationalSweep`, { method: "POST", headers: { Authorization: "Bearer wrong" } })).status).toBe(401);
      expect(sweep).not.toHaveBeenCalled();
      expect((await fetch(`${url}/api/scheduled/operationalSweep`, { method: "POST", headers: { Authorization: `Bearer ${"x".repeat(40)}` } })).status).toBe(200);
      expect(sweep).toHaveBeenCalledOnce();
      expect((await fetch(`${url}/api/scheduled/operationalSweep`, { headers: { Authorization: `Bearer ${"x".repeat(40)}` } })).status).toBe(200);
      sweep.mockResolvedValue({ executed: 0, failed: 1 });
      expect((await fetch(`${url}/api/scheduled/operationalSweep`, { method: "POST", headers: { Authorization: `Bearer ${"x".repeat(40)}` } })).status).toBe(503);
      ready.mockRejectedValue(new Error("private database details"));
      const failed = await fetch(`${url}/api/health`);
      expect(failed.status).toBe(503);
      expect(await failed.text()).not.toContain("private database details");
    } finally { vi.unstubAllEnvs(); await new Promise<void>(resolve => server.close(() => resolve())); }
  });
});
