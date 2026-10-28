import "dotenv/config";
import express from "express";
import { clerkMiddleware } from "@clerk/express";
import { ENV } from "./env";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic } from "./static";
import { runDueOperationalSchedules } from "../db";
import { startOperationalScheduler } from "../operationalSchedule";
import { registerSchedulerRoutes } from "./schedulerRoutes";
import { productionConfigurationErrors } from "./production";
import { preparePrivateDataDirectories, registerHealthRoutes } from "./health";
import { registerGmailRoutes } from "../integrations/gmail";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const errors = productionConfigurationErrors();
  if (errors.length) throw new Error(`Production configuration is incomplete:\n${errors.join("\n")}`);
  await preparePrivateDataDirectories();
  const app = express();
  app.disable("x-powered-by");
  app.use((_req, res, next) => { res.setHeader("X-Content-Type-Options", "nosniff"); res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin"); next(); });
  registerHealthRoutes(app);
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerSchedulerRoutes(app, runDueOperationalSchedules);
  if (ENV.clerkEnabled) {
    if (!ENV.clerkSecretKey || !ENV.clerkPublishableKey) throw new Error("Both Clerk public and secret keys must be configured.");
    app.use(["/api", "/manus-storage"], clerkMiddleware({ secretKey: ENV.clerkSecretKey, publishableKey: ENV.clerkPublishableKey, authorizedParties: ENV.clerkAuthorizedParties }));
  }
  registerStorageProxy(app);
  registerGmailRoutes(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    const { setupVite } = await import("./vite.js");
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = ENV.isProduction ? preferredPort : await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
  const stopScheduler = process.env.OPERATIONAL_SCHEDULER_ENABLED === "false" ? () => {} : startOperationalScheduler(runDueOperationalSchedules);
  for (const signal of ["SIGTERM", "SIGINT"] as const) process.once(signal, () => { stopScheduler(); server.close(() => process.exit(0)); });
}

startServer().catch(error => { console.error(error instanceof Error ? error.message : "Server startup failed"); process.exitCode = 1; });
