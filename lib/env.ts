const DEFAULT_VFS_FOLDER_NAME = "WebTerminal";
const DEFAULT_APP_NAME = "Proxy-terminal";

export interface AppEnv {
  googleClientId: string | undefined;
  vfsFolderName: string;
  appName: string;
}

export function getAppEnv(): AppEnv {
  return {
    googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    vfsFolderName:
      process.env.NEXT_PUBLIC_VFS_FOLDER_NAME ?? DEFAULT_VFS_FOLDER_NAME,
    appName: process.env.NEXT_PUBLIC_APP_NAME ?? DEFAULT_APP_NAME,
  };
}

export function requireGoogleClientId(): string {
  const { googleClientId } = getAppEnv();

  if (!googleClientId) {
    throw new Error(
      "NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set. Copy .env.local.example to .env.local and add your OAuth client ID.",
    );
  }

  return googleClientId;
}
