import type { Express } from "express";
import { sdk } from "./sdk";
import { getStoredFileForUser } from "../db";
import { storageGetSignedUrl, storageRead } from "../storage";

export function registerStorageProxy(app: Express) {
  for (const route of ["/api/storage/*", "/manus-storage/*"]) app.get(route, async (req, res) => {
    res.set({ "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "sandbox; default-src 'none'" });
    let user;
    try { user = await sdk.authenticateRequest(req); }
    catch { res.status(401).send("Sign in to open this document."); return; }
    try {
      const key = (req.params as Record<string, string>)[0];
      const record = await getStoredFileForUser(key, user);
      if (!record) { res.status(404).send("File not found in your workspace."); return; }
      if (route === "/manus-storage/*") { res.redirect(307, await storageGetSignedUrl(key)); return; }
      const { buffer, contentType } = await storageRead(key);
      res.type(contentType);
      res.attachment(record.fileName || "document");
      res.send(buffer);
    } catch (error) {
      const missing = (error as NodeJS.ErrnoException).code === "ENOENT";
      res.status(missing ? 404 : 503).send(missing ? "Stored file is missing." : "Document storage is temporarily unavailable.");
    }
  });
}
