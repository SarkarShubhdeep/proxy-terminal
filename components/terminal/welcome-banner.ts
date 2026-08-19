const ASCII_ART = [
  "  ____                              _                      _             _ ",
  " |  _ \\ _ __ _____  ___   _        | |_ ___ _ __ _ __ ___ (_)_ __   __ _| |",
  " | |_) | '__/ _ \\ \\/ / | | |  _____| __/ _ \\ '__| '_ ` _ \\| | '_ \\ / _` | |",
  " |  __/| | | (_) >  <| |_| | |_____| ||  __/ |  | | | | | | | | | | (_| | |",
  " |_|   |_|  \\___/_/\\_\\\\__, |        \\__\\___|_|  |_| |_| |_|_|_| |_|\\__,_|_|",
  "                      |___/                                                 ",
];

export function getWelcomeBanner(appName: string): string[] {
  return [
    ...ASCII_ART,
    "",
    `Welcome to ${appName} — a secured web terminal for Google Drive.`,
    "Type 'help' to see commands, or 'login-drive' to connect your Drive.",
    "",
  ];
}
