"use client";

import "@xterm/xterm/css/xterm.css";

import { useRef } from "react";

import { FilePickerInput } from "@/components/editor/FilePickerInput";
import { useTerminal } from "@/hooks/useTerminal";

export function TerminalWindow() {
  const containerRef = useRef<HTMLDivElement>(null);
  useTerminal(containerRef);

  return (
    <>
      <div
        ref={containerRef}
        className="h-dvh w-full overflow-hidden bg-[#0d1117]"
      />
      <FilePickerInput />
    </>
  );
}
