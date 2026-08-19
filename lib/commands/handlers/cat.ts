import { listFiles, readFile } from "@/lib/drive/drive-api";
import { canReadFile } from "@/lib/drive/filename";
import { findIndexedFile, setFileIndex } from "@/lib/drive/file-index";
import { DriveApiError, type DriveFile } from "@/lib/drive/types";

import { requireMountedSession, type MountedSession } from "../guards";
import type { CommandHandler } from "../types";

async function resolveFile(
  session: MountedSession,
  name: string,
): Promise<DriveFile | undefined> {
  const cached = findIndexedFile(name);
  if (cached) return cached;

  const files = await listFiles(session.token, session.folderId);
  setFileIndex(files);
  return findIndexedFile(name);
}

export const catCommand: CommandHandler = {
  name: "cat",
  description: "Print the contents of a file",
  run: async (ctx) => {
    const name = ctx.args[0];
    if (!name) {
      ctx.writeError("usage: cat <file>");
      return;
    }

    const session = requireMountedSession(ctx);
    if (!session) return;

    try {
      const file = await resolveFile(session, name);
      if (!file) {
        ctx.writeError(`cat: ${name}: no such file`);
        return;
      }

      if (!canReadFile(file.name, file.mimeType)) {
        ctx.writeError("Binary or unsupported file type.");
        return;
      }

      const contents = await readFile(session.token, file.id, file.mimeType);
      if (contents.length > 0) {
        ctx.writeLine(contents);
      }
    } catch (error) {
      ctx.writeError(
        error instanceof DriveApiError ? error.message : "cat: failed to read file.",
      );
    }
  },
};
