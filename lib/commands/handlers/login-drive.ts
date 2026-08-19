import {
  AuthCancelledError,
  AuthPopupBlockedError,
  requestAccessToken,
  type RequestAccessTokenOptions,
} from "@/lib/auth/google-auth";
import { useAuthStore } from "@/lib/auth/token-store";
import { fetchUserEmail } from "@/lib/auth/userinfo";
import { initVfs, listFiles } from "@/lib/drive/drive-api";
import { setFileIndex } from "@/lib/drive/file-index";
import { DriveApiError } from "@/lib/drive/types";
import { getAppEnv } from "@/lib/env";
import { useSessionStore } from "@/lib/session/session-store";

import type { CommandContext, CommandHandler } from "../types";

function describeError(error: unknown): string {
  if (
    error instanceof AuthCancelledError ||
    error instanceof AuthPopupBlockedError
  ) {
    return error.message;
  }
  if (error instanceof DriveApiError || error instanceof Error) {
    return `login-drive: ${error.message}`;
  }
  return "login-drive: unexpected error during authentication.";
}

async function authenticate(
  ctx: CommandContext,
  authOptions: RequestAccessTokenOptions = {},
): Promise<void> {
  const store = useAuthStore.getState();
  store.setStatus("authenticating");

  const token = await requestAccessToken(authOptions);
  store.setToken(token);

  const email = await fetchUserEmail(token.accessToken);
  store.setUser({ email });
  ctx.writeSuccess(`Authenticated as ${email}`);

  const { vfsFolderName } = getAppEnv();
  ctx.writeLine(`Mounting ~/${vfsFolderName}...`);

  const folderId = await initVfs(token.accessToken, vfsFolderName);
  useSessionStore.getState().mountVfs(folderId);

  const files = await listFiles(token.accessToken, folderId);
  setFileIndex(files);
  ctx.writeSuccess(`Mounted ~/${vfsFolderName}`);
}

function clearLoginState(): void {
  useAuthStore.getState().clearAuth();
  useAuthStore.getState().setStatus("error");
  useSessionStore.getState().unmountVfs();
}

export const loginDriveCommand: CommandHandler = {
  name: "login-drive",
  description: "Sign in with Google and connect Drive",
  run: async (ctx) => {
    const store = useAuthStore.getState();
    if (store.isAuthenticated() && useSessionStore.getState().isVfsMounted) {
      ctx.writeLine("Already logged in. Run 'logout' to switch accounts.");
      return;
    }

    ctx.writeLine("Opening Google sign-in popup...");
    try {
      await authenticate(ctx);
    } catch (error) {
      if (error instanceof DriveApiError && error.kind === "forbidden") {
        ctx.writeLine("Drive permission issue — requesting fresh consent...");
        try {
          await authenticate(ctx, { prompt: "consent" });
          return;
        } catch (retryError) {
          clearLoginState();
          ctx.writeError(describeError(retryError));
          return;
        }
      }

      clearLoginState();
      ctx.writeError(describeError(error));
    }
  },
};
