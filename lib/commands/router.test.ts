import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/lib/auth/token-store";

import { dispatchCommand } from "./router";
import type { CommandIO } from "./types";

function makeIO() {
  const io: CommandIO = {
    writeLine: vi.fn(),
    writeError: vi.fn(),
    writeSuccess: vi.fn(),
  };
  return io;
}

describe("dispatchCommand", () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it("reports unknown commands as an error", async () => {
    const io = makeIO();
    await dispatchCommand(["nope"], io);
    expect(io.writeError).toHaveBeenCalledWith(
      expect.stringContaining("command not found: nope"),
    );
  });

  it("lists registered commands via help", async () => {
    const io = makeIO();
    await dispatchCommand(["help"], io);
    const output = (io.writeLine as ReturnType<typeof vi.fn>).mock.calls
      .map((call) => call[0])
      .join("\n");
    expect(output).toContain("login-drive");
    expect(output).toContain("whoami");
  });

  it("reports guest identity when not authenticated", async () => {
    const io = makeIO();
    await dispatchCommand(["whoami"], io);
    expect(io.writeLine).toHaveBeenCalledWith("guest (not authenticated)");
  });

  it("reports an expired session for a stale token", async () => {
    useAuthStore.getState().setToken({
      accessToken: "stale",
      expiresAt: Date.now() - 1_000,
      scope: "drive.file",
    });
    const io = makeIO();
    await dispatchCommand(["whoami"], io);
    expect(io.writeError).toHaveBeenCalledWith(
      "Session expired. Run login-drive again.",
    );
  });
});
