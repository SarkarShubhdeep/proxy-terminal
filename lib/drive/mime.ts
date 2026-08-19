export const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";
export const GOOGLE_DOC_MIME_TYPE = "application/vnd.google-apps.document";

const EXTENSION_MIME_TYPES: Record<string, string> = {
  txt: "text/plain",
  md: "text/markdown",
};

export const ALLOWED_TEXT_EXTENSIONS = Object.keys(EXTENSION_MIME_TYPES);

export function mimeTypeForExtension(extension: string): string {
  return EXTENSION_MIME_TYPES[extension] ?? "text/plain";
}

export function isReadableMimeType(mimeType: string): boolean {
  if (mimeType === GOOGLE_DOC_MIME_TYPE) return true;
  return mimeType.startsWith("text/");
}
