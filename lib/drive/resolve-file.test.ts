import { beforeEach, describe, expect, it, vi } from "vitest";

import { clearFileIndex, setFileIndex } from "./file-index";
import { resolveFile } from "./resolve-file";

const listFiles = vi.hoisted(() => vi.fn());

vi.mock("./drive-api", () => ({ listFiles }));

const session = { token: "token", folderId: "folder-1" };

describe("resolveFile", () => {
  beforeEach(() => {
    listFiles.mockReset();
    clearFileIndex();
  });

  it("returns a cache hit without listing Drive", async () => {
    setFileIndex([{ id: "1", name: "notes.md", mimeType: "text/markdown" }]);
    const file = await resolveFile(session, "notes.md");
    expect(file?.id).toBe("1");
    expect(listFiles).not.toHaveBeenCalled();
  });

  it("falls back to listing Drive and indexes the result", async () => {
    listFiles.mockResolvedValueOnce([
      { id: "2", name: "readme.txt", mimeType: "text/plain" },
    ]);
    const file = await resolveFile(session, "readme.txt");
    expect(listFiles).toHaveBeenCalledWith("token", "folder-1");
    expect(file?.id).toBe("2");
  });

  it("returns undefined when the file is missing", async () => {
    listFiles.mockResolvedValueOnce([]);
    const file = await resolveFile(session, "missing.txt");
    expect(file).toBeUndefined();
  });
});
