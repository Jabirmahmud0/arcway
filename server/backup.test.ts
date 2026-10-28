import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { directBackupUrl, verifyBackup } from "./backup";

describe("backup integrity", () => {
  it("uses direct Neon endpoints without changing other providers", () => {
    expect(directBackupUrl("postgresql://user:password@ep-example-pooler.region.neon.tech/db").hostname).toBe("ep-example.region.neon.tech");
    expect(directBackupUrl("postgresql://user:password@other-pooler.example/db").hostname).toBe("other-pooler.example");
  });
  it("rejects altered files and traversal entries before a restore can connect", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "arcway-backup-"));
    const bytes = Buffer.from("synthetic archive");
    const manifest = { version: 1, files: [{ path: "database.dump", sha256: createHash("sha256").update(bytes).digest("hex") }], tables: [] };
    try {
      await writeFile(path.join(root, "database.dump"), bytes);
      await writeFile(path.join(root, "manifest.json"), JSON.stringify(manifest));
      expect((await verifyBackup(root)).version).toBe(1);
      await writeFile(path.join(root, "database.dump"), "tampered");
      await expect(verifyBackup(root)).rejects.toThrow("checksum");
      await writeFile(path.join(root, "manifest.json"), JSON.stringify({ ...manifest, files: [...manifest.files, { path: "../outside", sha256: "bad" }] }));
      await expect(verifyBackup(root)).rejects.toThrow();
    } finally { await rm(root, { recursive: true, force: true }); }
  });
});
