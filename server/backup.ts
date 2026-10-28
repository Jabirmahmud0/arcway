import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, writeFile, cp, stat, lstat, realpath } from "node:fs/promises";
import path from "node:path";
import { Pool, type PoolClient } from "pg";

type TableCount = { schema: string; name: string; rows: string };
type Manifest = { version: 1; createdAt: string; postgresVersion: string; tables: TableCount[]; files: Array<{ path: string; sha256: string }> };
const identifier = (value: string) => `"${value.replaceAll('"', '""')}"`;
const checksum = async (file: string) => createHash("sha256").update(await readFile(file)).digest("hex");

export function directBackupUrl(raw: string) {
  const url = new URL(raw);
  if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error("A PostgreSQL URL is required");
  if (url.hostname.endsWith(".neon.tech")) url.hostname = url.hostname.replace("-pooler.", ".");
  return url;
}

async function postgresCommand(binary: "pg_dump" | "pg_restore", args: string[], connection: URL, directory: string) {
  const env = { ...process.env, PGHOST: connection.hostname, PGPORT: connection.port || "5432", PGUSER: decodeURIComponent(connection.username), PGPASSWORD: decodeURIComponent(connection.password), PGDATABASE: decodeURIComponent(connection.pathname.slice(1)), PGSSLMODE: connection.searchParams.get("sslmode") || "require", PGCHANNELBINDING: connection.searchParams.get("channel_binding") || "prefer" };
  let executable = process.env[`${binary.toUpperCase()}_PATH`] || binary;
  if (executable === binary && process.platform === "win32") {
    const installed = path.join(process.env.ProgramFiles || "C:\\Program Files", "PostgreSQL");
    const versions = await readdir(installed).catch(() => [] as string[]);
    for (const version of versions.sort((a, b) => Number(b) - Number(a))) {
      const candidate = path.join(installed, version, "bin", `${binary}.exe`);
      if (await stat(candidate).catch(() => null)) { executable = candidate; break; }
    }
  }
  return new Promise<void>((resolve, reject) => {
    const child = spawn(executable, args, { env, cwd: directory, windowsHide: true, stdio: ["ignore", "ignore", "pipe"] });
    // Errors can contain connection details. Report only a generic command failure.
    let diagnostic = "";
    child.stderr.on("data", chunk => { diagnostic = (diagnostic + chunk.toString()).slice(-16_384); });
    child.on("error", () => reject(new Error(`${binary} could not start. Install compatible PostgreSQL client tools.`)));
    child.on("exit", code => {
      if (code === 0) return resolve();
      const category = /version mismatch|server version/i.test(diagnostic) ? "client/server version mismatch" : /password authentication/i.test(diagnostic) ? "database authentication failed" : /snapshot/i.test(diagnostic) ? "database snapshot unavailable" : /could not connect|connection.*failed|timeout/i.test(diagnostic) ? "database connection unavailable" : /permission denied/i.test(diagnostic) ? "file or database permission denied" : "archive command failed";
      reject(new Error(`${binary}: ${category}`));
    });
  });
}

async function counts(client: PoolClient): Promise<TableCount[]> {
  const { rows } = await client.query<{ schema: string; name: string }>("select table_schema as schema, table_name as name from information_schema.tables where table_schema in ('public', 'drizzle') and table_type = 'BASE TABLE' order by table_schema, table_name");
  const result: TableCount[] = [];
  for (const table of rows) {
    const { rows: [count] } = await client.query<{ count: string }>(`select count(*)::text as count from ${identifier(table.schema)}.${identifier(table.name)}`);
    result.push({ ...table, rows: count.count });
  }
  return result;
}

async function fileList(root: string, prefix = ""): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(path.join(root, prefix), { withFileTypes: true })) {
    const relative = path.join(prefix, entry.name);
    if (entry.isSymbolicLink()) throw new Error("Backup data must not contain symbolic links");
    if (entry.isDirectory()) files.push(...await fileList(root, relative));
    else if (entry.isFile()) files.push(relative);
  }
  return files;
}

