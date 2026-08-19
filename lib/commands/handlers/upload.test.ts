import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/lib/auth/token-store";
import {
  addIndexedFile,
  clearFileIndex,
  getIndexedFile,
} from "@/lib/drive/file-index";
import { DriveApiError } from "@/lib/drive/types";
import { useSessionStore } from "@/lib/session/session-store";

import { uploadCommand } from "./upload";

const uploadFile = vi.hoisted(() => vi.fn());

vi.mock("@/lib/drive/drive-api", () => ({ uploadFile }));

function makeCtx() {
  return {
    writeLine: vi.fn(),
    writeError: vi.fn(),
    writeSuccess: vi.fn(),
    clearScreen: vi.fn(),
    openEditor: vi.fn(),
    pickFile: vi.fn().mockResolvedValue(null),
    args: [] as string[],
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

describe("uploadCommand", () => {
  beforeEach(() => {
    uploadFile.mockReset();
    clearFileIndex();
    useAuthStore.getState().clearAuth();
    useSessionStore.getState().unmountVfs();
  });

  it("rejects when not mounted", async () => {
    const ctx = makeCtx();
    await uploadCommand.run(ctx);
    expect(ctx.writeError).toHaveBeenCalledWith(
      expect.stringContaining("Not logged in"),
    );
    expect(ctx.pickFile).not.toHaveBeenCalled();
  });

  it("returns silently when the picker is cancelled", async () => {
    authenticateAndMount();
    const ctx = makeCtx();
    ctx.pickFile.mockResolvedValueOnce(null);
    await uploadCommand.run(ctx);
    expect(uploadFile).not.toHaveBeenCalled();
    expect(ctx.writeError).not.toHaveBeenCalled();
    expect(ctx.writeSuccess).not.toHaveBeenCalled();
  });

  it("rejects unsupported local files", async () => {
    authenticateAndMount();
    const ctx = makeCtx();
    ctx.pickFile.mockResolvedValueOnce(
      new File(["x"], "photo.png", { type: "image/png" }),
    );
    await uploadCommand.run(ctx);
    expect(ctx.writeError).toHaveBeenCalledWith(
      expect.stringContaining("supported"),
    );
    expect(uploadFile).not.toHaveBeenCalled();
  });

  it("rejects a duplicate filename", async () => {
    authenticateAndMount();
    addIndexedFile({ id: "1", name: "notes.md", mimeType: "text/markdown" });
    const ctx = makeCtx();
    ctx.pickFile.mockResolvedValueOnce(
      new File(["x"], "notes.md", { type: "text/markdown" }),
    );
    await uploadCommand.run(ctx);
    expect(ctx.writeError).toHaveBeenCalledWith(
      "File already exists. Use nano to edit notes.md.",
    );
    expect(uploadFile).not.toHaveBeenCalled();
  });

  it("uploads a new text file and indexes it", async () => {
    authenticateAndMount();
    const file = new File(["hello"], "notes.md", { type: "text/markdown" });
    uploadFile.mockResolvedValueOnce({
      id: "1",
      name: "notes.md",
      mimeType: "text/markdown",
    });
    const ctx = makeCtx();
    ctx.pickFile.mockResolvedValueOnce(file);
    await uploadCommand.run(ctx);
    expect(ctx.pickFile).toHaveBeenCalledWith(".txt,.md");
    expect(uploadFile).toHaveBeenCalledWith("token", "folder-1", file);
    expect(getIndexedFile("notes.md")?.id).toBe("1");
    expect(ctx.writeSuccess).toHaveBeenCalledWith("Uploaded notes.md");
  });

  it("reports Drive errors", async () => {
    authenticateAndMount();
    uploadFile.mockRejectedValueOnce(
      new DriveApiError("network", "Network error. Check your connection."),
    );
    const ctx = makeCtx();
    ctx.pickFile.mockResolvedValueOnce(
      new File(["hello"], "notes.md", { type: "text/markdown" }),
    );
    await uploadCommand.run(ctx);
    expect(ctx.writeError).toHaveBeenCalledWith(
      "Network error. Check your connection.",
    );
  });
});
