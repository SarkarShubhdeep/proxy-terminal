import { describe, expect, it } from "vitest";

import { getExtension, isTextFile, validateFilename } from "./filename";

describe("getExtension", () => {
  it("returns the lowercased extension", () => {
    expect(getExtension("Notes.MD")).toBe("md");
  });

  it("returns null for names without an extension", () => {
    expect(getExtension("README")).toBeNull();
  });

  it("returns null for dotfiles with no extension", () => {
    expect(getExtension(".gitignore")).toBeNull();
  });

  it("returns null when the name ends with a dot", () => {
    expect(getExtension("file.")).toBeNull();
  });
});

describe("isTextFile", () => {
  it("accepts .txt and .md", () => {
    expect(isTextFile("a.txt")).toBe(true);
    expect(isTextFile("b.md")).toBe(true);
  });

  it("rejects other extensions", () => {
    expect(isTextFile("c.doc")).toBe(false);
    expect(isTextFile("d.png")).toBe(false);
  });
});

describe("validateFilename", () => {
  it("returns null for a valid name", () => {
    expect(validateFilename("notes.md")).toBeNull();
  });

  it("rejects empty names", () => {
    expect(validateFilename("   ")).toMatch(/empty/i);
  });

  it("rejects path separators", () => {
    expect(validateFilename("dir/notes.md")).toMatch(/path separators/i);
  });

  it("rejects parent traversal", () => {
    expect(validateFilename("..notes.md")).toMatch(/'\.\.'/);
  });

  it("rejects unsupported extensions", () => {
    expect(validateFilename("notes.doc")).toMatch(/supported/i);
  });
});
