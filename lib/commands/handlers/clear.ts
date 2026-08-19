import type { CommandHandler } from "../types";

export const clearCommand: CommandHandler = {
  name: "clear",
  description: "Clear the terminal screen",
  run: (ctx) => {
    ctx.clearScreen();
  },
};
