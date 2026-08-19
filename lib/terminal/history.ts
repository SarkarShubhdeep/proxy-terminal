const MAX_HISTORY = 100;

export interface CommandHistory {
  push(command: string): void;
  navigate(direction: "up" | "down"): string | null;
  resetDraft(): void;
}

export function createCommandHistory(): CommandHistory {
  const entries: string[] = [];
  let index = 0;

  return {
    push(command) {
      const trimmed = command.trim();
      if (!trimmed) return;
      if (entries.at(-1) === trimmed) {
        index = entries.length;
        return;
      }
      entries.push(trimmed);
      if (entries.length > MAX_HISTORY) entries.shift();
      index = entries.length;
    },
    navigate(direction) {
      if (entries.length === 0) return "";

      if (direction === "up") {
        index = Math.max(0, index - 1);
        return entries[index] ?? "";
      }

      index = Math.min(entries.length, index + 1);
      if (index >= entries.length) return "";
      return entries[index] ?? "";
    },
    resetDraft() {
      index = entries.length;
    },
  };
}
