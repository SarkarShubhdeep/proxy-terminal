# Google Cloud Setup — OAuth for Proxy-terminal

Proxy-terminal authenticates users directly from the browser using Google Identity Services (GIS). There is no backend, so you only need a public OAuth 2.0 Web Client ID — no client secret.

Follow these steps once per environment (development and production share the same client if you list both origins).

## 1. Create a Google Cloud project

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project selector, then **New Project**.
3. Name it `proxy-terminal` and create it.

## 2. Enable the Google Drive API

The Drive API is **required** from Phase 3 onward — `login-drive` mounts a folder and the file commands (`ls`, `cat`, `touch`, `rm`) call the Drive REST API. Enable it before signing in.

1. Go to **APIs & Services → Library**.
2. Search for **Google Drive API** and click **Enable**.

## 3. Configure the OAuth consent screen

1. Go to **APIs & Services → OAuth consent screen**.
2. Choose **External** and click **Create**.
3. Fill in the required app information (app name `Proxy-terminal`, support email, developer contact).
4. On the **Scopes** step, you may leave scopes empty here — the app requests them at login time via GIS.
5. On the **Test users** step, add the Google accounts you will use during development. While the app is in "Testing" mode, only these accounts can sign in.

## 4. Create an OAuth 2.0 Client ID

1. Go to **APIs & Services → Credentials**.
2. Click **Create Credentials → OAuth client ID**.
3. Choose **Application type: Web application**.
4. Name it `proxy-terminal-web`.
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:3000`
   - `https://<production-domain>` (add once you deploy; can be edited later)
6. No redirect URIs are required — GIS token flow uses a popup, not a redirect.
7. Click **Create** and copy the generated **Client ID**.

## 5. Add the Client ID to your environment

Copy the example env file and paste your Client ID:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local`:

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

Restart `npm run dev` after changing env values so Next.js picks them up.

## Troubleshooting `login-drive`

If sign-in succeeds but mounting fails with **Permission denied**:

1. **Enable Google Drive API** — APIs & Services → Library → **Google Drive API** → **Enable** (for the same project as your OAuth client ID).
2. **Revoke stale access** — open [Google Account permissions](https://myaccount.google.com/permissions), remove **Proxy-terminal**, then run `login-drive` again so Google re-prompts for Drive access.
3. **Confirm test user** — while the app is in Testing mode, your Google account must be listed under OAuth consent screen → **Test users**.

After pulling the latest code, `login-drive` also retries once with fresh consent when Drive returns a permission error.

If you previously signed in with the old `drive.file` scope, revoke Proxy-terminal at [Google Account permissions](https://myaccount.google.com/permissions) and run `login-drive` again so Google prompts for the updated `drive` scope.

## OAuth scopes requested at login

The app requests these scopes when the user runs `login-drive`:

| Scope | Purpose |
| ----- | ------- |
| `https://www.googleapis.com/auth/drive` | Read and write files inside the mounted `WebTerminal` folder (required so `ls` shows files you add directly in Google Drive). |
| `https://www.googleapis.com/auth/userinfo.email` | Read the signed-in user's email address for the `whoami` command. |

The app sandboxes all file operations to the `WebTerminal` folder in code — commands never list or modify files outside that folder, even though OAuth grants broader Drive access.

## Security notes

- The access token lives only in browser memory (a Zustand store). It is never written to `localStorage`, cookies, or any backend.
- No client secret is used or stored; the SPA token flow does not require one.
- Tokens expire after roughly one hour. In Phase 1 the user simply runs `login-drive` again; silent refresh is planned for a later phase.
