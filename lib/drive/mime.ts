export const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

const EXTENSION_MIME_TYPES: Record<string, string> = {
  txt: "text/plain",
  md: "text/markdown",
};

export const ALLOWED_TEXT_EXTENSIONS = Object.keys(EXTENSION_MIME_TYPES);

export function mimeTypeForExtension(extension: string): string {
  return EXTENSION_MIME_TYPES[extension] ?? "text/plain";
}
