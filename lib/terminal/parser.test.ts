import { describe, expect, it } from "vitest";

import { parseCommand } from "./parser";

describe("parseCommand", () => {
  it("splits a simple command into argv", () => {
    expect(parseCommand("cat notes.txt")).toEqual(["cat", "notes.txt"]);
  });

  it("collapses repeated whitespace", () => {
    expect(parseCommand("  ls    -a   ")).toEqual(["ls", "-a"]);
  });

  it("returns an empty array for blank input", () => {
    expect(parseCommand("   ")).toEqual([]);
  });

  it("keeps double-quoted segments together", () => {
    expect(parseCommand('nano "my file.md"')).toEqual(["nano", "my file.md"]);
  });

  it("keeps single-quoted segments together", () => {
    expect(parseCommand("touch 'a b.txt'")).toEqual(["touch", "a b.txt"]);
  });

  it("supports quotes adjacent to text", () => {
    expect(parseCommand('echo hi"there"')).toEqual(["echo", "hithere"]);
  });
});
