import "dotenv/config";
import { backfillDocumentEvidence } from "../server/db";

try {
  // npm.ps1 may consume the separator and expose --dry-run as npm configuration.
  const summary = await backfillDocumentEvidence({ dryRun: process.argv.includes("--dry-run") || process.env.npm_config_dry_run === "true" });
  console.log(JSON.stringify(summary));
  process.exit(0);
} catch (error) {
  let cause = error as { cause?: unknown; code?: string; message?: string };
  for (let depth = 0; depth < 5 && cause?.cause; depth++) cause = cause.cause as typeof cause;
  const code = typeof cause?.code === "string" && /^[A-Z0-9_]+$/.test(cause.code) ? cause.code
    : /timeout/i.test(cause?.message ?? "") ? "CONNECTION_TIMEOUT" : "DATABASE_ERROR";
  console.error(`Document evidence backfill failed (${code}). Check database availability and retry; committed documents are safe to rerun.`);
  process.exit(1);
}
