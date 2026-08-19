import { useAuthStore } from "@/lib/auth/token-store";
import { getAppEnv } from "@/lib/env";

import type { CommandHandler } from "../types";

export const pwdCommand: CommandHandler = {
  name: "pwd",
  description: "Print the current virtual working directory",
  run: (ctx) => {
    const auth = useAuthStore.getState();

    if (!auth.isAuthenticated()) {
      ctx.writeLine("~");
      return;
    }

    const { vfsFolderName } = getAppEnv();
    ctx.writeLine(`~/${vfsFolderName}`);
  },
};
