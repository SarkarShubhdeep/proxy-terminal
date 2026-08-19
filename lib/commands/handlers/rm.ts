import { deleteFile, listFiles } from "@/lib/drive/drive-api";
import {
  getIndexedFile,
  removeIndexedFile,
  setFileIndex,
} from "@/lib/drive/file-index";
import { DriveApiError } from "@/lib/drive/types";

import { requireMountedSession, type MountedSession } from "../guards";
import type { CommandHandler } from "../types";

async function resolveFileId(
  session: MountedSession,
  name: string,
): Promise<string | undefined> {
  const cached = getIndexedFile(name);
  if (cached) return cached.id;

  const files = await listFiles(session.token, session.folderId);
  setFileIndex(files);
  return getIndexedFile(name)?.id;
}

export const rmCommand: CommandHandler = {
  name: "rm",
  description: "Delete a file",
  run: async (ctx) => {
    const name = ctx.args[0];
    if (!name) {
      ctx.writeError("usage: rm <file>");
      return;
    }

    const session = requireMountedSession(ctx);
    if (!session) return;

    try {
      const fileId = await resolveFileId(session, name);
      if (!fileId) {
        ctx.writeError(`rm: ${name}: no such file`);
        return;
      }

      await deleteFile(session.token, fileId);
      removeIndexedFile(name);
      ctx.writeSuccess(`Removed ${name}`);
    } catch (error) {
      ctx.writeError(
        error instanceof DriveApiError ? error.message : "rm: failed to delete file.",
      );
    }
  },
};
