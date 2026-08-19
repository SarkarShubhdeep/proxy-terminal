"use client";

import { useEffect, useRef } from "react";
import type { Terminal } from "@xterm/xterm";

import "@xterm/xterm/css/xterm.css";

import { dispatchCommand } from "@/lib/commands/router";
import { useAuthStore } from "@/lib/auth/token-store";
import { getAppEnv } from "@/lib/env";
import { parseCommand } from "@/lib/terminal/parser";
import {
  getPrompt,
  writeError,
  writeLine,
  writeSuccess,
} from "@/lib/terminal/output";

import { getWelcomeBanner } from "./welcome-banner";

const TERMINAL_THEME = {
  background: "#0d1117",
  foreground: "#c9d1d9",
  cursor: "#58a6ff",
  selectionBackground: "#264f78",
} as const;

export function TerminalWindow() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let term: Terminal | null = null;
    let disposed = false;
    let buffer = "";
    let running = false;

    const cleanupFns: Array<() => void> = [];

    const boot = async () => {
      const [{ Terminal }, { FitAddon }] = await Promise.all([
        import("@xterm/xterm"),
        import("@xterm/addon-fit"),
      ]);
      if (disposed) return;

      const terminal = new Terminal({
        fontFamily:
          'var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 14,
        cursorBlink: true,
        convertEol: true,
        theme: TERMINAL_THEME,
      });
      const fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);
      terminal.open(container);
      fitAddon.fit();
      terminal.focus();
      term = terminal;

      const prompt = () =>
        terminal.write(getPrompt(useAuthStore.getState().isAuthenticated()));

      for (const line of getWelcomeBanner(getAppEnv().appName)) {
        terminal.writeln(line);
      }
      prompt();

      const io = {
        writeLine: (text: string) => writeLine(terminal, text),
        writeError: (text: string) => writeError(terminal, text),
        writeSuccess: (text: string) => writeSuccess(terminal, text),
      };

      const submit = async () => {
        const input = buffer.trim();
        buffer = "";
        terminal.write("\r\n");

        if (!input) {
          prompt();
          return;
        }

        running = true;
        await dispatchCommand(parseCommand(input), io);
        running = false;
        prompt();
      };

      const dataListener = terminal.onData((data) => {
        if (running) return;

        if (data === "\r") {
          void submit();
        } else if (data === "\u007f") {
          if (buffer.length > 0) {
            buffer = buffer.slice(0, -1);
            terminal.write("\b \b");
          }
        } else if (data === "\u0003") {
          terminal.write("^C\r\n");
          buffer = "";
          prompt();
        } else if (data >= " ") {
          buffer += data;
          terminal.write(data);
        }
      });
      cleanupFns.push(() => dataListener.dispose());

      const handleResize = () => fitAddon.fit();
      window.addEventListener("resize", handleResize);
      cleanupFns.push(() => window.removeEventListener("resize", handleResize));
    };

    void boot();

    return () => {
      disposed = true;
      for (const fn of cleanupFns) fn();
      term?.dispose();
    };
  }, []);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#0d1117]">
      <header className="flex items-center gap-2 border-b border-[#30363d] px-4 py-3">
        <span className="size-3 rounded-full bg-[#ff5f57]" />
        <span className="size-3 rounded-full bg-[#febc2e]" />
        <span className="size-3 rounded-full bg-[#28c840]" />
        <span className="ml-3 font-mono text-sm text-[#8b949e]">
          {getAppEnv().appName}
        </span>
      </header>
      <div ref={containerRef} className="flex-1 overflow-hidden p-3" />
    </div>
  );
}
