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

interface GoogleApiErrorBody {
  error?: {
    message?: string;
    errors?: Array<{ reason?: string }>;
    details?: Array<{ reason?: string }>;
  };
}

async function errorMessageForResponse(response: Response): Promise<string> {
  const kind = errorKindForStatus(response.status);
  const fallback = errorMessageForKind(kind);

  try {
    const body = (await response.json()) as GoogleApiErrorBody;
    const apiMessage = body.error?.message;
    const reason =
      body.error?.details?.[0]?.reason ?? body.error?.errors?.[0]?.reason;

    if (
      reason === "ACCESS_TOKEN_SCOPE_INSUFFICIENT" ||
      apiMessage?.toLowerCase().includes("insufficient authentication scopes")
    ) {
      return "Drive access not granted for this session. Revoke Proxy-terminal at https://myaccount.google.com/permissions and run login-drive again.";
    }

    if (
      apiMessage?.includes("has not been used") ||
      apiMessage?.includes("is disabled")
    ) {
      return "Google Drive API is disabled for this Cloud project. Enable it under APIs & Services → Library → Google Drive API.";
    }

    if (apiMessage) {
      return apiMessage;
    }
  } catch {
    // Ignore non-JSON error bodies.
  }

  return fallback;
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
    const message = await errorMessageForResponse(response);
    throw new DriveApiError(kind, message);
  }

  return response;
}
