# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `bun run dev`: watch server on `http://localhost:44100` (full restart on change, no HMR).
- `bun run verify`: format check, Biome, `tsc`, and all tests. The pre-push hook runs it too.
- `bun run check:fix`: apply formatting and Biome fixes. The pre-commit hook only checks and never
  stages fixes.
- Run one test file by name or path: `NODE_ENV=test bun x --bun --no-install remix test reading`
  (a simple name expands to `**/*reading*.test*.{ts,tsx}`), or pass a path or glob.
- Run one test by title: add `--only 'Suite > test name'`.
- Test file types: `*.test.ts` runs on the server, `*.test.browser.tsx` in Chromium, and
  `*.test.e2e.ts` against a real server with Playwright.

## Architecture

A Remix 3 server app on Bun. `server.ts` loads `app/env.ts` and passes each request to
`router.fetch`. Routes (`app/routes.ts`) are mapped to one controller (`app/actions/controller.tsx`).
Pages are server-rendered with `remix/component` (JSX, not React).

- **Domain (`app/domain/tarot/`):** pure TypeScript with no UI or Node imports.
  - `reading.ts` holds the state machine as a discriminated `ReadingState` union
    (`idle → choosing → ready → revealing → complete`). It uses pure transitions (`start`,
    `place`, `reveal`); an invalid move returns the same state object.
  - The interpretation is deterministic: an FNV-1a hash of the question and the card pairs
    picks the verdict template.
  - `share.ts` is the V1 `/r/:payload` codec (base64url JSON).
  - The deck is a typed literal in `decks/developer.ts`.
- **Browser island (`app/actions/public/`):**
  - `reading-board.tsx` is the only interactive `clientEntry`. It keeps a `BoardState` in its
    setup scope and calls the pure functions in `board-state.ts`, then `handle.update()`.
  - `drag-gesture.ts` is a closure for mouse drag, with one `AbortController` for its listeners.
  - Files under `public/` (and `app/domain/tarot/**`) are served to the browser by the asset
    server; `app/assets.ts` holds the allow and deny lists. Never import server-only code there.
- **Server-only pages:** `home-page.tsx`, `shared-reading-page.tsx` and `not-found-page.tsx`.
  The shared page reuses the result components and stays read-only without JavaScript.
- **Styling:** co-located `css()` mixins. Design tokens are CSS custom properties on `<body>` in
  `app/actions/document.tsx`. Icons are inline lucide SVGs in `public/icons.tsx` (no icon
  dependency).

## Specs and design

- Behavior is specified with OpenSpec: main specs live in `openspec/specs/`, completed changes
  in `openspec/changes/archive/`. New features start as an OpenSpec change (`/opsx:*` commands).
- The visual source is `design/design.pen`. Read it only with the pencil MCP tools, never with
  file reads. When the static mock and the written spec disagree, the spec wins. Example: the
  single `Ask` / `Surprise me` button.
- Card art: optimized WebP files in `public/cards/`; full-size PNG sources in `design/`.
