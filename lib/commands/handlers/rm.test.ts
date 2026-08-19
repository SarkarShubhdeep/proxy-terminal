import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/lib/auth/token-store";
import {
  clearFileIndex,
  getIndexedFile,
  setFileIndex,
} from "@/lib/drive/file-index";
import { useSessionStore } from "@/lib/session/session-store";

import { rmCommand } from "./rm";

const deleteFile = vi.hoisted(() => vi.fn());
const listFiles = vi.hoisted(() => vi.fn());

vi.mock("@/lib/drive/drive-api", () => ({ deleteFile, listFiles }));

function makeCtx(args: string[] = []) {
  return {
    writeLine: vi.fn(),
    writeError: vi.fn(),
    writeSuccess: vi.fn(),
    clearScreen: vi.fn(),
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

describe("rmCommand", () => {
  beforeEach(() => {
    deleteFile.mockReset();
    listFiles.mockReset();
    clearFileIndex();
    useAuthStore.getState().clearAuth();
    useSessionStore.getState().unmountVfs();
  });

  it("requires a filename argument", async () => {
    const ctx = makeCtx();
    await rmCommand.run(ctx);
    expect(ctx.writeError).toHaveBeenCalledWith("usage: rm <file>");
  });

  it("deletes an indexed file", async () => {
    authenticateAndMount();
    setFileIndex([{ id: "1", name: "notes.md", mimeType: "text/markdown" }]);
    const ctx = makeCtx(["notes.md"]);
    await rmCommand.run(ctx);
    expect(deleteFile).toHaveBeenCalledWith("token", "1");
    expect(getIndexedFile("notes.md")).toBeUndefined();
    expect(ctx.writeSuccess).toHaveBeenCalledWith("Removed notes.md");
  });

  it("errors when the file does not exist", async () => {
    authenticateAndMount();
    listFiles.mockResolvedValueOnce([]);
    const ctx = makeCtx(["missing.txt"]);
    await rmCommand.run(ctx);
    expect(ctx.writeError).toHaveBeenCalledWith(
      expect.stringContaining("no such file"),
    );
    expect(deleteFile).not.toHaveBeenCalled();
  });
});
