import { createFile } from "@/lib/drive/drive-api";
import { addIndexedFile, getIndexedFile } from "@/lib/drive/file-index";
import { validateFilename } from "@/lib/drive/filename";
import { DriveApiError } from "@/lib/drive/types";

import { requireMountedSession } from "../guards";
import type { CommandHandler } from "../types";

export const touchCommand: CommandHandler = {
  name: "touch",
  description: "Create a new empty file",
  run: async (ctx) => {
    const name = ctx.args[0];
    if (!name) {
      ctx.writeError("usage: touch <file>");
      return;
    }

    const validationError = validateFilename(name);
    if (validationError) {
      ctx.writeError(validationError);
      return;
    }

    const session = requireMountedSession(ctx);
    if (!session) return;

    if (getIndexedFile(name)) {
      ctx.writeLine("File already exists.");
      return;
    }

    try {
      const file = await createFile(session.token, session.folderId, name, "");
      addIndexedFile(file);
      ctx.writeSuccess(`Created ${name}`);
    } catch (error) {
      ctx.writeError(
        error instanceof DriveApiError
          ? error.message
          : "touch: failed to create file.",
      );
    }
  },
};
