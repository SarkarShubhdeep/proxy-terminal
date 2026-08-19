import { listFiles, readFile } from "@/lib/drive/drive-api";
import { getIndexedFile, setFileIndex } from "@/lib/drive/file-index";
import { isTextFile } from "@/lib/drive/filename";
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

    if (!isTextFile(name)) {
      ctx.writeError("Binary or unsupported file type.");
      return;
    }

    try {
      const fileId = await resolveFileId(session, name);
      if (!fileId) {
        ctx.writeError(`cat: ${name}: no such file`);
        return;
      }

      const contents = await readFile(session.token, fileId);
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
