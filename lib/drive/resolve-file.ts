import type { MountedSession } from "@/lib/commands/guards";

import { listFiles } from "./drive-api";
import { findIndexedFile, setFileIndex } from "./file-index";
import type { DriveFile } from "./types";

export async function resolveFile(
  session: MountedSession,
  name: string,
): Promise<DriveFile | undefined> {
  const cached = findIndexedFile(name);
  if (cached) return cached;

  const files = await listFiles(session.token, session.folderId);
  setFileIndex(files);
  return findIndexedFile(name);
}
