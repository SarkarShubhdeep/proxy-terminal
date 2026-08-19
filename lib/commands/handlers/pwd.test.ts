import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSessionStore } from "@/lib/session/session-store";

import { pwdCommand } from "./pwd";

function makeCtx() {
  return {
    writeLine: vi.fn(),
    writeError: vi.fn(),
    writeSuccess: vi.fn(),
    clearScreen: vi.fn(),
    openEditor: vi.fn(),
    pickFile: vi.fn(),
    args: [],
    commands: [],
  };
}

describe("pwdCommand", () => {
  beforeEach(() => {
    useSessionStore.getState().unmountVfs();
  });

  it("prints home when the VFS is not mounted", () => {
    const ctx = makeCtx();
    pwdCommand.run(ctx);
    expect(ctx.writeLine).toHaveBeenCalledWith("~");
  });

  it("prints the virtual VFS path when mounted", () => {
    useSessionStore.getState().mountVfs("folder-123");
    const ctx = makeCtx();
    pwdCommand.run(ctx);
    expect(ctx.writeLine).toHaveBeenCalledWith("~/WebTerminal");
  });
});
