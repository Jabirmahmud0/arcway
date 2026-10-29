import { and, eq, gt, isNull, lte, or, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { appRuntimeState } from "../drizzle/schema";
import { getDb } from "./db";

export const databaseRuntimeEnabled = () => process.env.RUNTIME_STATE_BACKEND === "postgres" || process.env.VERCEL === "1";
async function database() { const db = await getDb(); if (!db) throw new Error("Database unavailable"); return db; }
export async function readRuntimeState<T>(namespace: string, key: string): Promise<T | null> {
  const db = await database();
  const [row] = await db.select().from(appRuntimeState).where(and(eq(appRuntimeState.namespace, namespace), eq(appRuntimeState.key, key), or(isNull(appRuntimeState.expiresAt), gt(appRuntimeState.expiresAt, new Date())))).limit(1);
  return row ? row.value as T : null;
}
export async function putRuntimeState(namespace: string, key: string, value: unknown, expiresAt: Date | null = null) {
  const db = await database();
  await db.insert(appRuntimeState).values({ namespace, key, value, expiresAt }).onConflictDoUpdate({ target: [appRuntimeState.namespace, appRuntimeState.key], set: { value, expiresAt, updatedAt: new Date() } });
}
export async function removeRuntimeState(namespace: string, key: string) {
  await (await database()).delete(appRuntimeState).where(and(eq(appRuntimeState.namespace, namespace), eq(appRuntimeState.key, key)));
}
export async function consumeRuntimeState<T>(namespace: string, key: string): Promise<T | null> {
  const [row] = await (await database()).delete(appRuntimeState).where(and(eq(appRuntimeState.namespace, namespace), eq(appRuntimeState.key, key), gt(appRuntimeState.expiresAt, new Date()))).returning({ value: appRuntimeState.value });
  return row ? row.value as T : null;
}
export async function acquireRuntimeLease(namespace: string, key: string, durationMs = 600_000) {
  const token = randomUUID(), now = new Date();
  const [row] = await (await database()).insert(appRuntimeState).values({ namespace, key, value: { token }, expiresAt: new Date(now.getTime() + durationMs) }).onConflictDoUpdate({ target: [appRuntimeState.namespace, appRuntimeState.key], set: { value: { token }, expiresAt: new Date(now.getTime() + durationMs), updatedAt: now }, setWhere: lte(appRuntimeState.expiresAt, now) }).returning({ id: appRuntimeState.id });
  return row ? token : null;
}
export async function releaseRuntimeLease(namespace: string, key: string, token: string) {
  await (await database()).delete(appRuntimeState).where(and(eq(appRuntimeState.namespace, namespace), eq(appRuntimeState.key, key), sql`${appRuntimeState.value}->>'token' = ${token}`));
}
export async function clearExpiredRuntimeState() { await (await database()).delete(appRuntimeState).where(lte(appRuntimeState.expiresAt, new Date())); }
