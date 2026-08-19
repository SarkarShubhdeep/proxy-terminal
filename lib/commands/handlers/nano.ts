import { createFile, readFile, writeFile } from "@/lib/drive/drive-api";
import { canReadFile, validateFilename } from "@/lib/drive/filename";
import { addIndexedFile } from "@/lib/drive/file-index";
import { resolveFile } from "@/lib/drive/resolve-file";
import { DriveApiError } from "@/lib/drive/types";

import { requireMountedSession } from "../guards";
import type { CommandHandler } from "../types";

export const nanoCommand: CommandHandler = {
  name: "nano",
  description: "Edit a file in the terminal",
  run: async (ctx) => {
    const name = ctx.args[0];
    if (!name) {
      ctx.writeError("usage: nano <file>");
      return;
    }

    const validationError = validateFilename(name);
    if (validationError) {
      ctx.writeError(validationError);
      return;
    }

    const session = requireMountedSession(ctx);
    if (!session) return;

    try {
      const existing = await resolveFile(session, name);

      let initialContent = "";
      if (existing) {
        if (!canReadFile(existing.name, existing.mimeType)) {
          ctx.writeError("Binary or unsupported file type.");
          return;
        }
        initialContent = await readFile(session.token, existing.id, existing.mimeType);
      }

      const edited = await ctx.openEditor({ filename: name, content: initialContent });
      if (edited === null) return;

      if (existing) {
        await writeFile(session.token, existing.id, edited);
      } else {
        const file = await createFile(session.token, session.folderId, name, edited);
        addIndexedFile(file);
      }

      ctx.writeSuccess(`Saved ${name}`);
    } catch (error) {
      ctx.writeError(
        error instanceof DriveApiError ? error.message : "nano: failed to save file.",
      );
    }
  },
};
