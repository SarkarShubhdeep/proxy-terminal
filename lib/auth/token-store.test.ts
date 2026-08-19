import { beforeEach, describe, expect, it } from "vitest";

import { useAuthStore } from "./token-store";
import type { AuthToken } from "./types";

function makeToken(expiresInMs: number): AuthToken {
  return {
    accessToken: "test-token",
    expiresAt: Date.now() + expiresInMs,
    scope: "drive.file",
  };
}

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it("starts unauthenticated", () => {
    const store = useAuthStore.getState();
    expect(store.isAuthenticated()).toBe(false);
    expect(store.isExpired()).toBe(true);
    expect(store.status).toBe("idle");
  });

  it("marks the user authenticated after setting a valid token", () => {
    useAuthStore.getState().setToken(makeToken(60_000));
    const store = useAuthStore.getState();
    expect(store.isAuthenticated()).toBe(true);
    expect(store.isExpired()).toBe(false);
    expect(store.status).toBe("authenticated");
  });

  it("treats an expired token as not authenticated", () => {
    useAuthStore.getState().setToken(makeToken(-1_000));
    const store = useAuthStore.getState();
    expect(store.isAuthenticated()).toBe(false);
    expect(store.isExpired()).toBe(true);
  });

  it("clears token, user, and status on clearAuth", () => {
    const store = useAuthStore.getState();
    store.setToken(makeToken(60_000));
    store.setUser({ email: "user@example.com" });
    store.clearAuth();

    const cleared = useAuthStore.getState();
    expect(cleared.token).toBeNull();
    expect(cleared.user).toBeNull();
    expect(cleared.status).toBe("idle");
  });
});
