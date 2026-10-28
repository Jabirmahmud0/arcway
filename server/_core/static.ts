import express, { type Express } from "express";
import path from "node:path";
import { existsSync } from "node:fs";

export function serveStatic(app: Express) {
  const root = path.resolve(import.meta.dirname, "public");
  if (!existsSync(path.join(root, "index.html"))) throw new Error("Browser build is missing. Run the build command before starting production.");
  app.use(express.static(root, { index: false }));
  app.use("/api", (_req, res) => res.status(404).json({ error: "API route not found" }));
  app.get("*", (_req, res) => res.sendFile(path.join(root, "index.html")));
}
