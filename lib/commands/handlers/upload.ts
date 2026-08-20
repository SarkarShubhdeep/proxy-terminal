import { uploadFile } from "@/lib/drive/drive-api";
import { addIndexedFile, getIndexedFile } from "@/lib/drive/file-index";
import { validateFilename } from "@/lib/drive/filename";
import { DriveApiError } from "@/lib/drive/types";

import { requireMountedSession } from "../guards";
import type { CommandHandler } from "../types";

export const uploadCommand: CommandHandler = {
  name: "upload",
  description: "Upload a file from your computer",
  run: async (ctx) => {
    const session = requireMountedSession(ctx);
    if (!session) return;

    const file = await ctx.pickFile(".txt,.md");
    if (!file) return;

    const validationError = validateFilename(file.name);
    if (validationError) {
      ctx.writeError(validationError);
      return;
    }

    if (getIndexedFile(file.name)) {
      ctx.writeError(`File already exists. Use nano to edit ${file.name}.`);
      return;
    }

    try {
      const created = await uploadFile(session.token, session.folderId, file);
      addIndexedFile(created);
      ctx.writeSuccess(`Uploaded ${file.name}`);
    } catch (error) {
      ctx.writeError(
        error instanceof DriveApiError ? error.message : "upload: failed to upload file.",
      );
    }
  },
};
