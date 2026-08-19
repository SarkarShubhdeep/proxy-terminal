import { DriveApiError, type DriveErrorKind } from "./types";

const DRIVE_ORIGIN = "https://www.googleapis.com";

function errorKindForStatus(status: number): DriveErrorKind {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not-found";
  return "unknown";
}

function errorMessageForKind(kind: DriveErrorKind): string {
  switch (kind) {
    case "unauthorized":
      return "Session expired. Run login-drive again.";
    case "not-found":
      return "File not found.";
    case "forbidden":
      return "Permission denied.";
    case "network":
      return "Network error. Check your connection.";
    default:
      return "Drive request failed.";
  }
}

export async function driveFetch(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<Response> {
  const url = path.startsWith("http") ? path : `${DRIVE_ORIGIN}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...init.headers,
      },
    });
  } catch {
    throw new DriveApiError("network", errorMessageForKind("network"));
  }

  if (!response.ok) {
    const kind = errorKindForStatus(response.status);
    throw new DriveApiError(kind, errorMessageForKind(kind));
  }

  return response;
}
