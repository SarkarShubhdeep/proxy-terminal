# Proxy-terminal — Project Plan (v0)

**Project:** Proxy-terminal  
**Prepared:** August 19, 2026  
**Status:** Planning  
**Source:** Derived from [Web_Terminal_Drive_Handover.md](./Web_Terminal_Drive_Handover.md)

---

## 1. Vision & Product Definition

Proxy-terminal is a **web-based, secured terminal emulator** that lets authenticated users create, edit, download, and access files in a dedicated Google Drive folder — entirely from the browser, with **no custom backend**.

Users interact through a familiar shell (`ls`, `cat`, `nano`, `upload`, `download`, etc.). All file operations run against Google Drive via the REST API. Supported file types at launch:

| Extension | MIME / handling |
|-----------|-----------------|
| `.txt`    | Plain text — read/write natively |
| `.md`     | Markdown — read/write natively |
| `.doc`    | Legacy Word binary — read via export; write via upload or Google Docs conversion (see Phase 2) |

The app uses the restricted **`drive.file` OAuth scope**, so it can only see files and folders it created. Tokens stay in browser memory only.

---

## 2. Goals & Non-Goals

### Goals
- Zero-backend, serverless architecture (static/edge-hosted Next.js)
- Privacy-first: no database, no token persistence, minimal OAuth scope
- Terminal UX with `xterm.js` — keyboard-driven, responsive
- Full CRUD on `.txt`, `.md`, `.doc` within a `WebTerminal` Drive folder
- Download files to the user's local machine
- Clear auth flow via `login-drive` command

### Non-Goals (v1)
- Multi-user collaboration or shared folders
- Real shell execution (no `bash`, `node`, `python` in browser)
- Access to files outside the app-created `WebTerminal` folder
- Offline mode or local filesystem sync
- Mobile-optimized terminal (desktop-first)

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client Only)                    │
├─────────────────────────────────────────────────────────────┤
│  xterm.js UI  →  Command Parser  →  Command Router          │
│       ↑              ↓                    ↓                  │
│  Nano Modal    Auth Context (GIS)    Drive VFS Service      │
│  Upload/Download pickers              (drive-api.ts)         │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS (Bearer token)
                           ▼
              ┌────────────────────────────┐
              │   Google Drive API v3      │
              │   Folder: WebTerminal      │
              └────────────────────────────┘
```

### Technology Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js (App Router) + React + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Terminal | `xterm.js` + `xterm-addon-fit` |
| Auth | Google Identity Services (GIS) — `initTokenClient` |
| Storage | Google Drive REST API v3 |
| Client state | Zustand (auth token, VFS folder ID, session) |
| Validation | Zod at command/API boundaries |

### Security Model

1. **Scope isolation** — `https://www.googleapis.com/auth/drive.file` only
2. **Token storage** — in-memory React/Zustand; never `localStorage` / cookies
3. **No backend proxy** — tokens never hit a developer-owned server
4. **CSP headers** — restrict script sources; allow GIS + Drive API origins
5. **Input sanitization** — validate filenames, block path traversal (`../`)
6. **XSS hardening** — terminal output escaped; editor content treated as data

---

## 4. User Experience & Command Surface

### Session Flow

1. User opens app → terminal shows welcome banner and prompt `guest@proxy:~$`
2. `login-drive` → GIS popup → token acquired → `WebTerminal` folder mounted
3. Prompt updates → `user@proxy:~/WebTerminal$`
4. User runs file commands; `nano` opens overlay editor; `upload`/`download` use native pickers

### Command Reference (v1)

| Command | Args | Behavior |
|---------|------|----------|
| `help` | — | List available commands |
| `clear` | — | Clear terminal screen |
| `login-drive` | — | Trigger Google OAuth; mount VFS |
| `logout` | — | Clear token; unmount VFS |
| `pwd` | — | Print current virtual path (`~/WebTerminal`) |
| `ls` | `[path]` | List files in folder (v1: root only) |
| `cat` | `<file>` | Print file contents to terminal |
| `touch` | `<file>` | Create empty `.txt`/`.md` file |
| `rm` | `<file>` | Delete file (with confirmation for `.doc`) |
| `nano` | `<file>` | Open shadcn Dialog + textarea/Monaco editor; save via Drive PATCH |
| `upload` | — | Native file picker → multipart upload to folder |
| `download` | `<file>` | Fetch media → trigger browser download |
| `whoami` | — | Show connected Google account email (from token info) |

### File-Type Handling

