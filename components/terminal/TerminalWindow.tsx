"use client";

import { useRef } from "react";

import { useTerminal } from "@/hooks/useTerminal";
import { getAppEnv } from "@/lib/env";

export function TerminalWindow() {
  const containerRef = useRef<HTMLDivElement>(null);
  useTerminal(containerRef);

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
