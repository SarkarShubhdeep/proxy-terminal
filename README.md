# Proxy-terminal

A **web-based, secured terminal** for managing files in Google Drive — entirely from the browser, with no custom backend.

Users interact through a familiar shell (`ls`, `cat`, `nano`, `upload`, `download`, …) to create, edit, download, and access `.txt`, `.md`, and `.doc` files in a dedicated `WebTerminal` Drive folder. Authentication uses Google Identity Services with the restricted `drive.file` OAuth scope, so tokens never leave the browser and the app can only access files it created.

## Status

| Phase | Scope | Status |
|-------|-------|--------|
| 0 | Next.js scaffold, Tailwind, shadcn/ui, env config | Done |
| 1 | Google OAuth + auth commands + minimal terminal | Done |
| 2 | Command history, `clear`/`pwd`, prompt state machine | Done |
| **3** | Google Drive VFS (`ls`, `cat`, `touch`, `rm`) | Done |
| 4 | Nano editor, upload, download | Planned |
| 5 | `.doc` support + polish | Planned |
| 6 | Hardening + production launch | Planned |

Phase 3 adds the Google Drive VFS: `login-drive` auto-mounts a `WebTerminal` folder and file commands read and write `.txt`/`.md` files directly from the browser.

See [docs/plan0.md](./docs/plan0.md) for the full roadmap.

## Tech Stack

- **Framework:** Next.js (App Router) + React + TypeScript
- **Styling:** Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com)
- **Terminal:** [@xterm/xterm](https://xtermjs.org) + fit addon
- **Auth:** Google Identity Services (`drive.file` + `userinfo.email` scopes)
- **Client state:** Zustand (in-memory auth token + session mount state)
- **Storage:** Google Drive REST API v3

## Prerequisites

- Node.js 20+
- npm 10+
- A [Google Cloud](https://console.cloud.google.com/) project with OAuth credentials *(required from Phase 1)*

## Local Development

### 1. Clone the repository

```bash
git clone https://github.com/SarkarShubhdeep/proxy-terminal.git
cd proxy-terminal
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example env file and fill in your values:

```bash
cp .env.local.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Phase 1+ | OAuth 2.0 Web Client ID from Google Cloud Console |
| `NEXT_PUBLIC_VFS_FOLDER_NAME` | No | Drive folder name (default: `WebTerminal`) |
| `NEXT_PUBLIC_APP_NAME` | No | Display name (default: `Proxy-terminal`) |

See [docs/gcp-setup.md](./docs/gcp-setup.md) for step-by-step instructions on creating the OAuth client ID. Without a client ID the terminal still renders, but `login-drive` reports a configuration error.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Other scripts

```bash
npm run build   # Production build
npm run start   # Serve production build
npm run lint    # ESLint
npm run test    # Unit tests (Vitest)
```

## Terminal Commands

| Command | Description |
|---------|-------------|
| `help` | List available commands |
| `clear` | Clear the terminal screen |
| `login-drive` | Sign in with Google and mount the Drive folder |
| `logout` | Sign out and clear the in-memory session |
| `whoami` | Show the connected Google account email |
| `pwd` | Print the current virtual working directory |
| `ls` | List files in the mounted folder |
| `cat <file>` | Print the contents of a `.txt`/`.md` file |
| `touch <file>` | Create a new empty `.txt`/`.md` file |
| `rm <file>` | Delete a file |

Editor and transfer commands (`nano`, `upload`, `download`) arrive in Phase 4.

## Project Structure

```
proxy-terminal/
├── app/                  # Next.js App Router pages and layout (GIS script)
├── components/
│   ├── terminal/         # TerminalWindow + welcome banner
│   ├── ui/               # shadcn/ui primitives (Dialog, Button, Toaster)
│   └── providers.tsx     # Theme + toast providers
├── hooks/
│   └── useTerminal.ts    # xterm mount, input loop, history
├── lib/
│   ├── auth/             # GIS token client, Zustand store, userinfo
│   ├── commands/         # Command router, registry, handlers, guards
│   ├── drive/            # Drive REST client, VFS API, file index, mime
│   ├── session/          # VFS mount state store
│   ├── terminal/         # Parser, history, prompt, output helpers
│   └── env.ts            # Typed environment variable access
├── types/                # Ambient GIS type declarations
├── docs/
│   ├── plan0.md          # Implementation plan
│   ├── gcp-setup.md      # Google Cloud OAuth setup guide
│   └── Web_Terminal_Drive_Handover.md
└── .env.local.example
```

## Security Model

- **`drive.file` scope only** — the app cannot access files it did not create
- **In-memory tokens** — never stored in `localStorage` or sent to a backend
- **Zero-backend architecture** — all Drive API calls originate from the browser

## Deployment

The app is a standard Next.js project and deploys to [Vercel](https://vercel.com), [Cloudflare Pages](https://pages.cloudflare.com), or any Node/static host that supports Next.js.

Set the same environment variables in your hosting provider's dashboard before deploying Phase 1+ builds.

## Documentation

- [Implementation Plan (plan0.md)](./docs/plan0.md)
- [Google Cloud OAuth Setup](./docs/gcp-setup.md)
- [Architecture Handover](./docs/Web_Terminal_Drive_Handover.md)

## License

Private — all rights reserved.
