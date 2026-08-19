import {
  AuthCancelledError,
  AuthPopupBlockedError,
  requestAccessToken,
} from "@/lib/auth/google-auth";
import { useAuthStore } from "@/lib/auth/token-store";
import { fetchUserEmail } from "@/lib/auth/userinfo";

import type { CommandContext, CommandHandler } from "../types";

function describeError(error: unknown): string {
  if (
    error instanceof AuthCancelledError ||
    error instanceof AuthPopupBlockedError
  ) {
    return error.message;
  }
  if (error instanceof Error) {
    return `login-drive: ${error.message}`;
  }
  return "login-drive: unexpected error during authentication.";
}

async function authenticate(ctx: CommandContext): Promise<void> {
  const store = useAuthStore.getState();
  store.setStatus("authenticating");

  const token = await requestAccessToken();
  store.setToken(token);

  const email = await fetchUserEmail(token.accessToken);
  store.setUser({ email });
  ctx.writeSuccess(`Authenticated as ${email}`);
}

export const loginDriveCommand: CommandHandler = {
  name: "login-drive",
  description: "Sign in with Google and connect Drive",
  run: async (ctx) => {
    const store = useAuthStore.getState();
    if (store.isAuthenticated()) {
      ctx.writeLine("Already logged in. Run 'logout' to switch accounts.");
      return;
    }

    ctx.writeLine("Opening Google sign-in popup...");
    try {
      await authenticate(ctx);
    } catch (error) {
      useAuthStore.getState().clearAuth();
      useAuthStore.getState().setStatus("error");
      ctx.writeError(describeError(error));
    }
  },
};
