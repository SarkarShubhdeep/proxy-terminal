import { catCommand } from "./handlers/cat";
import { clearCommand } from "./handlers/clear";
import { helpCommand } from "./handlers/help";
import { loginDriveCommand } from "./handlers/login-drive";
import { logoutCommand } from "./handlers/logout";
import { lsCommand } from "./handlers/ls";
import { pwdCommand } from "./handlers/pwd";
import { rmCommand } from "./handlers/rm";
import { touchCommand } from "./handlers/touch";
import { whoamiCommand } from "./handlers/whoami";
import type { CommandHandler } from "./types";

export const commandRegistry: CommandHandler[] = [
  helpCommand,
  clearCommand,
  loginDriveCommand,
  logoutCommand,
  whoamiCommand,
  pwdCommand,
  lsCommand,
  catCommand,
  touchCommand,
  rmCommand,
];
