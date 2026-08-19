import { requireGoogleClientId } from "@/lib/env";

import type { AuthToken } from "./types";

const OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

export class AuthCancelledError extends Error {
  constructor(message = "Authentication cancelled.") {
    super(message);
    this.name = "AuthCancelledError";
  }
}

export class AuthPopupBlockedError extends Error {
  constructor(message = "Popup blocked. Allow popups for this site and retry.") {
    super(message);
    this.name = "AuthPopupBlockedError";
  }
}

function getOAuth2() {
  const oauth2 = window.google?.accounts.oauth2;

  if (!oauth2) {
    throw new Error(
      "Google Identity Services not loaded yet. Check your connection and retry.",
    );
  }

  return oauth2;
}

export function requestAccessToken(): Promise<AuthToken> {
  const clientId = requireGoogleClientId();
  const oauth2 = getOAuth2();

  return new Promise((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: clientId,
      scope: OAUTH_SCOPES,
      callback: (response) => {
        if (response.error) {
          reject(new AuthCancelledError());
          return;
        }
        resolve({
          accessToken: response.access_token,
          expiresAt: Date.now() + response.expires_in * 1000,
          scope: response.scope,
        });
      },
      error_callback: (error) => {
        if (error.type === "popup_closed") {
          reject(new AuthCancelledError());
          return;
        }
        reject(new AuthPopupBlockedError());
      },
    });

    client.requestAccessToken();
  });
}

export function revokeToken(accessToken: string): void {
  window.google?.accounts.oauth2.revoke(accessToken);
}
