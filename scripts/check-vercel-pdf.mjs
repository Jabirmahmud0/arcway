import assert from "node:assert/strict";

// Exercise the same entry and native PDF dependencies used by the deployed API.
await import("../api/index.js");
const { PDFParse } = await import("pdf-parse");
const marker = "ARCWAY PDF runtime verification";
const stream = `BT /F1 12 Tf 40 100 Td (${marker}) Tj ET`;
const objects = [
  "<< /Type /Catalog /Pages 2 0 R >>",
  "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 200] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
];
let pdf = "%PDF-1.4\n";
const offsets = [0];
objects.forEach((object, index) => {
  offsets.push(Buffer.byteLength(pdf));
  pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
});
const xref = Buffer.byteLength(pdf);
pdf += `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
pdf += offsets.slice(1).map(offset => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
pdf += `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
const parser = new PDFParse({ data: Buffer.from(pdf) });
try {
  const result = await parser.getText();
  assert.ok(result.text.includes(marker), "The deployed PDF runtime must extract actual document text.");
  console.log("Vercel PDF runtime: native binding, worker, and text extraction passed.");
} finally {
  await parser.destroy();
}
