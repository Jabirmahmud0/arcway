# Vercel deployment

`vercel.json` publishes only `dist/public`, routes `/api/*` to a Node.js function, and sends application routes to the SPA. The server bundle is not public static output. `build:vercel` bundles internal TypeScript aliases before Vercel traces the function's dependencies.

Vercel uses the existing Neon database for private file bytes, encrypted Gmail refresh tokens, single-use OAuth state, cross-instance leases, and AI evaluation reports. Local directories and a permanently running server are not required. Apply the additive migration with `pnpm db:migrate` before deploying. `scripts/migrate-runtime-state.ts` can copy local private data into Neon without removing originals. Uploaded data counts toward database storage usage; this adapter is intended for a bounded demo/MVP workload.

The included configuration explicitly selects `ARCWAY_DEPLOYMENT_MODE=demo`, allowing the existing Clerk development instance while retaining Clerk authentication and workspace/role checks. Use `ARCWAY_DEPLOYMENT_MODE=production` with matching live keys and a configured Clerk production domain for a production launch. Demo mode is not an authentication bypass.

Required environment values: `DATABASE_URL`, `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and an API key for the selected AI provider. The publishable keys must match. Keep every secret outside the VITE_ namespace. Existing Gemini/Groq model settings are retained.

Set `APP_ORIGIN` and `CLERK_AUTHORIZED_PARTIES` to the deployed HTTPS origin. When omitted or still local, deployment-owned Vercel URL variables supply the hosted origins; request Host headers are never trusted for this. Gmail requires its existing OAuth credentials, the original `INTEGRATION_ENCRYPTION_KEY`, and the hosted callback URL in both the app and Google's authorized redirect URIs. A retained existing Gmail connection can refresh without another callback.

The native interval worker is disabled on Vercel. The included cron checks due workspace schedules daily at 00:00 UTC and authenticates with `CRON_SECRET`. Manual Reviewer sweeps remain available. A faster desired workspace cron does not make this daily host invocation more frequent; configure a suitable external trigger or a different supported Vercel cron cadence if needed.

Browser and Gmail attachment uploads are capped at 3 MB on Vercel so base64 tRPC requests remain below the function request-size ceiling. Native Node hosts retain their 10 MB limit. Mutation batching is disabled to avoid combining multiple uploads into one oversized request. Provider retries are bounded on Vercel so pinned five-case benchmarks fit the function time budget.

Deploy using the existing linked project with `vercel --prod`, or push the repository's Vercel configuration to its connected Git branch. A frontend-only build is insufficient: the `/api/index.js` function and generated backend must also be deployed. Check `/`, a direct route such as `/trades`, `/api/health`, and protected API/download responses after deployment.

Native PostgreSQL backups include the runtime table, so database-backed file/token state is captured in its exported snapshot. Keep the integration encryption key in your separate secret backup. Test restores in an isolated database before relying on a public deployment.
