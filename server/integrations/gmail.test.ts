import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const fixtures = vi.hoisted(() => ({ userId: 1, trade: { id: 10, reference: "AR-TEST", ownerId: 1, organizationId: 7 }, receipts: new Set<string>() }));
vi.mock("../db", () => ({ getTradeById: vi.fn(async () => fixtures.trade), saveGmailReceipt: vi.fn(async (input: { payloadHash: string }) => { if (fixtures.receipts.has(input.payloadHash)) return false; fixtures.receipts.add(input.payloadHash); return true; }), appendTradeEvent: vi.fn() }));
vi.mock("./tokenVault", () => ({ readGmailToken: vi.fn(async () => ({ refreshToken: "fixture-refresh", organizationId: 7, email: "fixture@example.com" })), writeGmailToken: vi.fn(), removeGmailToken: vi.fn() }));
vi.mock("../storage", () => ({ storagePut: vi.fn(async () => ({ key: "ingestion/7/10/fixture.txt", url: "/api/storage/ingestion/7/10/fixture.txt" })), storageDelete: vi.fn() }));
import { beginGmail, consumeGmailState, gmailText, syncGmail } from "./gmail";
import { saveGmailReceipt } from "../db";
import { storageDelete } from "../storage";
const user = { id: 1, role: "trader" as const, organizationId: 7 };
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
beforeEach(() => {
  fixtures.receipts.clear(); vi.clearAllMocks();
  vi.stubEnv("GMAIL_CLIENT_ID", "fixture-client"); vi.stubEnv("GMAIL_CLIENT_SECRET", "fixture-secret"); vi.stubEnv("GMAIL_REDIRECT_URI", "http://localhost:3001/api/integrations/gmail/callback"); vi.stubEnv("INTEGRATION_ENCRYPTION_KEY", "a".repeat(64));
});
describe("Gmail connector", () => {
  it("requests only read access and binds one-time state to the current user and workspace", () => {
    const url = new URL(beginGmail(user).url);
    expect(url.origin).toBe("https://accounts.google.com");
    expect(url.searchParams.get("scope")).toBe("https://www.googleapis.com/auth/gmail.readonly");
    expect(url.searchParams.get("access_type")).toBe("offline");
    const state = url.searchParams.get("state")!;
    expect(() => consumeGmailState(state, { ...user, id: 2 })).toThrow();
    expect(() => consumeGmailState(state, { ...user, organizationId: 8 })).toThrow();
    consumeGmailState(state, user);
    expect(() => consumeGmailState(state, user)).toThrow();
  });
  it("does not import a mailbox into an unrelated trade", async () => {
    const network = vi.fn(); vi.stubGlobal("fetch", network);
    await expect(syncGmail({ ...user, id: 2 }, { tradeId: 10, query: "AR-TEST" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(network).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
  it("decodes nested plain-text MIME without rendering HTML", () => {
    expect(gmailText({ parts: [{ mimeType: "text/html", body: { data: Buffer.from("<script>bad</script>").toString("base64url") } }, { parts: [{ mimeType: "text/plain", body: { data: Buffer.from("Order received").toString("base64url") } }] }] })).toBe("Order received");
  });
  it("imports real API-shaped messages and attachments, then skips duplicates", async () => {
    const network = vi.fn(async (input: string | URL) => {
      const url = String(input);
      const result = url.includes("oauth2.googleapis.com/token") ? { access_token: "fixture-access" }
        : url.includes("/attachments/") ? { data: Buffer.from("invoice attachment").toString("base64url") }
        : url.includes("/messages/message-1") ? { payload: { headers: [{ name: "From", value: "sender@example.com" }, { name: "Subject", value: "AR-TEST invoice" }], parts: [{ mimeType: "text/plain", body: { data: Buffer.from("Please review this invoice.").toString("base64url") } }, { filename: "invoice.txt", mimeType: "text/plain", body: { size: 18, attachmentId: "attachment-1" } }] } }
        : { messages: [{ id: "message-1" }], nextPageToken: "page-two" };
      return new Response(JSON.stringify(result), { status: 200 });
    });
    vi.stubGlobal("fetch", network);
    try {
      const first = await syncGmail(user, { tradeId: 10, query: "AR-TEST" });
      expect(first).toMatchObject({ imported: 2, duplicates: 0, nextPageToken: "page-two" });
      expect(saveGmailReceipt).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 7, tradeId: 10, createdBy: 1, rawPayload: expect.objectContaining({ provider: "gmail", gmailMessageId: "message-1" }) }));
      const repeated = await syncGmail(user, { tradeId: 10, query: "AR-TEST" });
      expect(repeated).toMatchObject({ imported: 0, duplicates: 2 });
      expect(storageDelete).toHaveBeenCalledTimes(2);
      expect(network.mock.calls.every(([url]) => String(url).startsWith("https://oauth2.googleapis.com/") || String(url).startsWith("https://gmail.googleapis.com/"))).toBe(true);
    } finally { vi.unstubAllGlobals(); }
  });
});
