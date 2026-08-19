import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/lib/auth/token-store";
import { clearFileIndex } from "@/lib/drive/file-index";
import { useSessionStore } from "@/lib/session/session-store";

import { lsCommand } from "./ls";

const listFiles = vi.hoisted(() => vi.fn());

vi.mock("@/lib/drive/drive-api", () => ({ listFiles }));

function makeCtx() {
  return {
    writeLine: vi.fn(),
    writeError: vi.fn(),
    writeSuccess: vi.fn(),
    clearScreen: vi.fn(),
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

describe("lsCommand", () => {
  beforeEach(() => {
    listFiles.mockReset();
    clearFileIndex();
    useAuthStore.getState().clearAuth();
    useSessionStore.getState().unmountVfs();
  });

  it("rejects when not mounted", async () => {
    const ctx = makeCtx();
    await lsCommand.run(ctx);
    expect(ctx.writeError).toHaveBeenCalledWith(
      expect.stringContaining("Not logged in"),
    );
    expect(listFiles).not.toHaveBeenCalled();
  });

  it("prints (empty) for an empty folder", async () => {
    authenticateAndMount();
    listFiles.mockResolvedValueOnce([]);
    const ctx = makeCtx();
    await lsCommand.run(ctx);
    expect(ctx.writeLine).toHaveBeenCalledWith("(empty)");
  });

  it("lists file names", async () => {
    authenticateAndMount();
    listFiles.mockResolvedValueOnce([
      { id: "1", name: "a.txt", mimeType: "text/plain" },
      { id: "2", name: "b.md", mimeType: "text/markdown" },
    ]);
    const ctx = makeCtx();
    await lsCommand.run(ctx);
    expect(ctx.writeLine).toHaveBeenCalledWith("a.txt");
    expect(ctx.writeLine).toHaveBeenCalledWith("b.md");
  });
});
