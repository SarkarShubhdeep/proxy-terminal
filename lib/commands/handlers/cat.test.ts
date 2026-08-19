import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/lib/auth/token-store";
import { clearFileIndex, setFileIndex } from "@/lib/drive/file-index";
import { useSessionStore } from "@/lib/session/session-store";

import { catCommand } from "./cat";

const listFiles = vi.hoisted(() => vi.fn());
const readFile = vi.hoisted(() => vi.fn());

vi.mock("@/lib/drive/drive-api", () => ({ listFiles, readFile }));

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

describe("catCommand", () => {
  beforeEach(() => {
    listFiles.mockReset();
    readFile.mockReset();
    clearFileIndex();
    useAuthStore.getState().clearAuth();
    useSessionStore.getState().unmountVfs();
  });

  it("requires a filename argument", async () => {
    const ctx = makeCtx();
    await catCommand.run(ctx);
    expect(ctx.writeError).toHaveBeenCalledWith("usage: cat <file>");
  });

  it("rejects unsupported file types", async () => {
    authenticateAndMount();
    const ctx = makeCtx(["image.png"]);
    await catCommand.run(ctx);
    expect(ctx.writeError).toHaveBeenCalledWith("Binary or unsupported file type.");
  });

  it("prints file contents from the cache", async () => {
    authenticateAndMount();
    setFileIndex([{ id: "1", name: "notes.md", mimeType: "text/markdown" }]);
    readFile.mockResolvedValueOnce("hello");
    const ctx = makeCtx(["notes.md"]);
    await catCommand.run(ctx);
    expect(readFile).toHaveBeenCalledWith("token", "1");
    expect(ctx.writeLine).toHaveBeenCalledWith("hello");
  });

  it("errors when the file does not exist", async () => {
    authenticateAndMount();
    listFiles.mockResolvedValueOnce([]);
    const ctx = makeCtx(["missing.txt"]);
    await catCommand.run(ctx);
    expect(ctx.writeError).toHaveBeenCalledWith(
      expect.stringContaining("no such file"),
    );
  });
});
