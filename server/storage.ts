import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { ENV } from "./_core/env";
import { databaseRuntimeEnabled, putRuntimeState, readRuntimeState, removeRuntimeState } from "./runtimeState";

// Private disk storage; never mounted as a public static directory.
export function storagePath(key: string) {
  if (!key || key.length > 500 || key.split("/").some(part => !/^[a-zA-Z0-9_.-]+$/.test(part) || part === "." || part === "..")) throw new Error("Invalid storage key");
  const root = path.resolve(process.env.STORAGE_LOCAL_DIR || ".data/uploads");
  const file = path.resolve(root, key);
  if (!file.startsWith(root + path.sep)) throw new Error("Invalid storage key");
  return file;
}
export async function storagePut(relKey: string, data: Buffer | Uint8Array | string, contentType = "application/octet-stream"): Promise<{ key: string; url: string }> {
  const extension = path.extname(relKey).replace(/[^a-zA-Z0-9.]/g, "").slice(0, 12);
  const key = `${relKey.split("/").slice(0, -1).join("/")}/${randomUUID()}${extension}`;
  const file = storagePath(key);
  if (databaseRuntimeEnabled()) {
    const bytes = Buffer.from(data);
    await putRuntimeState("private-file", key, { base64: bytes.toString("base64"), contentType, size: bytes.length });
    return { key, url: `/api/storage/${key}` };
  }
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, data, { flag: "wx", mode: 0o600 });
  try { await writeFile(file + ".metadata.json", JSON.stringify({ contentType }), { flag: "wx", mode: 0o600 }); }
  catch (error) { await unlink(file); throw error; }
  return { key, url: `/api/storage/${key}` };
}
export async function storageRead(key: string) {
  const file = storagePath(key);
  if (databaseRuntimeEnabled()) {
    const value = await readRuntimeState<{ base64: string; contentType: string }>("private-file", key);
    if (!value) throw Object.assign(new Error("File not found"), { code: "ENOENT" });
    return { buffer: Buffer.from(value.base64, "base64"), contentType: value.contentType };
  }
  const [buffer, metadata] = await Promise.all([readFile(file), readFile(file + ".metadata.json", "utf8")]);
  return { buffer, contentType: String(JSON.parse(metadata).contentType) };
}
export async function storageDelete(key: string) {
  const file = storagePath(key);
  if (databaseRuntimeEnabled()) return removeRuntimeState("private-file", key);
  await Promise.all([file, file + ".metadata.json"].map(name => unlink(name).catch(error => { if (error.code !== "ENOENT") throw error; })));
}
export async function storageGet(key: string) {
  storagePath(key);
  return { key, url: `/api/storage/${key}` };
}
// Only used for older Forge-backed files.
export async function storageGetSignedUrl(key: string): Promise<string> {
  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) throw new Error("Legacy storage is not configured");
  const url = new URL("v1/storage/presign/get", ENV.forgeApiUrl.replace(/\/+$/, "") + "/");
  url.searchParams.set("path", key);
  const response = await fetch(url, { headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error("Legacy storage unavailable");
  const result = await response.json() as { url: string };
  if (!result.url?.startsWith("https://")) throw new Error("Invalid legacy storage response");
  return result.url;
}
