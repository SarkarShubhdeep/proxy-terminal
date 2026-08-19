import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/lib/auth/token-store";
import { clearFileIndex, setFileIndex } from "@/lib/drive/file-index";
import { DriveApiError } from "@/lib/drive/types";
import { useSessionStore } from "@/lib/session/session-store";

import { downloadCommand } from "./download";

const listFiles = vi.hoisted(() => vi.fn());
const downloadFile = vi.hoisted(() => vi.fn());

vi.mock("@/lib/drive/drive-api", () => ({ listFiles, downloadFile }));

function makeCtx(args: string[] = []) {
  return {
    writeLine: vi.fn(),
    writeError: vi.fn(),
    writeSuccess: vi.fn(),
    clearScreen: vi.fn(),
    openEditor: vi.fn(),
    pickFile: vi.fn(),
    args,
    commands: [],
  };
}

function authenticateAndMount() {
  useAuthStore.getState().setToken({
    accessToken: "token",
    expiresAt: Date.now() + 60_000,
    scope: "drive.file",
  });
  useSessionStore.getState().mountVfs("folder-1");
}

describe("downloadCommand", () => {
  beforeEach(() => {
    listFiles.mockReset();
    downloadFile.mockReset();
    clearFileIndex();
    useAuthStore.getState().clearAuth();
    useSessionStore.getState().unmountVfs();
  });

  it("requires a filename argument", async () => {
    const ctx = makeCtx();
    await downloadCommand.run(ctx);
    expect(ctx.writeError).toHaveBeenCalledWith("usage: download <file>");
  });

  it("errors when the file does not exist", async () => {
    authenticateAndMount();
    listFiles.mockResolvedValueOnce([]);
    const ctx = makeCtx(["missing.txt"]);
    await downloadCommand.run(ctx);
    expect(ctx.writeError).toHaveBeenCalledWith(
      "download: missing.txt: no such file",
    );
    expect(downloadFile).not.toHaveBeenCalled();
  });

  it("rejects unsupported file types", async () => {
    authenticateAndMount();
    setFileIndex([{ id: "1", name: "photo.png", mimeType: "image/png" }]);
    const ctx = makeCtx(["photo.png"]);
    await downloadCommand.run(ctx);
    expect(ctx.writeError).toHaveBeenCalledWith(
      "Binary or unsupported file type.",
    );
    expect(downloadFile).not.toHaveBeenCalled();
  });

  it("downloads a readable file", async () => {
    authenticateAndMount();
    setFileIndex([{ id: "1", name: "notes.md", mimeType: "text/markdown" }]);
    const ctx = makeCtx(["notes.md"]);
    await downloadCommand.run(ctx);
    expect(downloadFile).toHaveBeenCalledWith(
      "token",
      "1",
      "notes.md",
      "text/markdown",
    );
    expect(ctx.writeSuccess).toHaveBeenCalledWith("Downloaded notes.md");
  });

  it("reports Drive errors", async () => {
    authenticateAndMount();
    setFileIndex([{ id: "1", name: "notes.md", mimeType: "text/markdown" }]);
    downloadFile.mockRejectedValueOnce(
      new DriveApiError("network", "Network error. Check your connection."),
    );
    const ctx = makeCtx(["notes.md"]);
    await downloadCommand.run(ctx);
    expect(ctx.writeError).toHaveBeenCalledWith(
      "Network error. Check your connection.",
    );
  });
});
