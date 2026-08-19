import { useEffect, type RefObject } from "react";
import type { Terminal } from "@xterm/xterm";

import { dispatchCommand } from "@/lib/commands/router";
import { useAuthStore } from "@/lib/auth/token-store";
import { getAppEnv } from "@/lib/env";
import { useSessionStore } from "@/lib/session/session-store";
import { createCommandHistory } from "@/lib/terminal/history";
import { parseCommand } from "@/lib/terminal/parser";
import {
  getCurrentPrompt,
  writeError,
  writeLine,
  writePrompt,
  writeSuccess,
} from "@/lib/terminal/output";
import { TERMINAL_THEME } from "@/lib/terminal/theme";

import { getWelcomeBanner } from "@/components/terminal/welcome-banner";

const ARROW_UP = "\x1b[A";
const ARROW_DOWN = "\x1b[B";

function redrawInputLine(terminal: Terminal, buffer: string): void {
  terminal.write(`\r\x1b[K${getCurrentPrompt()}${buffer}`);
}

export function useTerminal(containerRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let terminal: Terminal | null = null;
    let disposed = false;
    let buffer = "";
    let running = false;
    const history = createCommandHistory();
    const cleanupFns: Array<() => void> = [];

    const refreshPromptIfIdle = () => {
      if (!terminal || running || buffer.length > 0) return;
      terminal.write(`\r\x1b[K${getCurrentPrompt()}`);
    };

    const boot = async () => {
      const [{ Terminal }, { FitAddon }] = await Promise.all([
        import("@xterm/xterm"),
        import("@xterm/addon-fit"),
      ]);
      if (disposed) return;

      const term = new Terminal({
        fontFamily:
          'var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 14,
        cursorBlink: true,
        convertEol: true,
        theme: TERMINAL_THEME,
      });
      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(container);
      fitAddon.fit();
      term.focus();
      terminal = term;

      for (const line of getWelcomeBanner(getAppEnv().appName)) {
        term.writeln(line);
      }
      writePrompt(term);

      const io = {
        writeLine: (text: string) => writeLine(term, text),
        writeError: (text: string) => writeError(term, text),
        writeSuccess: (text: string) => writeSuccess(term, text),
        clearScreen: () => term.clear(),
      };

      const submit = async () => {
        const input = buffer.trim();
        buffer = "";
        term.write("\r\n");

        if (input) {
          history.push(input);
          running = true;
          await dispatchCommand(parseCommand(input), io);
          running = false;
        }

        history.resetDraft();
        writePrompt(term);
      };

      const handleHistory = (direction: "up" | "down") => {
        const next = history.navigate(direction);
        if (next === null) return;
        buffer = next;
        redrawInputLine(term, buffer);
      };

      const dataListener = term.onData((data) => {
        if (running) return;

        if (data === "\r") {
          void submit();
        } else if (data === ARROW_UP) {
          handleHistory("up");
        } else if (data === ARROW_DOWN) {
          handleHistory("down");
        } else if (data === "\u007f") {
          if (buffer.length > 0) {
            buffer = buffer.slice(0, -1);
            term.write("\b \b");
          }
        } else if (data === "\u0003") {
          term.write("^C\r\n");
          buffer = "";
          history.resetDraft();
          writePrompt(term);
        } else if (data >= " ") {
          buffer += data;
          term.write(data);
        }
      });
      cleanupFns.push(() => dataListener.dispose());

      const unsubAuth = useAuthStore.subscribe(refreshPromptIfIdle);
      const unsubSession = useSessionStore.subscribe(refreshPromptIfIdle);
      cleanupFns.push(unsubAuth, unsubSession);

      const handleResize = () => fitAddon.fit();
      window.addEventListener("resize", handleResize);
      cleanupFns.push(() => window.removeEventListener("resize", handleResize));
    };

    void boot();

    return () => {
      disposed = true;
      for (const fn of cleanupFns) fn();
      terminal?.dispose();
    };
  }, [containerRef]);
}
