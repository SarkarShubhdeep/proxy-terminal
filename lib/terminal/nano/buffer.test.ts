import { describe, expect, it } from "vitest";

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
} from "./buffer";

describe("nano buffer", () => {
  it("round-trips content including a trailing newline", () => {
    const buffer = createBuffer("hello\nworld\n");
    expect(bufferText(buffer)).toBe("hello\nworld\n");
  });

  it("inserts characters and splits lines on newline", () => {
    const buffer = createBuffer("ab");
    buffer.col = 1;
    insertText(buffer, "x");
    expect(bufferText(buffer)).toBe("axb");
    insertText(buffer, "\ncd");
    expect(bufferText(buffer)).toBe("ax\ncdb");
    expect(buffer.row).toBe(1);
    expect(buffer.col).toBe(2);
  });

  it("backspaces across a line boundary", () => {
    const buffer = createBuffer("ab\ncd");
    buffer.row = 1;
    buffer.col = 0;
    backspace(buffer);
    expect(bufferText(buffer)).toBe("abcd");
    expect(buffer.row).toBe(0);
    expect(buffer.col).toBe(2);
  });

  it("deletes forward across a line boundary", () => {
    const buffer = createBuffer("ab\ncd");
    buffer.col = 2;
    deleteForward(buffer);
    expect(bufferText(buffer)).toBe("abcd");
  });

  it("moves around wrapped line ends", () => {
    const buffer = createBuffer("ab\ncd");
    moveEnd(buffer);
    moveRight(buffer);
    expect(buffer.row).toBe(1);
    expect(buffer.col).toBe(0);
    moveLeft(buffer);
    expect(buffer.row).toBe(0);
    expect(buffer.col).toBe(2);
    moveHome(buffer);
    moveDown(buffer);
    expect(buffer.row).toBe(1);
    moveUp(buffer);
    expect(buffer.row).toBe(0);
  });

  it("cuts the current line and leaves a blank document when it is the last line", () => {
    const buffer = createBuffer("only");
    expect(cutLine(buffer)).toBe("only\n");
    expect(bufferText(buffer)).toBe("");
  });

  it("keeps the cursor in view", () => {
    const buffer = createBuffer("a\nb\nc\nd");
    buffer.row = 3;
    buffer.col = 1;
    ensureVisible(buffer, 2, 1);
    expect(buffer.scrollRow).toBe(2);
    expect(buffer.scrollCol).toBe(1);
  });
});
