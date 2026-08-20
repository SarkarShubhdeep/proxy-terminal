import { create } from "zustand";

interface FilePickState {
  accept?: string;
  resolve: (value: File | null) => void;
}

interface OverlayState {
  filePick: FilePickState | null;
  pickFile: (accept?: string) => Promise<File | null>;
  resolveFilePick: (value: File | null) => void;
}

export const useOverlayStore = create<OverlayState>((set, get) => ({
  filePick: null,
  pickFile: (accept) =>
    new Promise<File | null>((resolve) => {
      set({ filePick: { accept, resolve } });
    }),
  resolveFilePick: (value) => {
    const { filePick } = get();
    if (!filePick) return;
    filePick.resolve(value);
    set({ filePick: null });
  },
}));
