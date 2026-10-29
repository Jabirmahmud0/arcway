import express from "express";
import { clerkMiddleware } from "@clerk/express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { ENV } from "./env";
import { registerHealthRoutes } from "./health";
import { registerSchedulerRoutes } from "./schedulerRoutes";
import { registerStorageProxy } from "./storageProxy";
import { registerGmailRoutes } from "../integrations/gmail";
import { registerOAuthRoutes } from "./oauth";
import { runDueOperationalSchedules } from "../db";
import { clearExpiredRuntimeState, databaseRuntimeEnabled } from "../runtimeState";
import { appRouter } from "../routers";
import { createContext } from "./context";

export function createApiApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use((_req, res, next) => { res.setHeader("X-Content-Type-Options", "nosniff"); res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin"); next(); });
  registerHealthRoutes(app);
  app.use(express.json({ limit: process.env.VERCEL === "1" ? "4mb" : "50mb" }));
  app.use(express.urlencoded({ limit: "4mb", extended: true }));
  registerSchedulerRoutes(app, async () => {
    const result = await runDueOperationalSchedules();
    if (databaseRuntimeEnabled()) await clearExpiredRuntimeState();
    return result;
  });
  if (ENV.clerkEnabled) {
    if (!ENV.clerkSecretKey || !ENV.clerkPublishableKey) throw new Error("Both Clerk public and secret keys must be configured.");
    app.use(["/api", "/manus-storage"], clerkMiddleware({ secretKey: ENV.clerkSecretKey, publishableKey: ENV.clerkPublishableKey, authorizedParties: ENV.clerkAuthorizedParties }));
  }
  registerStorageProxy(app);
  registerGmailRoutes(app);
  registerOAuthRoutes(app);
  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));
  return app;
}
