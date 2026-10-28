import "dotenv/config";
import { directBackupUrl, restoreBackup } from "../server/backup";
const directory = process.argv.find(value => value.startsWith("--backup="))?.slice("--backup=".length);
try {
  if (!directory || !process.env.RESTORE_DATABASE_URL || !process.env.RESTORE_DATA_DIR) throw new Error("Missing restore settings");
  const target = directBackupUrl(process.env.RESTORE_DATABASE_URL);
  const source = process.env.DATABASE_URL ? directBackupUrl(process.env.DATABASE_URL) : null;
  if (source && target.host === source.host && target.pathname === source.pathname) throw new Error("The restore target must be separate from the app database");
  console.log(JSON.stringify(await restoreBackup({ directory, connectionString: process.env.RESTORE_DATABASE_URL, dataDirectory: process.env.RESTORE_DATA_DIR })));
} catch { console.error("Restore refused or failed. Use --backup=PATH, a separate empty RESTORE_DATABASE_URL, and an empty RESTORE_DATA_DIR. Check backup hashes and PostgreSQL client compatibility."); process.exitCode = 1; }
