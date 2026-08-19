export type NanoKey =
  | { type: "char"; value: string }
  | { type: "text"; value: string }
  | { type: "enter" }
  | { type: "backspace" }
  | { type: "delete" }
  | { type: "left" }
  | { type: "right" }
  | { type: "up" }
  | { type: "down" }
  | { type: "home" }
  | { type: "end" }
  | { type: "pageUp" }
  | { type: "pageDown" }
  | { type: "tab" }
  | { type: "ctrl"; key: string }
  | { type: "unknown" };

const SPECIAL_KEYS: Record<string, NanoKey> = {
  "\r": { type: "enter" },
  "\n": { type: "enter" },
  "\r\n": { type: "enter" },
  "\t": { type: "tab" },
  "\b": { type: "backspace" },
  "\u007f": { type: "backspace" },
  "\x1b[A": { type: "up" },
  "\x1b[B": { type: "down" },
  "\x1b[C": { type: "right" },
  "\x1b[D": { type: "left" },
  "\x1b[H": { type: "home" },
  "\x1b[F": { type: "end" },
  "\x1bOH": { type: "home" },
  "\x1bOF": { type: "end" },
  "\x1b[1~": { type: "home" },
  "\x1b[4~": { type: "end" },
  "\x1b[3~": { type: "delete" },
  "\x1b[5~": { type: "pageUp" },
  "\x1b[6~": { type: "pageDown" },
};

export function parseNanoInput(data: string): NanoKey {
  const special = SPECIAL_KEYS[data];
  if (special) return special;

  if (data.length === 1 && data.charCodeAt(0) < 32) {
    return { type: "ctrl", key: String.fromCharCode(data.charCodeAt(0) + 64).toLowerCase() };
  }

  if (data.startsWith("\x1b")) return { type: "unknown" };
  if (data.length > 1) return { type: "text", value: data };
  if (data >= " ") return { type: "char", value: data };
  return { type: "unknown" };
}
