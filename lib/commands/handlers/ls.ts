import { listFiles } from "@/lib/drive/drive-api";
import { setFileIndex } from "@/lib/drive/file-index";
import { DriveApiError } from "@/lib/drive/types";

import { requireMountedSession } from "../guards";
import type { CommandHandler } from "../types";

export const lsCommand: CommandHandler = {
  name: "ls",
  description: "List files in the mounted folder",
  run: async (ctx) => {
    const session = requireMountedSession(ctx);
    if (!session) return;

    try {
      const files = await listFiles(session.token, session.folderId);
      setFileIndex(files);

      if (files.length === 0) {
        ctx.writeLine("(empty)");
        return;
      }

      for (const file of files) {
        ctx.writeLine(file.name);
      }
    } catch (error) {
      ctx.writeError(
        error instanceof DriveApiError ? error.message : "ls: failed to list files.",
      );
    }
  },
};
