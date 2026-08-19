import { describe, expect, it } from "vitest";

import { parseNanoInput } from "./keys";

describe("parseNanoInput", () => {
  it("maps arrows, enter, and backspace", () => {
    expect(parseNanoInput("\x1b[A")).toEqual({ type: "up" });
    expect(parseNanoInput("\r")).toEqual({ type: "enter" });
    expect(parseNanoInput("\u007f")).toEqual({ type: "backspace" });
  });

  it("maps control characters to ctrl keys", () => {
    expect(parseNanoInput("\u0018")).toEqual({ type: "ctrl", key: "x" });
    expect(parseNanoInput("\u000f")).toEqual({ type: "ctrl", key: "o" });
    expect(parseNanoInput("\u0007")).toEqual({ type: "ctrl", key: "g" });
    expect(parseNanoInput("\u000b")).toEqual({ type: "ctrl", key: "k" });
  });

  it("treats a paste chunk as text", () => {
    expect(parseNanoInput("hello\nworld")).toEqual({
      type: "text",
      value: "hello\nworld",
    });
  });
});
