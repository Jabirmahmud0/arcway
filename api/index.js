import { DOMMatrix, ImageData, Path2D } from "@napi-rs/canvas";

// pdf.js uses createRequire at runtime. Load its native primitives explicitly so
// Vercel traces the Linux binding and ESM PDF parsing has the expected globals.
globalThis.DOMMatrix ??= DOMMatrix;
globalThis.ImageData ??= ImageData;
globalThis.Path2D ??= Path2D;

// Import after the PDF primitives are initialized. dist/vercel.js is built by
// build:vercel and contains the shared API without a persistent HTTP listener.
export default async function handler(req, res) {
  const api = await import("../dist/vercel.js");
  return api.default(req, res);
}
