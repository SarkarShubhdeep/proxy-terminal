import type { Terminal } from "@xterm/xterm";

const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const BLUE = "\x1b[34m";

export function writeLine(term: Terminal, text: string): void {
  term.writeln(text);
}

export function writeError(term: Terminal, text: string): void {
  term.writeln(`${RED}${text}${RESET}`);
}

export function writeSuccess(term: Terminal, text: string): void {
  term.writeln(`${GREEN}${text}${RESET}`);
}

export function getPrompt(isAuthenticated: boolean): string {
  const user = isAuthenticated ? "user" : "guest";
  return `${GREEN}${user}@proxy${RESET}:${BLUE}~${RESET}$ `;
}

export function writePrompt(term: Terminal, isAuthenticated: boolean): void {
  term.write(getPrompt(isAuthenticated));
}