- **`.txt` / `.md`** — Direct read (`alt=media`) and write (`uploadType=media` PATCH)
- **`.doc`** — v1: upload/download binary as-is; v2: optional export to plain text via Drive export API for `cat`/`nano` (requires Google Docs conversion on create)

---

## 5. Module Structure (Proposed)

```
proxy-terminal/
├── app/
│   ├── layout.tsx              # GIS script, providers, CSP meta
│   ├── page.tsx                # Full-screen TerminalWindow
│   └── globals.css
├── components/
│   ├── terminal/
│   │   ├── TerminalWindow.tsx  # xterm mount, fit, theme
│   │   ├── CommandInput.tsx    # Keystroke buffer (optional split)
│   │   └── WelcomeBanner.ts    # ASCII art / help hint
│   ├── editor/
│   │   └── NanoEditor.tsx      # shadcn Dialog + editor
│   └── ui/                     # shadcn primitives
├── lib/
│   ├── commands/
│   │   ├── router.ts           # Dispatch command → handler
│   │   ├── registry.ts         # Command definitions
│   │   └── handlers/           # ls, cat, nano, upload, download, ...
│   ├── drive/
│   │   ├── drive-api.ts        # REST wrapper
│   │   ├── types.ts            # DriveFile, FolderRef interfaces
│   │   └── mime.ts             # Extension ↔ MIME mapping
│   ├── auth/
│   │   ├── google-auth.ts      # GIS initTokenClient wrapper
│   │   └── token-store.ts      # Zustand store
│   └── terminal/
│       ├── parser.ts           # Split argv, validate
│       └── output.ts           # writeln, error styling
├── hooks/
│   ├── useTerminal.ts
│   └── useDriveVfs.ts
├── docs/
│   ├── Web_Terminal_Drive_Handover.md
│   └── plan0.md
└── .env.local.example          # NEXT_PUBLIC_GOOGLE_CLIENT_ID
```

---

## 6. Google Drive VFS Layer

Core functions in `drive-api.ts`:

| Function | Drive API | Notes |
|----------|-----------|-------|
| `initVfs(token)` | `files.list` + `files.create` | Find or create `WebTerminal` folder |
| `listFiles(folderId)` | `GET /drive/v3/files?q='{id}' in parents` | Return id, name, mimeType, modifiedTime |
| `readFile(fileId)` | `GET .../files/{id}?alt=media` | Returns string or ArrayBuffer |
| `writeFile(fileId, content)` | `PATCH .../upload/drive/v3/files/{id}?uploadType=media` | Overwrite content |
| `createFile(folderId, name, content)` | `POST .../upload/drive/v3/files?uploadType=multipart` | New file in folder |
| `deleteFile(fileId)` | `DELETE /drive/v3/files/{id}` | Permanent delete |
| `downloadFile(fileId, name)` | `alt=media` + Blob + `<a download>` | Client-side download trigger |

**In-memory cache (optional v1.1):** Map filename → fileId for faster `cat`/`nano` without re-listing.

---

## 7. Implementation Phases

### Phase 0 — Project Bootstrap (Week 1)
- [ ] Initialize Next.js 15 + TypeScript + Tailwind + ESLint
- [ ] Add shadcn/ui (Dialog, Button, Toaster)
- [ ] Configure `NEXT_PUBLIC_GOOGLE_CLIENT_ID` env pattern
- [ ] Document local dev setup in README

**Deliverable:** Empty app shell deployable to Vercel/Cloudflare Pages.

### Phase 1 — Google Cloud & Auth (Week 1)
- [x] Create GCP project; enable Google Drive API (documented in `docs/gcp-setup.md`)
- [x] Register OAuth 2.0 **Web application** client (SPA)
- [x] Whitelist `http://localhost:3000` and production origin
- [x] Implement GIS token client + Zustand auth store
- [x] Wire `login-drive` / `logout` commands (plus `whoami`, `help`; minimal xterm.js pulled forward)

**Deliverable:** User can authenticate; token held in memory; `whoami` works.

### Phase 2 — Terminal Core (Week 2)
- [ ] Integrate `xterm.js` + fit addon + dark theme
- [ ] Build keystroke buffer, prompt rendering, command history (↑/↓)
- [ ] Implement command parser and router
- [ ] Add `help`, `clear`, `pwd` stubs

**Deliverable:** Interactive terminal shell without Drive yet.

### Phase 3 — Drive VFS (Week 2–3)
- [ ] Implement `drive-api.ts` (initVfs, list, read, write, create, delete)
- [ ] Auto-mount `WebTerminal` on successful login
- [ ] Wire `ls`, `cat`, `touch`, `rm`

**Deliverable:** List and read/write `.txt` and `.md` files in Drive.

