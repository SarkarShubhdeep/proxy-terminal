import { clearCommand } from "./handlers/clear";
import { helpCommand } from "./handlers/help";
import { loginDriveCommand } from "./handlers/login-drive";
import { logoutCommand } from "./handlers/logout";
import { pwdCommand } from "./handlers/pwd";
import { whoamiCommand } from "./handlers/whoami";
import type { CommandHandler } from "./types";

export const commandRegistry: CommandHandler[] = [
  helpCommand,
  clearCommand,
  loginDriveCommand,
  logoutCommand,
  pwdCommand,
  whoamiCommand,
];
