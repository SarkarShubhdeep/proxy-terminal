export interface AuthToken {
  accessToken: string;
  expiresAt: number;
  scope: string;
}

export interface AuthUser {
  email: string;
}

export type AuthStatus = "idle" | "authenticating" | "authenticated" | "error";
