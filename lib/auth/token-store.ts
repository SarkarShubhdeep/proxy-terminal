import { create } from "zustand";

import type { AuthStatus, AuthToken, AuthUser } from "./types";

interface AuthState {
  token: AuthToken | null;
  user: AuthUser | null;
  status: AuthStatus;
  setToken: (token: AuthToken) => void;
  setUser: (user: AuthUser) => void;
  setStatus: (status: AuthStatus) => void;
  clearAuth: () => void;
  isExpired: () => boolean;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  status: "idle",
  setToken: (token) => set({ token, status: "authenticated" }),
  setUser: (user) => set({ user }),
  setStatus: (status) => set({ status }),
  clearAuth: () => set({ token: null, user: null, status: "idle" }),
  isExpired: () => {
    const { token } = get();
    return !token || token.expiresAt <= Date.now();
  },
  isAuthenticated: () => {
    const { token } = get();
    return token !== null && token.expiresAt > Date.now();
  },
}));
