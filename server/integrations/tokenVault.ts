import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { mkdir, readFile, rename, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

function encryptionKey() {
  const key = Buffer.from(process.env.INTEGRATION_ENCRYPTION_KEY || "", "hex");
  if (key.length !== 32) throw new Error("Set INTEGRATION_ENCRYPTION_KEY to 64 hexadecimal characters.");
  return key;
}
function tokenPath(userId: number) {
  if (!Number.isSafeInteger(userId) || userId < 1) throw new Error("Invalid user");
  return path.resolve(process.env.INTEGRATION_TOKEN_DIR || ".data/integrations", `gmail-${userId}.json`);
}
export function seal(value: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return { iv: iv.toString("hex"), tag: cipher.getAuthTag().toString("hex"), data: encrypted.toString("hex") };
}
export function unseal<T>(value: ReturnType<typeof seal>): T {
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(value.iv, "hex"));
  decipher.setAuthTag(Buffer.from(value.tag, "hex"));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(value.data, "hex")), decipher.final()]).toString("utf8"));
}
export async function readGmailToken<T>(userId: number): Promise<T | null> {
  try { return unseal<T>(JSON.parse(await readFile(tokenPath(userId), "utf8"))); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
}
export async function writeGmailToken(userId: number, token: unknown) {
  const file = tokenPath(userId);
  await mkdir(path.dirname(file), { recursive: true });
  const temp = file + `.${randomBytes(8).toString("hex")}.tmp`;
  await writeFile(temp, JSON.stringify(seal(token)), { flag: "wx", mode: 0o600 });
  await rename(temp, file);
}
export async function removeGmailToken(userId: number) {
  await unlink(tokenPath(userId)).catch(error => { if (error.code !== "ENOENT") throw error; });
}
