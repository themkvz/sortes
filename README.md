# Sortes — Pseudo Tarot

A small pseudo-tarot reading experience built with Remix 3. Start with a question or use
`Surprise me`, choose and place three hidden cards, reveal them one at a time, and read the
completed verdict. Ask again starts a fresh in-memory reading. See [Roadmap](#roadmap) for
work that remains outside this playable milestone.

On desktop, drag an available hidden card with the primary mouse button into an empty spread
position. A valid drop is final; an invalid drop leaves the reading unchanged. Escape cancels
the drag and clears selection. Click, tap, and keyboard select-then-place controls remain
available, and touch keeps normal scrolling.

Each revealed card shows its own engraved illustration beside its name, description, and
position meaning. Images load independently of reveals and the verdict; failed images leave
the text and controls usable. The [approved artwork and prompt record](design/card-fronts/README.md)
cover all 16 fronts, with optimized local WebP files used by the app.

## Stack and pinned versions

Core tooling was verified on 2026-10-30; Playwright was added on 2026-11-02:

| Tool       | Version  | Notes                                                            |
| ---------- | -------- | ---------------------------------------------------------------- |
| Remix      | `3.1.0`  | Stable release                                                   |
| Bun        | `1.4.4`  | Runtime and package manager (`bun.lock`)                         |
| Playwright | `1.64.1` | Browser automation for Remix browser and E2E tests               |
| Biome      | `2.6.4`  | Linter and import organizer; Bun 1.4.4 has no `bun lint` command |
| TypeScript | `7.0.2`  | Editor support and `tsc` type checks                             |

### Differences from the generated Remix starter

The app was scaffolded with the real `remix new` CLI in a scratch directory and only the
minimum required files were copied in (see `design/mvp-tech-design.md` reconciliation for
the fuller record). Notable deviations from the illustrative file outline in this change's
`design.md`:

- **CSS follows the project’s chosen convention.** Components use co-located `css()`
  styles, with shared design tokens defined as CSS custom properties on `<body>` in
  `app/actions/document.tsx`. Remix also supports standalone CSS through its asset server.
- **No `hmr.ts` / `hmr` script.** The starter ships an optional HMR proxy; it isn't part of
  this project's command contract, so it was dropped as unused surface area. `dev` uses
  `bun --watch` (full-process restart on change), which is sufficient for this milestone.
- **Single primary action, not a two-button layout.** The pen.dev desktop mock
  (`MVP / Initial Reading — Desktop`) shows a static "Ask the deck" button plus a separate
  "Surprise me" quick action. `specs/application-shell/spec.md` (and `design.md`'s own
  decision text: "action-label updates") requires **one** primary button whose label
  toggles between `Surprise me` and `Ask` based on the question input. The written
  interaction spec is authoritative for this dynamic behavior; the visual mock is a frozen
  snapshot of one state. Token-level fidelity (color, type, spacing, card geometry) still
  follows the mock.

## Design source (pen.dev)

Inspected via the pen.dev MCP connection (unavailable during planning; available at apply
time). Relevant top-level frames in `design/design.pen`:

- `Qq5pE` — **MVP / Initial Reading — Desktop** (1440×1024): the primary layout reference
  for branding, ask area, three spread positions (Context/Problem/Advice), and the dormant
  9-card deck.
- `XrOVz` — **Mobile Ritual Foundation** (nested inside the Interaction Foundation frame):
  a 390px-wide reference board showing the same board condensed — 3×3 compact deck grid,
  spread positions kept side-by-side (not stacked). Used as the phone-width reference; the
  implementation also verified 320px explicitly (narrower than the 390px reference).
- Reusable components consulted for exact tokens: `Button / Primary`, `Input / Question`,
  `Spread Slot / Empty`, `Card / Back`.

Design tokens (colors, fonts, spacing, radii, motion durations) were read from the file's
variables and translated into CSS custom properties / literal values in
`app/actions/document.tsx` and the component styles — see that file for the full token list.

The shared face-down card uses a 38 KB WebP asset at `public/cards/card-back.webp`; its PNG
source is retained at `public/cards/card-back.png`. Decorative card backs and the brand mark
are hidden from assistive technology.

## Requirements

- Bun `1.4.4`+
- Docker (only for the container build/run steps)

No separate Node.js installation is needed.

## Setup

```sh
bun install --frozen-lockfile
bun run hooks:install   # installs Lefthook pre-commit/pre-push hooks
cp .env.example .env    # optional — defaults work with no .env file
bun run dev
```

Then open `http://localhost:44100/`.

## Commands

| Script                  | Behavior                                                           |
| ----------------------- | ------------------------------------------------------------------ |
| `bun run dev`           | Development server (`bun --watch`)                                 |
| `bun run start`         | Production server                                                  |
| `bun run typecheck`     | TypeScript compiler (`tsc --noEmit`)                               |
| `bun run test`          | Remix test runner                                                  |
| `bun run test:server`   | Remix server tests                                                 |
| `bun run test:browser`  | Remix browser and E2E tests using Playwright                       |
| `bun run test:watch`    | Remix test runner in watch mode                                    |
| `bun run format`        | Formats application code and supported config files with `bun fmt` |
| `bun run format:check`  | Checks formatting without writing                                  |
| `bun run lint`          | Read-only Biome lint and import organization, run under Bun        |
| `bun run check`         | `format:check` + `lint`                                            |
| `bun run check:fix`     | Formats files and applies safe Biome fixes                         |
| `bun run verify`        | `check` + `typecheck` + Remix tests                                |
| `bun run hooks:install` | Installs Lefthook git hooks                                        |
| `bun run doctor`        | Runs Remix framework diagnostics through Bun                       |

## Git hooks

- **pre-commit**: read-only Bun format check and `biome check` against staged files' current working-tree
  content (not a byte-for-byte staged snapshot). Blocks the commit on any violation; never
  auto-stages fixes — run `bun run check:fix` yourself and re-stage.
- **pre-push**: full `bun run verify`.

## Environment

See `.env.example`. Only `HOST`, `PORT`, and `NODE_ENV` are consumed, all with working
defaults — no `.env` file is required for local startup. Invalid values (out-of-range port,
unsupported mode) fail fast at startup with an actionable message; see `app/env.ts` /
`app/env.test.ts`.

## Testing

Test app-owned rules, failure paths, and real regressions at the smallest useful boundary.
Keep domain and router checks beside their modules, use component tests for UI state, and
reserve E2E tests for browser/server integration. Avoid duplicate checks and coverage targets;
TDD is optional. The foundation's tests cover:

- Unknown routes return a real 404 page with a link home
- The Bun server adapter returns a generic 500 without exposing an unexpected route
  error's stack trace; a child process also verifies active responses drain on SIGTERM
- Environment validation accepts defaults and valid overrides, rejects invalid ones
  (`app/env.test.ts`)

The reading flow has repeatable Remix browser and E2E tests using Playwright, including mouse
drag placement and cancellation. E2E tests use Remix's test server adapter and isolated browser
pages. Install Chromium once, then run:

```sh
bun x --bun --no-install playwright install chromium
bun run test:browser
```

CI installs Chromium and its system dependencies before running `bun run verify`.

## Container

```sh
docker build -t sortes-app .
docker run --rm -p 44100:44100 sortes-app
```

Runs as a non-root user; only production dependencies and the source/assets actually needed
at runtime are included (no dev dependencies, tests, design sources, `.git`, or local env
files — see `.dockerignore`).

## Reading engine (tested domain layer)

`app/domain/tarot/` contains a pure, framework-independent domain module — no Node-only, UI,
storage, or network imports — covering:

- `deck.ts` / `decks/developer.ts`: content schema, structural/cross-field validation, and the
  authored 16-card Developer Tarot deck (context/problem/advice positions, 5 surprise prompts,
  2 verdict templates).
- `reading.ts`: question normalization (trim + NFC, at most 160 Unicode code points), the
  session lifecycle (`idle → choosing → ready → revealing → complete`, plus `reset`), immutable
  card placement, individual reveal gating, and deterministic interpretation (a completed
  reading always produces the same position meanings and verdict, independent of pick/reveal
  order — verified against a pinned golden vector).

The engine powers the browser flow through `Ask` / `Surprise me`, nine generic hidden choices,
three configured spread positions, individual reveals, a completed verdict, and `Ask again`.
Questions and reading state stay in memory for the current page session; reloading starts
again at idle. No authentication, cookies, browser storage, or server-side reading endpoint is
used. Run the engine tests with `bun run test` (colocated `*.test.ts` files alongside each
module).

## Roadmap

See `design/mvp-tech-design.md` and the `bootstrap-remix-foundation` change's `design.md` for
the full milestone table. The playable reading flow, domain rules, desktop mouse dragging,
and illustrated card fronts are implemented, with click, tap, and keyboard alternatives. Flip
animations, detailed visual polish, and sharing remain future work. See the
[future scope notes](openspec/future-scope.md); each remaining item needs its own proposal.
