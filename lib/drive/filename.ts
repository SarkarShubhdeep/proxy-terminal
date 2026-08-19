import { ALLOWED_TEXT_EXTENSIONS } from "./mime";

export function getExtension(name: string): string | null {
  const dot = name.lastIndexOf(".");
  if (dot <= 0 || dot === name.length - 1) return null;
  return name.slice(dot + 1).toLowerCase();
}

export function isTextFile(name: string): boolean {
  const extension = getExtension(name);
  return extension !== null && ALLOWED_TEXT_EXTENSIONS.includes(extension);
}

export function validateFilename(name: string): string | null {
  if (!name || !name.trim()) {
    return "Filename cannot be empty.";
  }
  if (name.includes("/") || name.includes("\\")) {
    return "Filename cannot contain path separators.";
  }
  if (name.includes("..")) {
    return "Filename cannot contain '..'.";
  }
  if (!isTextFile(name)) {
    return `Only ${ALLOWED_TEXT_EXTENSIONS.map((ext) => `.${ext}`).join(" and ")} files are supported.`;
  }
  return null;
}
