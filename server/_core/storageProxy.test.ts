import { describe, expect, it, vi } from "vitest";
vi.mock("./sdk", () => ({ sdk: { authenticateRequest: vi.fn() } }));
vi.mock("../db", () => ({ getStoredFileForUser: vi.fn() }));
vi.mock("../storage", () => ({ storageRead: vi.fn(), storageGetSignedUrl: vi.fn() }));
import { sdk } from "./sdk";
import { getStoredFileForUser } from "../db";
import { storageRead } from "../storage";
import { registerStorageProxy } from "./storageProxy";
function handler() {
  const routes = new Map<string, Function>();
  registerStorageProxy({ get: (route: string, callback: Function) => routes.set(route, callback) } as any);
  const res: any = { status: vi.fn(() => res), send: vi.fn(() => res), set: vi.fn(() => res), type: vi.fn(() => res), attachment: vi.fn(() => res) };
  return { run: routes.get("/api/storage/*")!, res };
}
describe("private file download route", () => {
  it("rejects signed-out downloads before reading storage", async () => {
    vi.clearAllMocks(); vi.mocked(sdk.authenticateRequest).mockRejectedValueOnce(new Error("No session"));
    const { run, res } = handler(); await run({ params: { 0: "trades/1/file.txt" } }, res);
    expect(res.status).toHaveBeenCalledWith(401); expect(storageRead).not.toHaveBeenCalled();
  });
  it("conceals unrelated files and never reads their bytes", async () => {
    vi.clearAllMocks(); vi.mocked(sdk.authenticateRequest).mockResolvedValueOnce({ id: 1 } as any); vi.mocked(getStoredFileForUser).mockResolvedValueOnce(undefined);
    const { run, res } = handler(); await run({ params: { 0: "trades/2/file.txt" } }, res);
    expect(res.status).toHaveBeenCalledWith(404); expect(storageRead).not.toHaveBeenCalled();
  });
  it("returns authorized bytes as a private attachment", async () => {
    vi.clearAllMocks(); vi.mocked(sdk.authenticateRequest).mockResolvedValueOnce({ id: 1 } as any); vi.mocked(getStoredFileForUser).mockResolvedValueOnce({ fileName: "invoice.txt" }); vi.mocked(storageRead).mockResolvedValueOnce({ buffer: Buffer.from("invoice"), contentType: "text/plain" });
    const { run, res } = handler(); await run({ params: { 0: "trades/1/file.txt" } }, res);
    expect(res.attachment).toHaveBeenCalledWith("invoice.txt"); expect(res.send).toHaveBeenCalledWith(Buffer.from("invoice")); expect(res.set).toHaveBeenCalledWith(expect.objectContaining({ "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" }));
  });
});
