import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { storagePut, storageRead, storagePath } from "./storage";
import { decodeUpload } from "./uploadValidation";
import { seal, unseal, writeGmailToken, readGmailToken, removeGmailToken } from "./integrations/tokenVault";

let root: string;
beforeEach(async () => { await mkdir(".data/tests", { recursive: true }); root = await mkdtemp(path.resolve(".data/tests/arcway-files-")); vi.stubEnv("STORAGE_LOCAL_DIR", path.join(root, "uploads")); vi.stubEnv("INTEGRATION_TOKEN_DIR", path.join(root, "tokens")); vi.stubEnv("INTEGRATION_ENCRYPTION_KEY", "a".repeat(64)); });
afterEach(async () => { vi.unstubAllEnvs(); await rm(root, { recursive: true, force: true }); });
describe("private document storage", () => {
  it("retains exact bytes using immutable unique keys", async () => {
    const first = await storagePut("trades/1/invoice/invoice.txt", "invoice one", "text/plain");
    const second = await storagePut("trades/1/invoice/invoice.txt", "invoice two", "text/plain");
    expect(first.key).not.toBe(second.key);
    expect(first.url).toBe(`/api/storage/${first.key}`);
    expect((await storageRead(first.key)).buffer.toString()).toBe("invoice one");
    expect((await storageRead(second.key)).buffer.toString()).toBe("invoice two");
  });
  it.each(["../secret", "/etc/passwd", "trades/../../.env", "trades\\secret", "C:/secret", "trades//file", "trades/%2e%2e/file"])("rejects unsafe storage key %s", key => {
    expect(() => storagePath(key)).toThrow("Invalid storage key");
  });
  it("rejects forged file types, invalid encoding, and oversized files", () => {
    expect(() => decodeUpload(Buffer.from("not a PDF").toString("base64"), "application/pdf")).toThrow("file type");
    expect(() => decodeUpload("not valid base64!", "text/plain")).toThrow("encoding");
    expect(() => decodeUpload(Buffer.alloc(10000001, 65).toString("base64"), "text/plain")).toThrow("10 MB");
    expect(decodeUpload(Buffer.from("%PDF-1.7\ntest").toString("base64"), "application/pdf").length).toBeGreaterThan(0);
  });
});
describe("Gmail token vault", () => {
  it("encrypts credentials and detects tampering", () => {
    const envelope = seal({ refreshToken: "private-refresh-token" });
    expect(JSON.stringify(envelope)).not.toContain("private-refresh-token");
    expect(unseal(envelope)).toEqual({ refreshToken: "private-refresh-token" });
    expect(() => unseal({ ...envelope, tag: "0".repeat(32) })).toThrow();
  });
  it("keeps tokens scoped to the connecting account and can remove them", async () => {
    await writeGmailToken(1, { refreshToken: "secret" });
    expect(await readGmailToken(2)).toBeNull();
    expect(await readGmailToken(1)).toEqual({ refreshToken: "secret" });
    await removeGmailToken(1);
    expect(await readGmailToken(1)).toBeNull();
  });
});
