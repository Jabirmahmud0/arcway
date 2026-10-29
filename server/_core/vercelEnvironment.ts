/** Use deployment-owned URLs, never request Host headers, for auth allowlists. */
export function configureVercelEnvironment(env: NodeJS.ProcessEnv = process.env) {
  if (env.VERCEL !== "1") return;
  const deployment = env.VERCEL_URL ? `https://${env.VERCEL_URL}` : null;
  const production = env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : deployment;
  if ((!env.APP_ORIGIN || /localhost|127\.0\.0\.1/.test(env.APP_ORIGIN)) && production) env.APP_ORIGIN = production;
  const parties = [env.APP_ORIGIN, deployment, ...(env.CLERK_AUTHORIZED_PARTIES || "").split(",")].filter((origin): origin is string => {
    if (!origin) return false;
    try { const url = new URL(origin); return url.protocol === "https:" && url.origin === origin; } catch { return false; }
  });
  env.CLERK_AUTHORIZED_PARTIES = Array.from(new Set(parties)).join(",");
  if ((!env.GMAIL_REDIRECT_URI || /localhost|127\.0\.0\.1/.test(env.GMAIL_REDIRECT_URI)) && env.APP_ORIGIN) env.GMAIL_REDIRECT_URI = `${env.APP_ORIGIN}/api/integrations/gmail/callback`;
  env.RUNTIME_STATE_BACKEND = "postgres";
  env.OPERATIONAL_SCHEDULER_ENABLED = "false";
}
