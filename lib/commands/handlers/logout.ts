import { revokeToken } from "@/lib/auth/google-auth";
import { useAuthStore } from "@/lib/auth/token-store";

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
    ctx.writeSuccess("Logged out.");
  },
};
