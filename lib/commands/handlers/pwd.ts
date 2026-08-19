import { getAppEnv } from "@/lib/env";
import { useSessionStore } from "@/lib/session/session-store";

import type { CommandHandler } from "../types";

export const pwdCommand: CommandHandler = {
  name: "pwd",
  description: "Print the current virtual working directory",
  run: (ctx) => {
    if (!useSessionStore.getState().isVfsMounted) {
      ctx.writeLine("~");
      return;
    }

    const { vfsFolderName } = getAppEnv();
    ctx.writeLine(`~/${vfsFolderName}`);
  },
};
