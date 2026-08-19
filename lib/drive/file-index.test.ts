import { beforeEach, describe, expect, it } from "vitest";

import {
  addIndexedFile,
  clearFileIndex,
  findIndexedFile,
  getIndexedFile,
  removeIndexedFile,
  setFileIndex,
} from "./file-index";
import type { DriveFile } from "./types";

function file(name: string, id: string): DriveFile {
  return { id, name, mimeType: "text/plain" };
}

describe("file-index", () => {
  beforeEach(() => {
    clearFileIndex();
  });

  it("sets and reads files by name", () => {
    setFileIndex([file("a.txt", "1"), file("b.md", "2")]);
    expect(getIndexedFile("a.txt")?.id).toBe("1");
    expect(getIndexedFile("b.md")?.id).toBe("2");
  });

  it("replaces the whole index on set", () => {
    setFileIndex([file("a.txt", "1")]);
    setFileIndex([file("b.md", "2")]);
    expect(getIndexedFile("a.txt")).toBeUndefined();
    expect(getIndexedFile("b.md")?.id).toBe("2");
  });

  it("adds and removes individual files", () => {
    addIndexedFile(file("c.txt", "3"));
    expect(getIndexedFile("c.txt")?.id).toBe("3");
    removeIndexedFile("c.txt");
    expect(getIndexedFile("c.txt")).toBeUndefined();
  });

  it("clears the index", () => {
    setFileIndex([file("a.txt", "1")]);
    clearFileIndex();
    expect(getIndexedFile("a.txt")).toBeUndefined();
  });

  it("finds files case-insensitively", () => {
    setFileIndex([file("README.md", "1")]);
    expect(findIndexedFile("readme.md")?.id).toBe("1");
  });

  it("matches a basename when Drive drops the extension", () => {
    setFileIndex([
      {
        id: "1",
        name: "README",
        mimeType: "application/vnd.google-apps.document",
      },
    ]);
    expect(findIndexedFile("README.md")?.id).toBe("1");
  });
});
