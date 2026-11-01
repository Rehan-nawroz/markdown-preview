# Markform

**A single-document Markdown editor that runs entirely in your browser.** Open one `.md` file, write with a formatting toolbar, switch to a rendered preview, then save it back, export standalone HTML, or print it to PDF. No account, no upload, no document library — the file lives in the tab's memory and never leaves your device.

Built with Vite, React 19, TypeScript, and CodeMirror 6. Static output, no backend.

## Contents

- [What it is](#what-it-is)
- [Why it exists](#why-it-exists)
- [Features](#features)
- [How it works](#how-it-works)
- [Quick start](#quick-start)
- [Where to see it in the browser](#where-to-see-it-in-the-browser)
- [Production build](#production-build)
- [Using the app](#using-the-app)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Browser support and saving](#browser-support-and-saving)
- [Limits, privacy, and security](#limits-privacy-and-security)
- [Project layout](#project-layout)
- [Scripts](#scripts)
- [Testing](#testing)
- [Deployment](#deployment)
- [Design notes](#design-notes)
- [Known limitations](#known-limitations)

## What it is

Markform is a focused utility for **one Markdown file at a time**. It has three screens that are states of a single page, not routes:

| Screen | Purpose |
| --- | --- |
| **Start** | Get one file into the app: drop it, pick it, start blank, or load the bundled sample. |
| **Edit** | Write Markdown in a syntax-highlighted CodeMirror editor with a formatting toolbar and a word/character status bar. |
| **Preview** | Read the sanitized, rendered document, copy its HTML, export a standalone file, or print to PDF. |

There is no sign-in, no sidebar, no folders, no recent-files list, and no sync. Close the tab and the document is gone.

## Why it exists

Most Markdown tools force a choice between two compromises:

- **Web editors** want an account, a document library, and your text on their server.
- **Desktop apps** are a 200 MB download for something you need for ninety seconds.

Markform is for the single-file case: you were handed a `README.md`, you are drafting release notes, you want to check how a table renders, or you need a clean PDF of one note. It opens that file locally, gives you a real editor and a real preview, hands the result back, and forgets about it.

It is a good fit for:

- Developers reading or editing a Markdown file from a repository or a chat message.
- Technical writers producing release notes, changelogs, and docs that end up as HTML or PDF.
- Anyone who wants to see what a `.md` file will look like without uploading it anywhere.
- Mobile users who need to fix a typo in a Markdown file and have no desktop app installed.

The privacy line is literal, not marketing: the app makes no network requests except for its own static assets and any remote images that the document itself references.

## Features

### Start screen

- Large drop zone — drag a file anywhere on the window, or click to choose one.
- **Open file**, **New document**, and **Load sample document**.
- Clear statement that the file stays on the device.
- Shortcut hints and a Help entry point.

### Edit screen

- CodeMirror 6 editor with Markdown syntax highlighting, line numbers, bracket matching, search, undo history, and list continuation on Enter.
- Formatting toolbar: bold, italic, strikethrough, inline code, heading (cycles H1 → H2 → H3 → plain), blockquote, fenced code, bulleted / numbered / task lists, link, image, table, horizontal rule.
- Status bar: words, characters, encoding, line/column, reading time, and save state.
- Editable filename for documents that are not backed by a file handle.

### Preview screen

- Rendered with `markdown-it` plus task lists and footnotes, code highlighted by a curated highlight.js build.
- Tables scroll horizontally; fenced code gets a title bar with a Copy button.
- External links open in a new tab with `rel="noopener noreferrer"`.
- Desktop quick actions: **Copy HTML**, **Export HTML**, **Print / PDF** (on narrow screens they move into the overflow menu).
- Rendered output is sanitized with DOMPurify before it is inserted.

### Shared behaviour

- Save-state chip (`Sample`, `Unsaved`), toasts for every file action, and a full-window drop overlay.
- Unsaved-changes guard on Open, New, Close, Drop, and tab close.
- A file-changed-on-disk conflict dialog before overwriting (Chromium desktop).
- Help dialog with the shortcut list, per-browser save behaviour, and the privacy statement.
- Responsive from 1440×900 down to 390×844: the drop zone becomes tap-to-choose, gutters and some status fields drop away, dialogs go full width.

## How it works

```
  drop / picker / sample / new
             │
             ▼
      useWorkspace  ──── source ────►  CodeMirror 6  ─── edits ──┐
     (single doc,                            ▲                    │
      tab, dialog,                           └────────────────────┘
      toasts, cursor)
             │
             │ source (memoized)
             ▼
      markdown-it  ──►  task lists / footnotes  ──►  highlight.js  ──►  DOMPurify
             │
             ▼
      Preview screen  ──►  copy HTML · export standalone HTML · print
             │
             └──►  Save: serialized text ──► File System Access handle (or download)
```

**One document, one source string.** `useWorkspace` owns the document, the active tab, the dialog, the toasts, and the cursor position. The editor writes back through a single `setSource`. The preview is a pure function of `source`:

- The text is normalized to LF in memory. The original line ending and UTF-8 BOM are remembered and restored on save, so a CRLF file stays CRLF.
- The preview is memoized on `source` and only mounted while the Preview tab is active, so typing never pays the render cost.
- Rendering disables raw HTML at the parser (`html: false`), then sanitizes the result again with DOMPurify. `javascript:` links are rejected twice — by markdown-it's validator and by sanitization.
- Nothing is persisted: no `localStorage`, no `sessionStorage`, no service worker. A `beforeunload` guard is the only protection for unsaved work.

**Saving is capability-based.** If the browser gave us a writable file handle, Save writes back to the same file and checks `lastModified` first to catch external edits. If it did not, Save downloads a copy and says so in the toast. The UI never claims a file was updated on disk when it was only downloaded.

## Quick start

**Requirements**

- Node.js `^20.19.0 || >=22.12.0` (required by Vite 8)
- npm (or any npm-compatible package manager)

No database, no API keys, no environment variables, no system dependencies.

```bash
# from the project root
npm install

npm run dev
```

Vite prints the URL when it is ready:

```
  VITE v8.3.5  ready in 339 ms

  ➜  Local:   http://localhost:5173/
```

Open that URL. The dev server has hot module replacement, so edits to `src/` refresh in place.

If port 5173 is already in use, Vite silently picks 5174 (or the next free port) and prints it — read the terminal instead of assuming 5173. To require the exact port, run `npm run dev -- --port 5173 --strictPort`.

## Where to see it in the browser

| What | URL |
| --- | --- |
| Development server | <http://localhost:5173/> |
| Production build preview (`npm run preview`) | <http://localhost:4173/> |

Notes:

- Use `http://localhost:5173`, not `http://127.0.0.1:5173`. Vite binds to `localhost`, which on Windows resolves to IPv6 `::1`, so the IPv4 literal can refuse the connection.
- To open it from a phone on the same network, expose the dev server: `npm run dev -- --host`, then visit `http://<your-computer-ip>:5173`.
- The app is a single page. There are no routes, so every screen lives at `/`.

## Production build

```bash
npm run build     # typecheck, then bundle to dist/
npm run preview   # serve dist/ at http://localhost:4173
```

`dist/` is a fully static bundle (`index.html`, hashed JS/CSS, `favicon.svg`, the sample diagram). It can be opened from any static host. Because the app is client-only, there is nothing else to configure.

## Using the app

1. **Open a file.** Drag a `.md`, `.markdown`, or `.txt` file onto the window, or press **Open file** and pick one. `Mod+O` works too. No file? **Load sample document** opens a bundled walkthrough.
2. **Edit.** Type in the left-hand sheet (the editor fills the screen; there is no split view). Select text and use the toolbar or shortcuts to format it. The status bar and the save chip update as you type.
3. **Preview.** Switch to **Preview** — same URL, no reload. Scroll position is preserved when you switch back.
4. **Take it with you.** **Copy HTML** puts the rendered fragment on the clipboard. **Export HTML** downloads a standalone file with the styles inlined. **Print / PDF** opens the browser's print dialog.
5. **Save.** `Mod+S` or **Save** writes back in Chromium desktop, or downloads a copy elsewhere. Saving keeps your original line endings and BOM.
6. **Close.** Use the overflow menu → **Close document**. If the document is dirty, you get Save / Discard / Cancel first.

## Keyboard shortcuts

`Mod` is `Ctrl` on Windows and Linux, `⌘` on macOS.

| Shortcut | Action |
| --- | --- |
| `Mod+O` | Open a file |
| `Mod+S` | Save |
| `Mod+E` | Toggle Edit / Preview |
| `Mod+B` / `Mod+I` | Bold / italic |
| `Mod+K` | Insert link |
| `Mod+F` | Find (and replace) |
| `Mod+]` / `Mod+[` | Indent / outdent |
| `?` (outside a text field) | Help and shortcuts |
| `Esc` | Close a dialog or menu |
| `Mod+N` / `Mod+W` | New / close document — also in the overflow menu |

Some browsers reserve `Mod+N` and `Mod+W` for their own windows; the menu items always work.

## Browser support and saving

| Action | Chrome / Edge / Opera desktop | Firefox / Safari / mobile |
| --- | --- | --- |
| Open | Native picker, returns a writable handle | File input, returns a copy |
| Save (existing file) | Writes back to that file | Downloads `name.md` |
| Save (new document) | Native save picker | Downloads `name.md` |
| Drag and drop | Handle recovered, save-back works | Copy only |
| Conflict detection | Yes, via `lastModified` | Not applicable |
| Rename | Only for documents without a handle | Same |

The primary button always says **Save**; the toast tells you which of the two things actually happened. Mobile browsers are fully supported for editing, preview, export, and download.

## Limits, privacy, and security

- **Accepted files:** `.md`, `.markdown`, `.txt`, `text/markdown`, `text/plain`.
- **Size:** hard limit 5 MB; files over 1.5 MB still open, with a "large file" toast.
- **One document at a time.** Dropping several files opens the first and shows a toast.
- **No storage.** Refreshing loses unsaved work; the `beforeunload` prompt is the safeguard.
- **No telemetry.** No analytics, no fonts from a CDN (Fontsource, self-hosted), no uploads.
- **Sanitized HTML.** Raw HTML in Markdown is disabled at the parser and the output is sanitized with DOMPurify. Links use `noopener noreferrer`.
- **Remote images** referenced by a document are fetched from their hosts during preview, which naturally reveals your IP to those hosts. Relative image paths cannot resolve, because no folder context exists — the alt text is shown instead.

## Project layout

```
markdown-preview/
├─ index.html                Vite entry: title, meta, favicon, #root
├─ public/                   favicon.svg, sample-architecture.svg
├─ src/
│  ├─ main.tsx               mounts React, imports fonts + global CSS
│  ├─ App.tsx                shell: screens, dialogs, global shortcuts, drop handling
│  ├─ styles/                tokens.css (all design variables), base, app, editor,
│  │                         preview, print
│  ├─ lib/                   no React: file I/O, File System Access, markdown-it +
│  │                         DOMPurify, standalone HTML export, clipboard, sample
│  ├─ state/                 useWorkspace: document lifecycle, dialogs, toasts
│  ├─ editor/                CodeMirror mount + theme, pure text transforms
│  ├─ components/            header, tabs, toolbar, status bar, dialogs, toasts
│  └─ screens/               Start, Document, Editor, Preview
├─ tests/                    Vitest + jsdom: file and markdown tests
├─ vite.config.ts            React plugin, dev port 5173
└─ vitest.config.ts          jsdom environment
```

Design tokens live only in `src/styles/tokens.css`; no component hardcodes a colour. `src/lib/` stays framework-free, and pure command transforms in `src/editor/commands.ts` never import CodeMirror — only the adapter section does.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR on port 5173 |
| `npm run build` | `tsc --noEmit` then a production bundle into `dist/` |
| `npm run preview` | Serves the built `dist/` locally (port 4173) |
| `npm run typecheck` | TypeScript, strict, no emit |
| `npm test` | Vitest run, once |
| `npm run test:watch` | Vitest in watch mode |

## Testing

```bash
npm run typecheck
npm test
npm run build
```

- `tests/file.test.ts` — EOL detection, BOM round-trip, serialization, file acceptance, filename sanitizing, extension repair, word/character counts, abort detection.
- `tests/markdown.test.ts` — tables, task lists, footnotes, code fences and their Copy button, link and image attributes, raw HTML escaping, `javascript:` rejection, sanitization.
The production build also acts as the type gate: `npm run build` runs `tsc --noEmit` before bundling.

## Deployment

Upload `dist/` to any static host (Netlify, Vercel, GitHub Pages, S3, nginx). There is no server, no routing configuration, and no environment variable. If you host under a sub-path, set Vite's `base` option before building.

## Design notes

- Dark only, true-black base, cream accent, Plus Jakarta Sans for UI and prose, JetBrains Mono for code and chrome.
- Three screens, one segmented `Edit | Preview` control; no split view and no routes.
- All visual values are in `src/styles/tokens.css` — reskinning is a one-file change.

Longer local notes live in `docs/` (`SPEC.md` behaviour, `ARCHITECTURE.md` module contracts, `TASKS.md` build plan). That folder is intentionally excluded from version control by `.gitignore`.

## Known limitations

- **Save-back is Chromium-only.** Firefox, Safari, and mobile download a copy instead; the toast says so.
- **No persistence.** There are no recent files and no session recovery — refresh and unsaved content is gone.
- **Single document.** No tabs, library, or split preview.
- **No math, diagrams, or plugins** (KaTeX, Mermaid), and no inline image paste.
- **No light theme.**
- **No native file association or PWA install.**
- **Remote images require network access**; relative image paths cannot resolve.
