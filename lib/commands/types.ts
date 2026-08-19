import type { EditorRequest } from "@/lib/terminal/nano/types";

export interface CommandMeta {
  name: string;
  description: string;
}

export interface CommandIO {
  writeLine: (text: string) => void;
  writeError: (text: string) => void;
  writeSuccess: (text: string) => void;
  clearScreen: () => void;
  openEditor: (request: EditorRequest) => Promise<string | null>;
  pickFile: (accept?: string) => Promise<File | null>;
}

export interface CommandContext extends CommandIO {
  args: string[];
  commands: CommandMeta[];
}

export interface CommandHandler extends CommandMeta {
  run: (ctx: CommandContext) => Promise<void> | void;
}
