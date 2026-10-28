import "dotenv/config";
import path from "node:path";
import { createBackup, verifyBackup } from "../server/backup";
try {
  const verify = process.argv.find(value => value.startsWith("--verify="))?.slice("--verify=".length);
  if (verify) { const manifest = await verifyBackup(verify); console.log(JSON.stringify({ verified: true, tables: manifest.tables.length, files: manifest.files.length })); }
  else {
    const result = await createBackup({ connectionString: process.env.BACKUP_DATABASE_URL || process.env.DATABASE_MIGRATION_URL || process.env.DATABASE_URL || "", outputRoot: process.env.BACKUP_DIR || ".data/backups", sources: { uploads: path.resolve(process.env.STORAGE_LOCAL_DIR || ".data/uploads"), integrations: path.resolve(process.env.INTEGRATION_TOKEN_DIR || ".data/integrations"), evaluations: path.resolve(process.env.AI_EVALUATION_DIR || ".data/evaluations") } });
    console.log(JSON.stringify(result));
  }
} catch (error) { const message = error instanceof Error && /^(pg_dump|pg_restore): [a-z /]+$/.test(error.message) ? ` ${error.message}.` : ""; console.error(`Backup failed.${message} Check PostgreSQL tools, direct database access, and private data paths. No restore was performed.`); process.exitCode = 1; }
