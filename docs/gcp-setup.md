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

## OAuth scopes requested at login

The app requests these scopes when the user runs `login-drive`:

| Scope | Purpose |
| ----- | ------- |
| `https://www.googleapis.com/auth/drive.file` | Access only the files and folders this app creates (used from Phase 3). Requested now so users do not have to re-consent later. |
| `https://www.googleapis.com/auth/userinfo.email` | Read the signed-in user's email address for the `whoami` command. |

The `drive.file` scope is intentionally restrictive: the application is physically incapable of seeing Drive files it did not create.

## Security notes

- The access token lives only in browser memory (a Zustand store). It is never written to `localStorage`, cookies, or any backend.
- No client secret is used or stored; the SPA token flow does not require one.
- Tokens expire after roughly one hour. In Phase 1 the user simply runs `login-drive` again; silent refresh is planned for a later phase.
