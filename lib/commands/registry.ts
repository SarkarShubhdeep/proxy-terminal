import { helpCommand } from "./handlers/help";
import { loginDriveCommand } from "./handlers/login-drive";
import { logoutCommand } from "./handlers/logout";
import { whoamiCommand } from "./handlers/whoami";
import type { CommandHandler } from "./types";

export const commandRegistry: CommandHandler[] = [
  helpCommand,
  loginDriveCommand,
  logoutCommand,
  whoamiCommand,
];
