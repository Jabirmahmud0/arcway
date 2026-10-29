import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { putRuntimeState } from "../server/runtimeState";

// Administrative, one-time copy. Local source files are never removed.
const counts = { files: 0, tokens: 0, evaluations: 0 };
async function walk(root: string, prefix = ""): Promise<string[]> {
  const entries = await readdir(path.join(root, prefix), { withFileTypes: true }).catch(error => { if (error.code === "ENOENT") return []; throw error; });
  const result: string[] = [];
  for (const entry of entries) {
    if (entry.isSymbolicLink()) throw new Error("Runtime migration does not follow symbolic links");
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) result.push(...await walk(root, relative));
    else result.push(relative);
  }
  return result;
}
try {
  const uploads = path.resolve(process.env.STORAGE_LOCAL_DIR || ".data/uploads");
  for (const file of await walk(uploads)) {
    if (!file.endsWith(".metadata.json")) continue;
    const key = file.slice(0, -".metadata.json".length).split(path.sep).join("/");
    if (!key.split("/").every(part => /^[a-zA-Z0-9_.-]+$/.test(part) && part !== "." && part !== "..")) throw new Error("Invalid private file path");
    const metadata = JSON.parse(await readFile(path.join(uploads, file), "utf8"));
    const bytes = await readFile(path.join(uploads, file.slice(0, -".metadata.json".length)));
    await putRuntimeState("private-file", key, { base64: bytes.toString("base64"), contentType: metadata.contentType, size: bytes.length });
    counts.files++;
  }
  const tokens = path.resolve(process.env.INTEGRATION_TOKEN_DIR || ".data/integrations");
  for (const file of await walk(tokens)) {
    const match = /^gmail-(\d+)\.json$/.exec(file);
    if (!match) continue;
    const encrypted = JSON.parse(await readFile(path.join(tokens, file), "utf8"));
    await putRuntimeState("gmail-token", match[1], encrypted);
    counts.tokens++;
  }
  const evaluations = path.resolve(process.env.AI_EVALUATION_DIR || ".data/evaluations");
  for (const file of await walk(evaluations)) {
    const match = /^(\d+)[/\\]([^/\\]+)\.json$/.exec(file);
    if (!match) continue;
    const report = JSON.parse(await readFile(path.join(evaluations, file), "utf8"));
    if (!report.id || !report.suite) continue;
    await putRuntimeState(match[2] === "latest" ? "ai-latest" : "ai-report", match[2] === "latest" ? match[1] : `${match[1]}:${report.id}`, report);
    counts.evaluations++;
  }
  console.log(JSON.stringify(counts));
  process.exit(0);
} catch { console.error("Runtime migration failed; local originals are unchanged. Retry after checking the database migration."); process.exit(1); }
