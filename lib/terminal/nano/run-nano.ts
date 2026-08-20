import type { Terminal } from "@xterm/xterm";

import {
  backspace,
  bufferText,
  createBuffer,
  cutLine,
  deleteForward,
  ensureVisible,
  insertText,
  moveDown,
  moveEnd,
  moveHome,
  moveLeft,
  moveRight,
  moveUp,
  pageDown,
  pageUp,
  type NanoBuffer,
} from "./buffer";
import { parseNanoInput, type NanoKey } from "./keys";
import type { EditorRequest } from "./types";

type Mode = "edit" | "exit-confirm" | "help";

interface Session {
  buffer: NanoBuffer;
  filename: string;
  original: string;
  lastSaved: string;
  cut: string;
  mode: Mode;
  status: string;
}

const HELP_LINES = [
  "Nano help",
  "",
  "^G  Display this help text",
  "^X  Close the buffer (ask to save if modified)",
  "^O  Write the current buffer to Drive on exit",
  "^K  Cut the current line",
  "^U  Uncut (paste) the last cut",
  "^A  Start of line          ^E  End of line",
  "",
  "Arrows, Backspace, Delete, Tab, PgUp/PgDn",
  "Press any key to continue",
];

function inverse(text: string): string {
  return `\x1b[7m${text}\x1b[0m`;
}

function move(row: number, col: number): string {
  return `\x1b[${row};${col}H`;
}

function pad(text: string, width: number): string {
  if (text.length >= width) return text.slice(0, width);
  return text + " ".repeat(width - text.length);
}

function shortcut(key: string, label: string, width: number): string {
  return inverse(key) + pad(` ${label}`, Math.max(0, width - key.length));
}

function viewSize(terminal: Terminal): { rows: number; cols: number } {
  return {
    rows: Math.max(1, terminal.rows - 4),
    cols: Math.max(1, terminal.cols),
  };
}

function lineCount(text: string): number {
  return text.split("\n").length;
}

function isDirty(session: Session): boolean {
  return bufferText(session.buffer) !== session.lastSaved;
}

function exitValue(session: Session, saved: boolean): string | null {
  const text = saved ? bufferText(session.buffer) : session.lastSaved;
  return text === session.original ? null : text;
}

function renderTitle(session: Session, cols: number): string {
  const dirty = isDirty(session) ? " *" : "";
  const label = `  nano    ${session.filename}${dirty}`;
  return inverse(pad(label, cols));
}

function renderHelp(cols: number): string {
  const third = Math.max(12, Math.floor(cols / 3));
  const top =
    shortcut("^G", "Help", third) +
    shortcut("^O", "Write Out", third) +
    shortcut("^K", "Cut Text", cols - 2 * third);
  const bottom =
    shortcut("^X", "Exit", third) +
    shortcut("^A", "Home", third) +
    shortcut("^U", "Uncut Text", cols - 2 * third);
  return `${top}\r\n${bottom}`;
}

function renderContent(session: Session, rows: number, cols: number): string {
  const { buffer } = session;
  const source = session.mode === "help" ? HELP_LINES : buffer.lines;
  const scroll = session.mode === "help" ? 0 : buffer.scrollRow;
  const hScroll = session.mode === "help" ? 0 : buffer.scrollCol;
  const out: string[] = [];

  for (let i = 0; i < rows; i += 1) {
    const line = source[scroll + i] ?? "";
    out.push(pad(line.slice(hScroll, hScroll + cols), cols));
  }
  return out.join("\r\n");
}

function render(terminal: Terminal, session: Session): void {
  const { rows, cols } = viewSize(terminal);
  ensureVisible(session.buffer, rows, cols);

  const status =
    session.mode === "exit-confirm"
      ? "Save modified buffer? (Y)es, (N)o, ^C cancel"
      : pad(session.status, cols);

  const screen = [
    `\x1b[H\x1b[2J${renderTitle(session, cols)}`,
    renderContent(session, rows, cols),
    inverse(status),
    renderHelp(cols),
  ].join("\r\n");

  const cursorRow = 2 + (session.buffer.row - session.buffer.scrollRow);
  const cursorCol = 1 + (session.buffer.col - session.buffer.scrollCol);
  terminal.write(
    session.mode === "edit"
      ? `${screen}${move(cursorRow, cursorCol)}`
      : screen,
  );
}

