# Deploy and operate ARCWAY with Node.js

The repository includes CI, production startup validation, health checks, a persistent native scheduler, native PostgreSQL backup/restore tools, and optional Linux service templates. No Docker is needed. A public deployment still needs a hosting machine, domain, and production account configuration; these are not created by the code.

## Production configuration

1. Copy `.env.production.example` to `.env.production` (ignored by Git).
2. Set your Neon pooled `DATABASE_URL` and direct `DATABASE_MIGRATION_URL`.
3. Create the Clerk production instance, configure its DNS, and use matching live publishable keys for Vite and Express plus the live secret key. Set `APP_ORIGIN` and exact HTTPS `CLERK_AUTHORIZED_PARTIES`.
4. Add Gemini/Groq keys and model IDs available to your accounts. For Gmail, add OAuth credentials, the deployed callback URL, and your existing integration encryption key. Keep that encryption key in a separate secure backup; changing it makes retained Gmail tokens unreadable.
5. Set absolute persistent paths for uploads, integration tokens, evaluation reports, and backups. Create those directories with access restricted to the app's OS user.

Clerk production keys and origins follow its [official deployment guide](https://clerk.com/docs/guides/development/deployment/production). The publishable key is built into the browser JavaScript; rebuild when it changes. Never put server secrets in VITE_ variables. Development keys remain suitable for your current local app, but production startup deliberately rejects them.

## Build and run

Use Node.js 22 or newer and the pnpm version declared in `package.json`. Populate `.env.production` before building so the browser receives the production publishable key:

```sh
pnpm install --frozen-lockfile
node --env-file=.env.production node_modules/tsx/dist/cli.mjs scripts/check-production.ts
node --env-file=.env.production node_modules/drizzle-kit/bin.cjs migrate
pnpm build
node --env-file=.env.production node_modules/tsx/dist/cli.mjs scripts/backfill-document-evidence.ts --dry-run
node --env-file=.env.production node_modules/tsx/dist/cli.mjs scripts/backfill-document-evidence.ts
node --env-file=.env.production dist/index.js
```

Vite's production build loads `.env.production`; its publishable key must match the server. An existing HTTPS reverse proxy should forward your configured public domain to the app port. Keep the app's private directories outside the public web root. No hosting or proxy service is required to keep using `pnpm dev` locally.

For a Linux host, `deploy/arcway.service` is an optional systemd template. It assumes an unprivileged `arcway` OS user, application at `/opt/arcway`, environment file at `/etc/arcway/arcway.env`, Node at `/usr/bin/node`, and persistent data under `/var/lib/arcway`. Adjust paths to your host. Build and apply migrations before starting the service. Install the template into `/etc/systemd/system`, reload systemd, then enable/start it. This repository does not install OS services automatically.

`GET /api/health/live` checks the server process. `GET /api/health` checks database/schema access and all private data directories, returning 503 without internal details when unavailable. Production uses the configured port and exits on missing configuration rather than selecting a different port. Allow up to 15 seconds for a Neon connection cold start.

## Scheduling with Clerk

As a Reviewer, open **Monitoring**, set a six-field UTC cron (for example `0 */15 * * * *`), and activate it. Pause/resume uses the same retained task ID. The native worker polls every five seconds while the server runs. No Forge cookie, paid scheduler, or external account is needed.

Schedules/results live in Neon per workspace. PostgreSQL locks coordinate workers and manual runs. Missed ticks coalesce into one run after restart. Disabled schedules do no work; failures retain a redacted error and retry. Set `OPERATIONAL_SCHEDULER_ENABLED=false` for a web-only instance.

An optional external scheduler can POST `/api/scheduled/operationalSweep` with `Authorization: Bearer <SCHEDULER_SECRET>`, using a random secret of at least 32 characters. It runs only due enabled schedules. An empty secret disables external access while the native worker still runs. The endpoint does not accept Clerk user sessions or legacy cron cookies as scheduler credentials.

## Native backups

Install `pg_dump` and `pg_restore` from a PostgreSQL client version at least as new as your Neon server. Standard Windows installations under Program Files/PostgreSQL are detected automatically. `PG_DUMP_PATH` and `PG_RESTORE_PATH` can specify explicit executable paths. Use a direct Neon connection, as described in [Neon's export guide](https://neon.com/docs/manage/backup-pg-dump); the tool converts Neon pooler hostnames to their corresponding direct hostname.

Run `pnpm backup` locally, or with the deployed environment:

```sh
node --env-file=.env.production node_modules/tsx/dist/cli.mjs scripts/backup.ts
```

Each backup contains a custom-format PostgreSQL dump, snapshot-consistent row counts, immutable upload files, encrypted Gmail tokens, evaluation reports, and SHA-256 checksums. The dump precedes file copying so files referenced by that database snapshot are retained. No environment file or encryption key is copied. An incomplete backup has no completed manifest. Database credentials are passed through environment variables, not command arguments or logs.

Copy completed backups off the hosting machine to private storage you control. A directory on the app machine does not survive loss of that machine. Run backups before migrations and at a cadence suited to the data you can afford to recreate. Optional `deploy/arcway-backup.service` and `.timer` templates schedule a daily 02:00 UTC backup on Linux after you explicitly install/enable them. Their paths and OS user must match your deployment; no timer is silently installed. Backups are sensitive even though Gmail token contents are encrypted.

Verify hashes: `pnpm backup --verify=PATH_TO_BACKUP`.

For a restore drill, provision a **separate empty database**, set `RESTORE_DATABASE_URL` to it and `RESTORE_DATA_DIR` to a **separate empty directory**, then run:

```sh
pnpm backup:restore --backup=PATH_TO_BACKUP
```

The restore refuses the configured app database, non-empty targets, altered files and path escapes. `pg_restore` uses a single transaction. Table row counts must match before private files are copied. Configure a separate app instance with the restored database/directories and original integration encryption key. The restore tool never overwrites the running deployment's directories.

CI uses native PostgreSQL on its runner and performs migrations plus a real dump/restore drill, alongside TypeScript, automated tests and a production build. CI needs no live secrets or AI calls.

## Release acceptance

Check sign-in/workspace isolation, upload synthetic samples under `docs/samples/`, then verify original downloads, comparison provenance, correction history, refreshed consistency flags and retained preflight. Activate a short schedule, inspect its retained result, then restore the desired cadence. Run the AI benchmark for each configured provider and inspect failures instead of treating a synthetic score as production accuracy.

Restore a backup into a disposable target before trusting a deployment. Public hosting, HTTPS/DNS, live Clerk/Gmail settings and off-machine retention must be completed in that actual environment.
