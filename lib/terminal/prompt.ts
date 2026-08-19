import { getAppEnv } from "@/lib/env";

export type PromptState = "guest" | "authenticated" | "mounted";

interface PromptAuthInput {
  isAuthenticated: boolean;
}

interface PromptSessionInput {
  isVfsMounted: boolean;
}

export function resolvePromptState(
  auth: PromptAuthInput,
  session: PromptSessionInput,
): PromptState {
  if (!auth.isAuthenticated) return "guest";
  if (session.isVfsMounted) return "mounted";
  return "authenticated";
}

export function buildPrompt(
  state: PromptState,
  username = "user",
  vfsFolderName = getAppEnv().vfsFolderName,
): string {
  const GREEN = "\x1b[32m";
  const BLUE = "\x1b[34m";
  const RESET = "\x1b[0m";

  if (state === "guest") {
    return `${GREEN}guest@proxy${RESET}:${BLUE}~${RESET}$ `;
  }

  const path =
    state === "mounted" ? `~/${vfsFolderName}` : "~";
  return `${GREEN}${username}@proxy${RESET}:${BLUE}${path}${RESET}$ `;
}

export function usernameFromEmail(email: string | undefined): string {
  if (!email) return "user";
  return email.split("@")[0] ?? "user";
}
