import { access, mkdir } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { sql } from "drizzle-orm";
import type { Express } from "express";
import { getDb } from "../db";
import { databaseRuntimeEnabled } from "../runtimeState";

export function privateDataDirectories() {
  return [process.env.STORAGE_LOCAL_DIR || ".data/uploads", process.env.INTEGRATION_TOKEN_DIR || ".data/integrations", process.env.AI_EVALUATION_DIR || ".data/evaluations"].map(directory => path.resolve(directory));
}
export async function preparePrivateDataDirectories() {
  if (databaseRuntimeEnabled()) return;
  for (const directory of privateDataDirectories()) {
    await mkdir(directory, { recursive: true, mode: 0o700 });
    await access(directory, constants.R_OK | constants.W_OK);
  }
}
export async function checkReadiness() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.execute(sql`select "id" from "tradeDocumentVersions" limit 1`);
  if (databaseRuntimeEnabled()) { await db.execute(sql`select "id" from "appRuntimeState" limit 1`); return; }
  for (const directory of privateDataDirectories()) await access(directory, constants.R_OK | constants.W_OK);
}
export function registerHealthRoutes(app: Express, ready = checkReadiness) {
  app.get("/api/health/live", (_req, res) => res.set("Cache-Control", "no-store").json({ ok: true, service: "arcway" }));
  app.get("/api/health", async (_req, res) => {
    res.set("Cache-Control", "no-store");
    try { await ready(); return res.json({ ok: true, service: "arcway" }); }
    catch { return res.status(503).json({ ok: false, service: "arcway" }); }
  });
}