function applyEdit(session: Session, key: NanoKey, viewRows: number): void {
  const { buffer } = session;
  switch (key.type) {
    case "char":
      insertText(buffer, key.value);
      break;
    case "text":
      insertText(buffer, key.value);
      break;
    case "tab":
      insertText(buffer, "    ");
      break;
    case "enter":
      insertText(buffer, "\n");
      break;
    case "backspace":
      backspace(buffer);
      break;
    case "delete":
      deleteForward(buffer);
      break;
    case "left":
      moveLeft(buffer);
      break;
    case "right":
      moveRight(buffer);
      break;
    case "up":
      moveUp(buffer);
      break;
    case "down":
      moveDown(buffer);
      break;
    case "home":
      moveHome(buffer);
      break;
    case "end":
      moveEnd(buffer);
      break;
    case "pageUp":
      pageUp(buffer, viewRows);
      break;
    case "pageDown":
      pageDown(buffer, viewRows);
      break;
    default:
      break;
  }
  session.status = "";
}

function handleCtrl(
  session: Session,
  key: string,
  finish: (value: string | null) => void,
): boolean {
  if (key === "g") {
    session.mode = "help";
    session.status = "Press any key to continue";
    return true;
  }
  if (key === "x") {
    if (!isDirty(session)) {
      finish(exitValue(session, false));
      return true;
    }
    session.mode = "exit-confirm";
    return true;
  }
  if (key === "o") {
    session.lastSaved = bufferText(session.buffer);
    session.status = `[ Wrote ${lineCount(session.lastSaved)} lines ]`;
    return true;
  }
  if (key === "k") {
    session.cut = cutLine(session.buffer);
    session.status = "";
    return true;
  }
  if (key === "u") {
    insertText(session.buffer, session.cut);
    session.status = "";
    return true;
  }
  if (key === "a") {
    moveHome(session.buffer);
    return true;
  }
  if (key === "e") {
    moveEnd(session.buffer);
    return true;
  }
  if (key === "l") {
    session.status = "";
    return true;
  }
  return false;
}

function handleKey(
  session: Session,
  key: NanoKey,
  viewRows: number,
  finish: (value: string | null) => void,
): void {
  if (session.mode === "help") {
    session.mode = "edit";
    session.status = "";
    return;
  }

  if (session.mode === "exit-confirm") {
    if (key.type === "char" && key.value.toLowerCase() === "y") {
      finish(exitValue(session, true));
      return;
    }
    if (key.type === "char" && key.value.toLowerCase() === "n") {
      finish(exitValue(session, false));
      return;
    }
    if (key.type === "ctrl" && key.key === "c") {
      session.mode = "edit";
      session.status = "";
    }
    return;
  }

  if (key.type === "ctrl") {
    handleCtrl(session, key.key, finish);
    return;
  }

  applyEdit(session, key, viewRows);
}

export function runNanoEditor(
  terminal: Terminal,
  request: EditorRequest,
): Promise<string | null> {
  const previousConvertEol = terminal.options.convertEol;
  terminal.options.convertEol = false;
  terminal.write("\x1b[?1049h\x1b[?25h");

  const session: Session = {
    buffer: createBuffer(request.content),
    filename: request.filename,
    original: request.content,
    lastSaved: request.content,
    cut: "",
    mode: "edit",
    status: `[ Read ${lineCount(request.content)} lines ]`,
  };

  return new Promise((resolve) => {
    let settled = false;

    const finish = (value: string | null) => {
      if (settled) return;
      settled = true;
      dataListener.dispose();
      resizeListener.dispose();
      terminal.write("\x1b[?1049l");
      terminal.options.convertEol = previousConvertEol;
      resolve(value);
    };

    const redraw = () => render(terminal, session);
    const dataListener = terminal.onData((data) => {
      handleKey(session, parseNanoInput(data), viewSize(terminal).rows, finish);
      if (!settled) redraw();
    });
    const resizeListener = terminal.onResize(() => redraw());
    redraw();
  });
}
