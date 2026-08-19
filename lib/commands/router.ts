import { commandRegistry } from "./registry";
import type { CommandIO, CommandMeta } from "./types";

function commandList(): CommandMeta[] {
  return commandRegistry.map(({ name, description }) => ({ name, description }));
}

export async function dispatchCommand(
  argv: string[],
  io: CommandIO,
): Promise<void> {
  const [name, ...args] = argv;
  const handler = commandRegistry.find((command) => command.name === name);

  if (!handler) {
    io.writeError(
      `command not found: ${name}. Type 'help' for available commands.`,
    );
    return;
  }

  await handler.run({ ...io, args, commands: commandList() });
}
