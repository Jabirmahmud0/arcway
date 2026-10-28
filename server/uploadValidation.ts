import { TRPCError } from "@trpc/server";

export function decodeUpload(base64: string, mimeType: string) {
  if (base64.length > 13_333_336) throw new TRPCError({ code: "BAD_REQUEST", message: "Files must be between 1 byte and 10 MB." });
  if (base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) throw new TRPCError({ code: "BAD_REQUEST", message: "File encoding is invalid." });
  const buffer = Buffer.from(base64, "base64");
  if (!buffer.length || buffer.length > 10_000_000) throw new TRPCError({ code: "BAD_REQUEST", message: "Files must be between 1 byte and 10 MB." });
  const valid = mimeType === "application/pdf" ? buffer.subarray(0, 5).toString() === "%PDF-"
    : mimeType === "image/png" ? buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    : mimeType === "image/jpeg" ? buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255
    : mimeType.includes("spreadsheetml") ? buffer[0] === 80 && buffer[1] === 75
    : !buffer.includes(0);
  if (!valid) throw new TRPCError({ code: "BAD_REQUEST", message: "File contents do not match the selected file type." });
  return buffer;
}
