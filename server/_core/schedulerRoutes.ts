import { timingSafeEqual } from "node:crypto";
import type { Express } from "express";

export function isSchedulerAuthorized(authorization: string | undefined, secret: string) {
  if (secret.length < 32 || !authorization?.startsWith("Bearer ")) return false;
  const supplied = Buffer.from(authorization.slice(7));
  const expected = Buffer.from(secret);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export function registerSchedulerRoutes(app: Express, run: () => Promise<unknown>) {
  app.post("/api/scheduled/operationalSweep", async (req, res) => {
    const secret = process.env.SCHEDULER_SECRET ?? "";
    if (secret.length < 32) return res.status(503).json({ error: "External scheduler access is not configured." });
    if (!isSchedulerAuthorized(req.headers.authorization, secret)) return res.status(401).json({ error: "Invalid scheduler credentials." });
    try {
      const result = await run();
      const failed = Boolean(result && typeof result === "object" && "failed" in result && Number(result.failed) > 0);
      return res.status(failed ? 503 : 200).json({ ok: !failed, result });
    }
    catch { return res.status(503).json({ error: "Operational sweep unavailable; retry later." }); }
  });
}
