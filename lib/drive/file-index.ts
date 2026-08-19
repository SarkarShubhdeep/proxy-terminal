import type { DriveFile } from "./types";

const index = new Map<string, DriveFile>();

export function setFileIndex(files: DriveFile[]): void {
  index.clear();
  for (const file of files) {
    index.set(file.name, file);
  }
}

export function getIndexedFile(name: string): DriveFile | undefined {
  return index.get(name);
}

export function addIndexedFile(file: DriveFile): void {
  index.set(file.name, file);
}

export function removeIndexedFile(name: string): void {
  index.delete(name);
}

export function clearFileIndex(): void {
  index.clear();
}
