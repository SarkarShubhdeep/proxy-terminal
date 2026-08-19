export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
}

export interface DriveFolder {
  id: string;
  name: string;
}

export type DriveErrorKind =
  | "unauthorized"
  | "not-found"
  | "forbidden"
  | "network"
  | "unknown";

export class DriveApiError extends Error {
  readonly kind: DriveErrorKind;

  constructor(kind: DriveErrorKind, message: string) {
    super(message);
    this.name = "DriveApiError";
    this.kind = kind;
  }
}