### Phase 4 — Editor & File Transfer (Week 3)
- [ ] Build `NanoEditor` modal (textarea v1; Monaco optional v1.1)
- [ ] Wire `nano <file>` create-or-edit flow
- [ ] Implement `upload` (hidden `<input type="file">`, multipart POST)
- [ ] Implement `download <file>` (Blob download)

**Deliverable:** Full create/edit/upload/download loop for text files.

### Phase 5 — `.doc` Support & Polish (Week 4)
- [ ] Upload/download `.doc` as binary
- [ ] Decide v1 `cat` behavior: hex preview, or “binary file” message
- [ ] Token refresh before expiry (GIS silent refresh)
- [ ] Error messages: auth expired, network failure, quota exceeded
- [ ] Loading states in terminal (spinner line or `[...]` prefix)

**Deliverable:** `.doc` files round-trip via upload/download.

### Phase 6 — Hardening & Launch (Week 4–5)
- [ ] CSP, security headers (Next.js config)
- [ ] E2E smoke test: login → touch → nano → download → rm
- [ ] Unit tests: parser, drive-api (mocked fetch), command handlers
- [ ] Production deploy + OAuth prod redirect URIs
- [ ] User-facing README and command cheat sheet

**Deliverable:** MVP live on production URL.

---

## 8. Google Cloud Console Checklist

1. Create project **proxy-terminal** (or reuse existing)
2. Enable **Google Drive API**
3. OAuth consent screen: External testing → add test users
4. Credentials → OAuth 2.0 Client ID → **Web application**
5. Authorized JavaScript origins:
   - `http://localhost:3000`
   - `https://<production-domain>`
6. No client secret required (public SPA pattern with GIS)
7. Scopes: `https://www.googleapis.com/auth/drive.file` only

---

## 9. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Yes | OAuth client ID from GCP |
| `NEXT_PUBLIC_VFS_FOLDER_NAME` | No | Default: `WebTerminal` |
| `NEXT_PUBLIC_APP_NAME` | No | Default: `Proxy-terminal` |

---

## 10. Testing Strategy

| Layer | Approach |
|-------|----------|
| Command parser | Unit tests — argv splitting, unknown commands |
| Drive service | Unit tests — mock `fetch`, assert URLs/headers (no real token) |
| Auth store | Unit tests — login/logout state transitions |
| Terminal integration | Manual + optional Playwright: type commands, assert output |
| Drive E2E | Manual with test Google account (no CI secrets in v1) |

Target: **80% unit coverage** on `lib/`; **100% coverage** on parser and drive-api critical paths.

---

## 11. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Token expires mid-session | User loses unsaved work | Refresh token proactively; `nano` warns on expiry |
| `drive.file` scope limits | Cannot open pre-existing Drive files | Document that only app-created folder is accessible |
| Large file upload limits | Drive API quotas | Client-side size check; clear error message |
| XSS via malicious file content | Session compromise | Escape terminal output; no `dangerouslySetInnerHTML` |
| `.doc` binary in terminal | Garbled output | Detect binary; suggest `download` instead of `cat` |

---

## 12. Future Enhancements (Post-MVP)

- Subdirectories (`mkdir`, `cd`, nested VFS paths)
- Monaco editor with syntax highlighting for `.md`
- Google Docs native editing (convert `.doc` → Google Doc MIME)
- Command autocomplete (Tab)
- Themes (Solarized, Dracula)
- Optional Cloudflare Workers edge proxy for CSP-only concerns (still no token storage)
- Session export/import (user-initiated, encrypted local backup)

---

## 13. Success Criteria (MVP)

- [ ] User can `login-drive` and see `WebTerminal` folder created automatically
- [ ] User can `ls`, `cat`, `touch`, `nano`, `rm` on `.txt` and `.md` files
- [ ] User can `upload` and `download` `.txt`, `.md`, and `.doc` files
- [ ] No backend server; tokens never leave the browser
- [ ] App deploys as static/SSR Next.js on Vercel or similar with <$5/mo hosting

---

## 14. Immediate Next Actions

1. **Scaffold repo** — `create-next-app` with TypeScript, Tailwind, App Router
2. **GCP setup** — OAuth client ID for localhost
3. **Phase 2 parallel track** — TerminalWindow + auth can be built in parallel once scaffold exists
4. **Rename branding** — UI strings, folder name config, welcome banner use **Proxy-terminal**

---

*This plan supersedes the action items in the handover doc by expanding scope (download, `.doc`, phased delivery, module layout, and success criteria) while preserving the zero-backend, `drive.file`-scoped architecture.*
