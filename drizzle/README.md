# PostgreSQL / Neon migrations

The current application uses PostgreSQL through Drizzle and node-postgres (`pg`).

- `schema.ts`: current PostgreSQL schema, native enums, JSONB, numeric values, and timestamps with time zone.
- `postgresql/`: active, checked-in PostgreSQL migration history and snapshots (47 tables in the baseline).
- Root `0000_*.sql` through `0019_*.sql` and `meta/`: legacy MySQL history; preserved for reference and never used by the current configuration.

## Configure later

Put the pooled Neon connection string in `.env` as `DATABASE_URL`. Optionally put the direct connection string in `DATABASE_MIGRATION_URL`. Both should retain the SSL options from Neon Connect. No Neon management API key is needed.

Once credentials are configured:

```sh
pnpm db:migrate
pnpm dev
```

For subsequent schema changes, run `pnpm db:generate`, review the generated migration, and then `pnpm db:migrate`. Generation works without credentials. Applying migrations requires a connection string. `pnpm db:push` is a compatibility alias for applying checked-in migrations; it does not perform an unreviewed schema push.

Use a new Neon database or branch for this baseline. If migrating existing MySQL data, export and transform the records separately, preserve IDs and foreign-key order, and reset PostgreSQL sequences after importing explicit IDs. Do not run the legacy MySQL SQL against PostgreSQL.

`updatedAt` columns use Drizzle's application update hook. Updates made through Drizzle refresh them automatically; direct SQL writers must set `updatedAt` themselves. Serial IDs are returned using PostgreSQL `RETURNING`, and upserts name their unique conflict targets explicitly.

## Local validation

`pnpm test` includes `server/postgresql.integration.test.ts`, which applies the real migrations to an embedded PostgreSQL engine (PGlite). It verifies reruns, table creation, generated IDs, decimal precision, time-zone handling, JSONB, conflict updates, routing row counts, native enums, and foreign keys without contacting Neon.
