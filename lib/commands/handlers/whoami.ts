import { useAuthStore } from "@/lib/auth/token-store";

import type { CommandHandler } from "../types";

export const whoamiCommand: CommandHandler = {
  name: "whoami",
  description: "Show the connected Google account",
  run: (ctx) => {
    const store = useAuthStore.getState();

    if (store.token && store.isExpired()) {
      ctx.writeError("Session expired. Run login-drive again.");
      return;
    }

    if (!store.isAuthenticated() || !store.user) {
      ctx.writeLine("guest (not authenticated)");
      return;
    }

    ctx.writeLine(store.user.email);
  },
};
