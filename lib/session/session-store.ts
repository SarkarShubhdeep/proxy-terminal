import { create } from "zustand";

interface SessionState {
  isVfsMounted: boolean;
  vfsFolderId: string | null;
  mountVfs: (folderId: string) => void;
  unmountVfs: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  isVfsMounted: false,
  vfsFolderId: null,
  mountVfs: (folderId) =>
    set({ isVfsMounted: true, vfsFolderId: folderId }),
  unmountVfs: () => set({ isVfsMounted: false, vfsFolderId: null }),
}));
