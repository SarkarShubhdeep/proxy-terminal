export interface CommandMeta {
  name: string;
  description: string;
}

export interface CommandIO {
  writeLine: (text: string) => void;
  writeError: (text: string) => void;
  writeSuccess: (text: string) => void;
}

export interface CommandContext extends CommandIO {
  args: string[];
  commands: CommandMeta[];
}

export interface CommandHandler extends CommandMeta {
  run: (ctx: CommandContext) => Promise<void> | void;
}
