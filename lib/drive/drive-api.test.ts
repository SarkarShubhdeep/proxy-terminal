import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createFile,
  deleteFile,
  initVfs,
  listFiles,
  readFile,
} from "./drive-api";
import { DriveApiError } from "./types";

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
  } as Response;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("initVfs", () => {
  it("returns the existing folder id when found", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ files: [{ id: "folder-1" }] }));

    const id = await initVfs("token", "WebTerminal");
    expect(id).toBe("folder-1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("creates the folder when missing", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ files: [] }))
      .mockResolvedValueOnce(jsonResponse({ id: "new-folder" }));

    const id = await initVfs("token", "WebTerminal");
    expect(id).toBe("new-folder");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, createCall] = fetchMock.mock.calls;
    expect(createCall[1]?.method).toBe("POST");
  });
});

describe("listFiles", () => {
  it("returns the files array", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonResponse({ files: [{ id: "1", name: "a.txt", mimeType: "text/plain" }] }),
    );
    const files = await listFiles("token", "folder-1");
    expect(files).toHaveLength(1);
    expect(files[0].name).toBe("a.txt");
  });

  it("returns an empty array when no files field", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(jsonResponse({}));
    const files = await listFiles("token", "folder-1");
    expect(files).toEqual([]);
  });
});

describe("readFile", () => {
  it("returns the raw text body", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonResponse("hello world"),
    );
    const text = await readFile("token", "file-1");
    expect(text).toBe("hello world");
  });

  it("exports Google Docs as plain text", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonResponse("# Title"),
    );
    const text = await readFile(
      "token",
      "file-1",
      "application/vnd.google-apps.document",
    );
    expect(text).toBe("# Title");
    expect(fetchMock.mock.calls[0][0]).toContain("/export?mimeType=text/plain");
  });
});

describe("createFile", () => {
  it("posts multipart content and returns the file", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        jsonResponse({ id: "file-1", name: "notes.md", mimeType: "text/markdown" }),
      );
    const file = await createFile("token", "folder-1", "notes.md", "");
    expect(file.id).toBe("file-1");
    const [, init] = fetchMock.mock.calls[0];
    expect(init?.method).toBe("POST");
    expect(String(init?.headers && (init.headers as Record<string, string>)["Content-Type"])).toContain(
      "multipart/related",
    );
  });
});

describe("deleteFile", () => {
  it("issues a DELETE request", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({}, true, 204));
    await deleteFile("token", "file-1");
    const [, init] = fetchMock.mock.calls[0];
    expect(init?.method).toBe("DELETE");
  });
});

describe("error handling", () => {
  it("maps 401 to an unauthorized DriveApiError", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonResponse({}, false, 401),
    );
    await expect(listFiles("token", "folder-1")).rejects.toBeInstanceOf(
      DriveApiError,
    );
  });

  it("maps a thrown fetch to a network error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("offline"));
    await expect(listFiles("token", "folder-1")).rejects.toMatchObject({
      kind: "network",
    });
  });
});
