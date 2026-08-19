import type { CommandHandler } from "../types";

export const helpCommand: CommandHandler = {
  name: "help",
  description: "List available commands",
  run: (ctx) => {
    ctx.writeLine("Available commands:");
    for (const command of ctx.commands) {
      ctx.writeLine(`  ${command.name.padEnd(14)}${command.description}`);
    }
  },
};
