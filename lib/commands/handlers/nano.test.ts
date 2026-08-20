import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/lib/auth/token-store";
import {
  clearFileIndex,
  getIndexedFile,
  setFileIndex,
} from "@/lib/drive/file-index";
import { DriveApiError } from "@/lib/drive/types";
import { useSessionStore } from "@/lib/session/session-store";

import { nanoCommand } from "./nano";

const listFiles = vi.hoisted(() => vi.fn());
const readFile = vi.hoisted(() => vi.fn());
const writeFile = vi.hoisted(() => vi.fn());
const createFile = vi.hoisted(() => vi.fn());

vi.mock("@/lib/drive/drive-api", () => ({
  listFiles,
  readFile,
  writeFile,
  createFile,
}));

function makeCtx(args: string[] = []) {
  return {
    writeLine: vi.fn(),
    writeError: vi.fn(),
    writeSuccess: vi.fn(),
    clearScreen: vi.fn(),
    openEditor: vi.fn().mockResolvedValue(null),
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

describe("nanoCommand", () => {
  beforeEach(() => {
    listFiles.mockReset();
    readFile.mockReset();
    writeFile.mockReset();
    createFile.mockReset();
    clearFileIndex();
    useAuthStore.getState().clearAuth();
    useSessionStore.getState().unmountVfs();
  });

  it("requires a filename argument", async () => {
    const ctx = makeCtx();
    await nanoCommand.run(ctx);
    expect(ctx.writeError).toHaveBeenCalledWith("usage: nano <file>");
  });

  it("rejects unsupported extensions", async () => {
    const ctx = makeCtx(["notes.doc"]);
    await nanoCommand.run(ctx);
    expect(ctx.writeError).toHaveBeenCalledWith(
      expect.stringContaining("supported"),
    );
    expect(ctx.openEditor).not.toHaveBeenCalled();
  });

  it("creates a new file on save when it does not exist", async () => {
    authenticateAndMount();
    listFiles.mockResolvedValueOnce([]);
    createFile.mockResolvedValueOnce({
      id: "1",
      name: "notes.md",
      mimeType: "text/markdown",
    });

    const ctx = makeCtx(["notes.md"]);
    ctx.openEditor.mockResolvedValueOnce("hello");
    await nanoCommand.run(ctx);

    expect(ctx.openEditor).toHaveBeenCalledWith({
      filename: "notes.md",
      content: "",
    });
    expect(createFile).toHaveBeenCalledWith(
      "token",
      "folder-1",
      "notes.md",
      "hello",
    );
    expect(getIndexedFile("notes.md")?.id).toBe("1");
    expect(ctx.writeSuccess).toHaveBeenCalledWith("Saved notes.md");
  });

  it("overwrites an existing readable file", async () => {
    authenticateAndMount();
    setFileIndex([{ id: "1", name: "notes.md", mimeType: "text/markdown" }]);
    readFile.mockResolvedValueOnce("old");
    const ctx = makeCtx(["notes.md"]);
    ctx.openEditor.mockResolvedValueOnce("new");
    await nanoCommand.run(ctx);

    expect(readFile).toHaveBeenCalledWith("token", "1", "text/markdown");
    expect(ctx.openEditor).toHaveBeenCalledWith({
      filename: "notes.md",
      content: "old",
    });
    expect(writeFile).toHaveBeenCalledWith("token", "1", "new");
    expect(createFile).not.toHaveBeenCalled();
    expect(ctx.writeSuccess).toHaveBeenCalledWith("Saved notes.md");
  });

  it("does not write when the editor is cancelled", async () => {
    authenticateAndMount();
    listFiles.mockResolvedValueOnce([]);
    const ctx = makeCtx(["notes.md"]);
    ctx.openEditor.mockResolvedValueOnce(null);
    await nanoCommand.run(ctx);
    expect(ctx.writeLine).not.toHaveBeenCalled();
    expect(ctx.writeSuccess).not.toHaveBeenCalled();
    expect(createFile).not.toHaveBeenCalled();
    expect(writeFile).not.toHaveBeenCalled();
  });

  it("reports Drive errors", async () => {
    authenticateAndMount();
    listFiles.mockResolvedValueOnce([]);
    createFile.mockRejectedValueOnce(
      new DriveApiError("network", "Network error. Check your connection."),
    );
    const ctx = makeCtx(["notes.md"]);
    ctx.openEditor.mockResolvedValueOnce("hello");
    await nanoCommand.run(ctx);
    expect(ctx.writeError).toHaveBeenCalledWith(
      "Network error. Check your connection.",
    );
  });
});
