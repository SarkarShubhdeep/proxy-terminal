import type { Terminal } from "@xterm/xterm";

import { useAuthStore } from "@/lib/auth/token-store";
import { useSessionStore } from "@/lib/session/session-store";

import {
  buildPrompt,
  resolvePromptState,
  usernameFromEmail,
} from "./prompt";

const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";

export function writeLine(term: Terminal, text: string): void {
  term.writeln(text);
}

export function writeError(term: Terminal, text: string): void {
  term.writeln(`${RED}${text}${RESET}`);
}

export function writeSuccess(term: Terminal, text: string): void {
  term.writeln(`${GREEN}${text}${RESET}`);
}

export function getCurrentPrompt(): string {
  const auth = useAuthStore.getState();
  const session = useSessionStore.getState();
  const state = resolvePromptState(
    { isAuthenticated: auth.isAuthenticated() },
    { isVfsMounted: session.isVfsMounted },
  );
  return buildPrompt(state, usernameFromEmail(auth.user?.email));
}

export function writePrompt(term: Terminal): void {
  term.write(getCurrentPrompt());
}
