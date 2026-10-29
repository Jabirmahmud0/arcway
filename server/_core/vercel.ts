import "dotenv/config";
import type { IncomingMessage, ServerResponse } from "node:http";
import { configureVercelEnvironment } from "./vercelEnvironment";
import { productionConfigurationErrors } from "./production";

configureVercelEnvironment();
let initialized: Promise<ReturnType<typeof import("./app").createApiApp>> | undefined;
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const errors = productionConfigurationErrors();
  if (errors.length) {
    res.writeHead(503, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    res.end(JSON.stringify({ error: "Server configuration is incomplete", details: errors }));
    return;
  }
  initialized ??= import("./app").then(module => module.createApiApp());
  try { const app = await initialized; return app(req, res); }
  catch { initialized = undefined; res.writeHead(503, { "Content-Type": "application/json" }); res.end(JSON.stringify({ error: "API initialization failed" })); }
}
