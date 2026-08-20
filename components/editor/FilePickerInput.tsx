"use client";

import { useEffect, useRef } from "react";

import { useOverlayStore } from "@/lib/ui/overlay-store";

export function FilePickerInput() {
  const filePick = useOverlayStore((state) => state.filePick);
  const resolveFilePick = useOverlayStore((state) => state.resolveFilePick);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!filePick || !input) return;

    const handleCancel = () => resolveFilePick(null);
    input.addEventListener("cancel", handleCancel);
    input.value = "";
    input.accept = filePick.accept ?? "";
    input.click();

    return () => input.removeEventListener("cancel", handleCancel);
  }, [filePick, resolveFilePick]);

  return (
    <input
      ref={inputRef}
      type="file"
      className="hidden"
      onChange={(event) => resolveFilePick(event.target.files?.[0] ?? null)}
    />
  );
}
