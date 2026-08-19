import { afterEach, describe, expect, it, vi } from "vitest";

import { driveFetch } from "./client";
import { DriveApiError } from "./types";

function errorResponse(body: unknown, status: number): Response {
  return {
    ok: false,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("driveFetch error messages", () => {
  it("explains when Drive API is disabled", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      errorResponse(
        {
          error: {
            message:
              "Google Drive API has not been used in project 123 before or it is disabled. Enable it by visiting ...",
          },
        },
        403,
      ),
    );

    await expect(driveFetch("/drive/v3/files", "token")).rejects.toMatchObject({
      kind: "forbidden",
      message: expect.stringContaining("Google Drive API is disabled"),
    });
  });

  it("explains when OAuth scopes are insufficient", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      errorResponse(
        {
          error: {
            message: "Request had insufficient authentication scopes.",
            details: [{ reason: "ACCESS_TOKEN_SCOPE_INSUFFICIENT" }],
          },
        },
        403,
      ),
    );

    await expect(driveFetch("/drive/v3/files", "token")).rejects.toMatchObject({
      kind: "forbidden",
      message: expect.stringContaining("Drive access not granted"),
    });
  });

  it("falls back to a generic forbidden message", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      errorResponse({}, 403),
    );

    await expect(driveFetch("/drive/v3/files", "token")).rejects.toBeInstanceOf(
      DriveApiError,
    );
  });
});
