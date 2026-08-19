import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/lib/auth/token-store";
import {
  clearFileIndex,
  getIndexedFile,
  setFileIndex,
} from "@/lib/drive/file-index";
import { useSessionStore } from "@/lib/session/session-store";

import { touchCommand } from "./touch";

const createFile = vi.hoisted(() => vi.fn());

vi.mock("@/lib/drive/drive-api", () => ({ createFile }));

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

describe("touchCommand", () => {
  beforeEach(() => {
    createFile.mockReset();
    clearFileIndex();
    useAuthStore.getState().clearAuth();
    useSessionStore.getState().unmountVfs();
  });

  it("requires a filename argument", async () => {
    const ctx = makeCtx();
    await touchCommand.run(ctx);
    expect(ctx.writeError).toHaveBeenCalledWith("usage: touch <file>");
  });

  it("rejects unsupported extensions", async () => {
    const ctx = makeCtx(["notes.doc"]);
    await touchCommand.run(ctx);
    expect(ctx.writeError).toHaveBeenCalledWith(
      expect.stringContaining("supported"),
    );
    expect(createFile).not.toHaveBeenCalled();
  });

  it("creates a new file and indexes it", async () => {
    authenticateAndMount();
    createFile.mockResolvedValueOnce({
      id: "1",
      name: "notes.md",
      mimeType: "text/markdown",
    });
    const ctx = makeCtx(["notes.md"]);
    await touchCommand.run(ctx);
    expect(createFile).toHaveBeenCalledWith("token", "folder-1", "notes.md", "");
    expect(getIndexedFile("notes.md")?.id).toBe("1");
    expect(ctx.writeSuccess).toHaveBeenCalledWith("Created notes.md");
  });

  it("does not recreate an existing file", async () => {
    authenticateAndMount();
    setFileIndex([{ id: "1", name: "notes.md", mimeType: "text/markdown" }]);
    const ctx = makeCtx(["notes.md"]);
    await touchCommand.run(ctx);
    expect(ctx.writeLine).toHaveBeenCalledWith("File already exists.");
    expect(createFile).not.toHaveBeenCalled();
  });
});
