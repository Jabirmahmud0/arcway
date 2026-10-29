import { createHash, randomBytes } from "node:crypto";
import type { Express } from "express";
import { TRPCError } from "@trpc/server";
import { sdk } from "../_core/sdk";
import { appendTradeEvent, getTradeById, saveGmailReceipt } from "../db";
import { storageDelete, storagePut } from "../storage";
import { readGmailToken, removeGmailToken, writeGmailToken } from "./tokenVault";
import { acquireRuntimeLease, releaseRuntimeLease, readRuntimeState, putRuntimeState, consumeRuntimeState, databaseRuntimeEnabled } from "../runtimeState";

type User = { id: number; organizationId?: number | null; role: "trader" | "reviewer" };
type Token = { refreshToken: string; organizationId: number; email: string; scope: string };
export type GmailPart = { filename?: string; mimeType?: string; body?: { size?: number; data?: string; attachmentId?: string }; parts?: GmailPart[]; headers?: Array<{ name: string; value: string }> };
const states = new Map<string, { userId: number; organizationId: number; expires: number }>();
const syncing = new Set<number>();
const scope = "https://www.googleapis.com/auth/gmail.readonly";
const allowedAttachments = new Set(["application/pdf", "image/png", "image/jpeg", "text/plain", "text/csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]);
const endpoint = "https://gmail.googleapis.com/gmail/v1/users/me";

export function gmailConfigured() {
  return Boolean(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REDIRECT_URI && /^[a-f0-9]{64}$/i.test(process.env.INTEGRATION_ENCRYPTION_KEY || ""));
}
function requireConfig() { if (!gmailConfigured()) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Add the Gmail OAuth client ID, secret, and callback URL in the server environment, then restart." }); }
export async function gmailStatus(user: User) {
  const token = await readGmailToken<Token>(user.id);
  const connected = Boolean(token && token.organizationId === user.organizationId);
  return { configured: gmailConfigured(), connected, email: connected ? token!.email : null, syncing: databaseRuntimeEnabled() ? Boolean(await readRuntimeState("gmail-sync", String(user.id))) : syncing.has(user.id) };
}
export async function beginGmail(user: User) {
  requireConfig();
  if (!user.organizationId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Workspace unavailable." });
  for (const [key, value] of Array.from(states)) if (value.expires < Date.now() || value.userId === user.id) states.delete(key);
  const state = randomBytes(32).toString("hex");
  states.set(state, { userId: user.id, organizationId: user.organizationId, expires: Date.now() + 600000 });
  if (databaseRuntimeEnabled()) {
    states.delete(state);
    await putRuntimeState("gmail-oauth", `${user.id}:${createHash("sha256").update(state).digest("hex")}`, { userId: user.id, organizationId: user.organizationId }, new Date(Date.now() + 600000));
  }
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({ client_id: process.env.GMAIL_CLIENT_ID!, redirect_uri: process.env.GMAIL_REDIRECT_URI!, response_type: "code", scope, access_type: "offline", prompt: "consent", state }).toString();
  return { url: url.toString() };
}
async function tokenRequest(parameters: Record<string, string>) {
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: process.env.GMAIL_CLIENT_ID!, client_secret: process.env.GMAIL_CLIENT_SECRET!, ...parameters }), signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error("Google authorization expired or was denied. Reconnect Gmail.");
  return response.json() as Promise<{ access_token: string; refresh_token?: string; scope?: string }>;
}
async function gmailGet<T>(url: string, accessToken: string): Promise<T> {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "Gmail access was denied. Check Gmail API access and reconnect." : "Gmail is temporarily unavailable. Try syncing again.");
  return response.json() as Promise<T>;
}
export async function consumeGmailState(state: string, user: User) {
  if (databaseRuntimeEnabled()) {
    const key = `${user.id}:${createHash("sha256").update(state).digest("hex")}`;
    const pending = await readRuntimeState<{ userId: number; organizationId: number }>("gmail-oauth", key);
    if (!pending || pending.userId !== user.id || pending.organizationId !== user.organizationId) throw new Error("Invalid or expired Gmail connection. Start again from Integrations.");
    if (!await consumeRuntimeState("gmail-oauth", key)) throw new Error("This connection attempt was already used.");
    return;
  }
  const pending = states.get(state);
  if (!pending || pending.userId !== user.id || pending.organizationId !== user.organizationId || pending.expires < Date.now()) throw new Error("Invalid or expired Gmail connection. Start again from Integrations.");
  states.delete(state);
}
export function registerGmailRoutes(app: Express) {
  app.get("/api/integrations/gmail/callback", async (req, res) => {
    res.set("Cache-Control", "no-store");
    let user;
    try { user = await sdk.authenticateRequest(req); } catch { res.status(401).send("Sign in to ARCWAY and start the Gmail connection again."); return; }
    try {
      requireConfig();
      await consumeGmailState(typeof req.query.state === "string" ? req.query.state : "", user);
      if (req.query.error) { res.redirect("/integrations?gmail=cancelled"); return; }
      if (typeof req.query.code !== "string") throw new Error("Missing authorization code");
      const token = await tokenRequest({ code: req.query.code, redirect_uri: process.env.GMAIL_REDIRECT_URI!, grant_type: "authorization_code" });
      if (!token.refresh_token || !token.access_token || !token.scope?.split(" ").includes(scope)) throw new Error("Gmail read access and offline permission are required. Reconnect and allow the requested access.");
      const profile = await gmailGet<{ emailAddress: string }>(`${endpoint}/profile`, token.access_token);
      await writeGmailToken(user.id, { refreshToken: token.refresh_token, organizationId: user.organizationId!, email: profile.emailAddress, scope: token.scope } satisfies Token);
      res.redirect("/integrations?gmail=connected");
    } catch { res.status(400).send("Gmail connection could not complete. Check Google OAuth settings, then reconnect from Integrations."); }
  });
}
export function flattenParts(part: GmailPart): GmailPart[] {
  return [part, ...(part.parts || []).flatMap(flattenParts)];
}
export function gmailText(part: GmailPart) {
  return flattenParts(part).filter(item => item.mimeType === "text/plain" && !item.filename).map(item => Buffer.from(item.body?.data || "", "base64url").toString("utf8")).join("\n").slice(0, 20000);
}
export async function syncGmail(user: User, input: { tradeId: number; query: string; pageToken?: string }) {
  requireConfig();
  const trade = await getTradeById(input.tradeId);
  if (!trade || !user.organizationId || trade.organizationId !== user.organizationId || (user.role === "trader" && trade.ownerId !== user.id)) throw new TRPCError({ code: "NOT_FOUND", message: "Trade not found in your workspace." });
  const token = await readGmailToken<Token>(user.id);
  if (!token || token.organizationId !== user.organizationId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Connect your Gmail account first." });
  if (syncing.has(user.id)) throw new TRPCError({ code: "CONFLICT", message: "A Gmail sync is already in progress." });
  const lease = databaseRuntimeEnabled() ? await acquireRuntimeLease("gmail-sync", String(user.id)) : null;
  if (databaseRuntimeEnabled() && !lease) throw new TRPCError({ code: "CONFLICT", message: "A Gmail sync is already in progress." });
  syncing.add(user.id);
  const maxAttachmentBytes = process.env.VERCEL === "1" ? 3_000_000 : 10_000_000;
  let imported = 0, duplicates = 0, skippedAttachments = 0, attachmentBytes = 0, attachmentCount = 0;
  try {
    const fresh = await tokenRequest({ refresh_token: token.refreshToken, grant_type: "refresh_token" });
    const listingUrl = new URL(`${endpoint}/messages`);
    listingUrl.search = new URLSearchParams({ q: input.query, maxResults: "10" }).toString();
    if (input.pageToken) listingUrl.searchParams.set("pageToken", input.pageToken);
    const listing = await gmailGet<{ messages?: Array<{ id: string }>; nextPageToken?: string }>(listingUrl.toString(), fresh.access_token);
    for (const entry of listing.messages || []) {
      const message = await gmailGet<{ payload: GmailPart }>(`${endpoint}/messages/${encodeURIComponent(entry.id)}?format=full`, fresh.access_token);
      const headers = message.payload.headers || [];
      const header = (name: string) => headers.find(item => item.name.toLowerCase() === name)?.value || "";
      const context = { provider: "gmail", gmailMessageId: entry.id, sender: header("from"), subject: header("subject"), body: gmailText(message.payload), receivedDate: header("date") };
      const retain = async (partId: string, fileName: string, rawPayload: unknown, stored?: { key: string; url: string }, mimeType?: string) => {
        const payloadHash = createHash("sha256").update(JSON.stringify([token.email, entry.id, partId, trade.id])).digest("hex");
        let saved: boolean;
        try { saved = await saveGmailReceipt({ organizationId: user.organizationId!, tradeId: trade.id, createdBy: user.id, payloadHash, fileName: fileName.slice(0, 255), rawPayload, fileKey: stored?.key, fileUrl: stored?.url, mimeType }); }
        catch (error) { if (stored) await storageDelete(stored.key); throw error; }
        if (saved) imported++; else { duplicates++; if (stored) await storageDelete(stored.key); }
      };
      const messageFile = await storagePut(`ingestion/${user.organizationId}/${trade.id}/message.txt`, `From: ${context.sender}\nSubject: ${context.subject}\nDate: ${context.receivedDate}\nGmail message: ${entry.id}\n\n${context.body}`, "text/plain");
      await retain("message", `${header("subject").slice(0, 240) || "Gmail message"}.txt`, context, messageFile, "text/plain");
      const parts = flattenParts(message.payload).filter(part => part.filename);
      for (const [index, part] of Array.from(parts.entries())) {
        if (!allowedAttachments.has(part.mimeType || "") || !part.body || (part.body.size || 0) > maxAttachmentBytes || attachmentCount >= 20 || attachmentBytes + (part.body.size || 0) > 30000000) { skippedAttachments++; continue; }
        const body = part.body.attachmentId ? await gmailGet<{ data: string }>(`${endpoint}/messages/${encodeURIComponent(entry.id)}/attachments/${encodeURIComponent(part.body.attachmentId)}`, fresh.access_token) : part.body;
        const buffer = Buffer.from(body.data || "", "base64url");
        if (!buffer.length || buffer.length > maxAttachmentBytes || attachmentBytes + buffer.length > 30000000) { skippedAttachments++; continue; }
        attachmentBytes += buffer.length;
        attachmentCount++;
        const stored = await storagePut(`ingestion/${user.organizationId}/${trade.id}/${part.filename!.replace(/[^a-zA-Z0-9._-]/g, "_")}`, buffer, part.mimeType);
        await retain(`attachment-${index}`, part.filename!, { ...context, body: undefined, attachmentName: part.filename }, stored, part.mimeType);
      }
    }
    if (imported) await appendTradeEvent({ tradeId: trade.id, actorId: user.id, eventType: "gmail.synced", title: "Gmail evidence imported", detail: `${imported} new message/attachment receipts retained for review.`, source: "gmail" });
    return { imported, duplicates, skippedAttachments, nextPageToken: listing.nextPageToken };
  } catch (error) {
    throw new TRPCError({ code: "BAD_GATEWAY", message: `${error instanceof Error ? error.message : "Gmail sync failed."} ${imported} new records retained; retry safely skips duplicates.` });
  } finally { syncing.delete(user.id); if (lease) await releaseRuntimeLease("gmail-sync", String(user.id), lease); }
}
export async function disconnectGmail(user: User) {
  if (syncing.has(user.id) || (databaseRuntimeEnabled() && await readRuntimeState("gmail-sync", String(user.id)))) throw new TRPCError({ code: "CONFLICT", message: "Wait for the current Gmail import to finish before disconnecting." });
  const token = await readGmailToken<Token>(user.id);
  if (token && token.organizationId !== user.organizationId) throw new TRPCError({ code: "FORBIDDEN", message: "Workspace mismatch." });
  let revoked = true;
  if (token) {
    try {
      const response = await fetch("https://oauth2.googleapis.com/revoke", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ token: token.refreshToken }), signal: AbortSignal.timeout(15000) });
      revoked = response.ok;
    } catch { revoked = false; }
  }
  await removeGmailToken(user.id);
  return { revoked };
}
