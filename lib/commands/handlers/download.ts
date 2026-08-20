import { downloadFile } from "@/lib/drive/drive-api";
import { canReadFile } from "@/lib/drive/filename";
import { resolveFile } from "@/lib/drive/resolve-file";
import { DriveApiError } from "@/lib/drive/types";

import { requireMountedSession } from "../guards";
import type { CommandHandler } from "../types";

export const downloadCommand: CommandHandler = {
  name: "download",
  description: "Download a file to your computer",
  run: async (ctx) => {
    const name = ctx.args[0];
    if (!name) {
      ctx.writeError("usage: download <file>");
      return;
    }

    const session = requireMountedSession(ctx);
    if (!session) return;

    try {
      const file = await resolveFile(session, name);
      if (!file) {
        ctx.writeError(`download: ${name}: no such file`);
        return;
      }

      if (!canReadFile(file.name, file.mimeType)) {
        ctx.writeError("Binary or unsupported file type.");
        return;
      }

      await downloadFile(session.token, file.id, file.name, file.mimeType);
      ctx.writeSuccess(`Downloaded ${file.name}`);
    } catch (error) {
      ctx.writeError(
        error instanceof DriveApiError
          ? error.message
          : "download: failed to download file.",
      );
    }
  },
};