export async function createBackup(options: { connectionString: string; outputRoot: string; sources: { uploads: string; integrations: string; evaluations: string } }) {
  const connection = directBackupUrl(options.connectionString);
  const directory = path.resolve(options.outputRoot, `arcway-${new Date().toISOString().replaceAll(":", "-")}-${randomUUID().slice(0, 8)}`);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const pool = new Pool({ connectionString: connection.href, connectionTimeoutMillis: 15_000 });
  try {
    const client = await pool.connect();
    let tables: TableCount[], postgresVersion: string;
    try {
      await client.query("begin isolation level repeatable read read only");
      const { rows: [snapshot] } = await client.query<{ snapshot: string; version: string }>("select pg_export_snapshot() as snapshot, current_setting('server_version') as version");
      postgresVersion = snapshot.version;
      tables = await counts(client);
      await postgresCommand("pg_dump", ["--format=custom", "--no-owner", "--no-acl", `--snapshot=${snapshot.snapshot}`, "--file=database.dump"], connection, directory);
      await client.query("commit");
    } catch (error) { await client.query("rollback").catch(() => {}); throw error; }
    finally { client.release(); }
    await postgresCommand("pg_restore", ["--list", "database.dump"], connection, directory);
    for (const [name, source] of Object.entries(options.sources)) {
      try {
        if (!(await lstat(source)).isDirectory()) throw new Error("Private data source must be a directory");
        await fileList(source); // Reject symlinks before following anything during copying.
        await cp(source, path.join(directory, name), { recursive: true, errorOnExist: true, force: false });
      } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    }
    const files = [];
    for (const file of await fileList(directory)) files.push({ path: file.split(path.sep).join("/"), sha256: await checksum(path.join(directory, file)) });
    const manifest: Manifest = { version: 1, createdAt: new Date().toISOString(), postgresVersion, tables, files };
    await writeFile(path.join(directory, "manifest.json"), JSON.stringify(manifest, null, 2), { flag: "wx", mode: 0o600 });
    return { directory, tables: tables.length, files: files.length };
  } finally { await pool.end(); }
}

export async function verifyBackup(directory: string): Promise<Manifest> {
  const root = path.resolve(directory);
  const actualRoot = await realpath(root);
  const manifest = JSON.parse(await readFile(path.join(root, "manifest.json"), "utf8")) as Manifest;
  if (manifest.version !== 1 || !Array.isArray(manifest.files) || !Array.isArray(manifest.tables)) throw new Error("Unsupported backup manifest");
  if (!manifest.files.some(file => file.path === "database.dump")) throw new Error("Database dump is missing");
  const listed = manifest.files.map(file => file.path).sort();
  const present = (await fileList(root)).filter(file => file !== "manifest.json").map(file => file.split(path.sep).join("/")).sort();
  if (new Set(listed).size !== listed.length || JSON.stringify(listed) !== JSON.stringify(present)) throw new Error("Backup contains missing, duplicate, or unlisted files");
  for (const file of manifest.files) {
    const target = path.resolve(root, file.path);
    if (!/^(?:database\.dump|(?:uploads|integrations|evaluations)\/[^\\]+)$/.test(file.path) || !target.startsWith(root + path.sep) || !(await realpath(target)).startsWith(actualRoot + path.sep) || !(await lstat(target)).isFile() || await checksum(target) !== file.sha256) throw new Error("Backup checksum or path validation failed");
  }
  return manifest;
}

export async function restoreBackup(options: { directory: string; connectionString: string; dataDirectory: string }) {
  const directory = path.resolve(options.directory);
  const data = path.resolve(options.dataDirectory);
  if (data === directory || data.startsWith(directory + path.sep) || directory.startsWith(data + path.sep)) throw new Error("Restore data must be separate from the backup");
  const manifest = await verifyBackup(directory);
  await mkdir(data, { recursive: true, mode: 0o700 });
  if ((await readdir(data)).length) throw new Error("Restore data directory must be empty");
  const connection = directBackupUrl(options.connectionString);
  const pool = new Pool({ connectionString: connection.href, connectionTimeoutMillis: 15_000 });
  try {
    const client = await pool.connect();
    try {
      if ((await counts(client)).length) throw new Error("Restore target must be an empty, separate database");
      await postgresCommand("pg_restore", ["--no-owner", "--no-acl", "--single-transaction", "--exit-on-error", "--dbname", decodeURIComponent(connection.pathname.slice(1)), "database.dump"], connection, directory);
      const restored = await counts(client);
      if (JSON.stringify(restored) !== JSON.stringify(manifest.tables)) throw new Error("Restored row counts do not match the backup snapshot");
    } finally { client.release(); }
    for (const name of ["uploads", "integrations", "evaluations"]) {
      const source = path.join(directory, name);
      if (await stat(source).catch(() => null)) await cp(source, path.join(data, name), { recursive: true, errorOnExist: true, force: false });
    }
    return { tables: manifest.tables.length, dataDirectory: data, verified: true };
  } finally { await pool.end(); }
}
