import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/lib/auth/token-store";

import { pwdCommand } from "./pwd";

function makeCtx() {
  return {
    writeLine: vi.fn(),
    writeError: vi.fn(),
    writeSuccess: vi.fn(),
    clearScreen: vi.fn(),
    args: [],
    commands: [],
  };
}

describe("pwdCommand", () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it("prints home for guests", () => {
    const ctx = makeCtx();
    pwdCommand.run(ctx);
    expect(ctx.writeLine).toHaveBeenCalledWith("~");
  });

  it("prints the virtual VFS path when authenticated", () => {
    useAuthStore.getState().setToken({
      accessToken: "token",
      expiresAt: Date.now() + 60_000,
      scope: "drive.file",
    });
    const ctx = makeCtx();
    pwdCommand.run(ctx);
    expect(ctx.writeLine).toHaveBeenCalledWith("~/WebTerminal");
  });
});
