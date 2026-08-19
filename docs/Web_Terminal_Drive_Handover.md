# Project Handover: Serverless Web Terminal with Google Drive VFS

**Prepared by:** Shubhdeep Sarkar  
**Date:** August 19, 2026  

---

## 1. Executive Summary
This document outlines the architecture, user flow, and implementation plan for a purely serverless, browser-based terminal emulator. The application provides an interactive command-line interface where users can manage files stored directly in their personal Google Drive. By utilizing a zero-backend architecture and the restricted `drive.file` OAuth scope, the application ensures maximum user privacy, zero database maintenance, and negligible hosting costs.

---

## 2. Technology Stack
*   **Framework:** Next.js (App Router) with React
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS + shadcn/ui (for modals/dialogs, e.g., the `nano` editor overlay)
*   **Terminal Emulator:** `xterm.js` (with `xterm-addon-fit`)
*   **Authentication:** Google Identity Services (GIS) SDK
*   **Storage Backend:** Google Drive REST API v3

---

## 3. User Flow
The following sequence details the exact step-by-step experience of a user interacting with the terminal.

1.  **Initialization:** The user navigates to the application. The terminal mounts in the browser using `xterm.js` with a generic welcome prompt.
2.  **Authentication (`login-drive`):**
    *   User types `login-drive`.
    *   The terminal pauses and triggers the Google Identity Services popup.
    *   User authenticates with their Google Account and accepts the `drive.file` scope.
3.  **VFS Mounting (The "WebTerminal" Folder):**
    *   Upon successful auth, the access token is held in browser memory.
    *   The app quietly queries Google Drive for a folder named `WebTerminal`.
    *   If missing, the app creates it.
    *   The prompt updates to indicate the active working directory (e.g., `shubhdeep@web:~/WebTerminal$`).
4.  **Standard Interactions:**
    *   User types `ls`. The app fetches file metadata from the `WebTerminal` Drive folder and prints it to the terminal.
    *   User types `cat notes.txt`. The app fetches the raw media of the file ID and prints the string.
5.  **Interactive Overlays (`nano <file>`):**
    *   User types `nano target.txt`.
    *   A frontend modal (built with shadcn/ui and a textarea/Monaco editor) overlays the terminal.
    *   User edits the content and hits "Save".
    *   The app pushes a `PATCH` request to Google Drive, closes the modal, and returns focus to `xterm.js`.
6.  **Upload Command (`upload`):**
    *   User types `upload`.
    *   A native browser file picker opens (`<input type="file" hidden />`).
    *   The user selects a local file, and the app streams the buffer to the Google Drive API via a multipart upload.

---

## 4. Implementation Details & Architecture

### 4.1. Terminal UI & Command Parser
The terminal operates as a controlled React component. Instead of a Node.js backend streaming stdout/stdin, we use a custom parsing loop:
*   Listen to `xterm.onData` or `xterm.onKey`.
*   Buffer keystrokes until the `Enter` key is pressed.
*   Extract the command string (e.g., `['cat', 'file.txt']`).
*   Pass the command array to an asynchronous command router.

### 4.2. Zero-Backend Authentication
We bypass Next.js API routes entirely for auth to maintain the "Zero-Backend" promise.
*   Load the GIS script: `<script src="https://accounts.google.com/gsi/client" async defer></script>`.
*   Initialize the token client using `google.accounts.oauth2.initTokenClient`.
*   Store the resulting `access_token` in a React Context or a Zustand store. It will expire in 1 hour. Background refresh logic can be implemented using GIS if session lengths exceed this.

### 4.3. Google Drive VFS Layer
Create a modular service file (`drive-api.ts`) to wrap REST calls:
*   **`initVfs()`:** Searches `mimeType='application/vnd.google-apps.folder' and name='WebTerminal'`. Creates it via `POST /drive/v3/files` if `files.length === 0`. Returns the Folder ID.
*   **`listFiles(folderId)`:** `GET /drive/v3/files?q='folderId' in parents`.
*   **`readFile(fileId)`:** `GET /drive/v3/files/fileId?alt=media`.
*   **`writeFile(fileId, text)`:** `PATCH /upload/drive/v3/files/fileId?uploadType=media`.
*   **`createFile(folderId, name, text)`:** Multipart `POST /upload/drive/v3/files?uploadType=multipart` containing metadata and content.

### 4.4. Security & Privacy Guarantees
*   **Scope Isolation:** Because we strictly use `https://www.googleapis.com/auth/drive.file`, the application is physically incapable of seeing files it didn't create.
*   **Token Security:** Tokens live exclusively in frontend memory. They are not saved to `localStorage` (protects against XSS) and are never transmitted to a developer-owned backend.

---

## 5. Next Steps & Action Items
1.  **Google Cloud Console Setup:** Register an OAuth SPA application in GCP and whitelist localhost and production Next.js domains.
2.  **UI Scaffold:** Scaffold Next.js, set up Tailwind CSS, and configure basic shadcn/ui components (Dialog, Toaster).
3.  **xterm.js Integration:** Build the `<TerminalWindow />` React component.
4.  **Drive Service:** Implement the `drive-api.ts` module.
5.  **Command Wiring:** Link `ls`, `cat`, `rm`, `nano`, and `upload` to the Drive service functions.
