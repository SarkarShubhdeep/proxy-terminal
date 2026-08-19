import { revokeToken } from "@/lib/auth/google-auth";
import { useAuthStore } from "@/lib/auth/token-store";
import { clearFileIndex } from "@/lib/drive/file-index";
import { useSessionStore } from "@/lib/session/session-store";

import type { CommandHandler } from "../types";

export const logoutCommand: CommandHandler = {
  name: "logout",
  description: "Sign out and clear the session",
  run: (ctx) => {
    const store = useAuthStore.getState();

    if (!store.token) {
      ctx.writeLine("Not logged in.");
      return;
    }

    revokeToken(store.token.accessToken);
    store.clearAuth();
    useSessionStore.getState().unmountVfs();
    clearFileIndex();
    ctx.writeSuccess("Logged out.");
  },
};
