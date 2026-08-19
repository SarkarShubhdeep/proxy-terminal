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

export function findIndexedFile(name: string): DriveFile | undefined {
  const exact = index.get(name);
  if (exact) return exact;

  const target = name.toLowerCase();
  for (const [key, file] of index) {
    if (key.toLowerCase() === target) return file;
  }

  const dot = name.lastIndexOf(".");
  if (dot > 0) {
    const base = name.slice(0, dot).toLowerCase();
    for (const [key, file] of index) {
      if (key.toLowerCase() === base) return file;
    }
  }

  return undefined;
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
