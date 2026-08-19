import { useAuthStore } from "@/lib/auth/token-store";
import { useSessionStore } from "@/lib/session/session-store";

import type { CommandIO } from "./types";

export interface MountedSession {
  token: string;
  folderId: string;
}

export function requireMountedSession(io: CommandIO): MountedSession | null {
  const auth = useAuthStore.getState();

  if (!auth.isAuthenticated() || !auth.token) {
    io.writeError("Not logged in. Run login-drive first.");
    return null;
  }

  const session = useSessionStore.getState();
  if (!session.isVfsMounted || !session.vfsFolderId) {
    io.writeError("Drive not mounted. Run login-drive.");
    return null;
  }

  return { token: auth.token.accessToken, folderId: session.vfsFolderId };
}
