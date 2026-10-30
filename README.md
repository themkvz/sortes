# Sortes — Pseudo Tarot

A small, deterministic pseudo-tarot reading experience. This is the **foundation milestone**:
a runnable Remix 3 application shell with a design-faithful initial-board preview. There is
**no working reading session yet** — the primary action is visibly disabled. See
[Roadmap](#roadmap) below.

## Stack and pinned versions

Researched and verified against the published registry/CLI on 2026-10-30:

| Tool | Version | Notes |
| --- | --- | --- |
| Remix | `3.1.0` | Stable release |
| Node | `24.22.2` | Remix 3 requires `>=24.3.0` |
| Bun | `1.4.4` | Package manager and script runner (`packageManager` field, `bun.lock`) |

`bun run <script>` invokes scripts whose runtime remains explicit `node` — Bun is never
substituted with `bun --bun` for `dev`/`start`/`test`.

### Differences from the generated Remix starter

The app was scaffolded with the real `remix new` CLI in a scratch directory and only the
minimum required files were copied in (see `design/mvp-tech-design.md` reconciliation for
the fuller record). Notable deviations from the illustrative file outline in this change's
`design.md`:

- **No standalone CSS file.** The verified Remix 3 starter styles components with `css()`
  object-styles from `remix/component`, co-located in each component file — there is no first-class
  "load a `.css` file" convention in the generated app. A handful of shared design tokens
  (colors, fonts, radii) are still defined as real CSS custom properties, set once on
  `<body>` in `app/actions/document.tsx`, and consumed via `var(--token-name)` everywhere
  else — satisfying "use CSS variables" without inventing a file convention the framework
  doesn't use.
- **No `hmr.ts` / `hmr` script.** The starter ships an optional HMR proxy; it isn't part of
  this project's command contract, so it was dropped as unused surface area. `dev` uses
  `node --watch` (full-process restart on change), which is sufficient for this milestone.
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

No required visual assets were missing; no placeholder/generated artwork was needed for this
milestone (all iconography is small inline decorative SVG, hidden from assistive technology).

## Requirements

- Node `24.22.2`+ (`>=24.3.0`)
- Bun `1.4.4`+
- Docker (only for the container build/run steps)

## Setup

```sh
bun install --frozen-lockfile
bun run hooks:install   # installs Lefthook pre-commit/pre-push hooks
cp .env.example .env    # optional — defaults work with no .env file
bun run dev
```

Then open `http://localhost:44100/`.

## Commands

| Script | Behavior |
| --- | --- |
| `bun run dev` | Development server (`node --watch`) |
| `bun run start` | Production server |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run test` | Node's built-in test runner over `app/**/*.test.ts` |
| `bun run test:watch` | Same, in watch mode |
| `bun run check` | `biome check .` — read-only |
| `bun run check:fix` | `biome check --write .` — applies fixes |
| `bun run verify` | `check` + `typecheck` + `test`, nonzero on any failure |
| `bun run hooks:install` | Installs Lefthook git hooks |
| `bun run doctor` | `remix doctor` — framework configuration diagnostics |

## Git hooks

- **pre-commit**: read-only `biome check` against staged files' current working-tree
  content (not a byte-for-byte staged snapshot). Blocks the commit on any violation; never
  auto-stages fixes — run `bun run check:fix` yourself and re-stage.
- **pre-push**: full `bun run verify`.

## Environment

See `.env.example`. Only `HOST`, `PORT`, and `NODE_ENV` are consumed, all with working
defaults — no `.env` file is required for local startup. Invalid values (out-of-range port,
unsupported mode) fail fast at startup with an actionable message; see `app/env.ts` /
`app/env.test.ts`.

## TDD workflow used here

For each crucial behavior: write the smallest failing test beside the module it tests
(`*.test.ts`), watch it fail, implement the minimum, then refactor while green. This
foundation's tests cover:

- `GET /` returns the initial board with all required elements (`app/actions/controller.test.ts`)
- Unknown routes return a real 404 page with a link home
- An unexpected action failure returns a generic 500 with no stack trace (via a narrowly
  scoped test-only route, exercised through the router's `Request`/`Response` boundary —
  no HTTP server is started for these tests)
- Environment validation accepts defaults and valid overrides, rejects invalid ones
  (`app/env.test.ts`)

The question-editing interaction (label toggling, disabled state, no network submission, no
persistence across reload) was verified manually in a real browser (desktop, 390px, and
320px viewports; keyboard focus) rather than with an automated browser test — `@playwright/test`
is intentionally not a dependency yet; it's added when the first real reading flow exists.

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
- `reading.ts`: question normalization (trim + NFC, exactly 160 Unicode code points), the
  session lifecycle (`idle → choosing → ready → revealing → complete`, plus `reset`), immutable
  card placement, individual reveal gating, and deterministic interpretation (a completed
  reading always produces the same position meanings and verdict, independent of pick/reveal
  order — verified against a pinned golden vector).

This engine is **not wired into the browser yet**. The board rendered at `/` is still the
foundation's static, disabled preview described below; nothing in this module is reachable
from a route or a click. Run its tests with `bun run test` (colocated `*.test.ts` files
alongside each module).

## Preview limitations (current milestone)

- The rendered board's primary action (`Ask` / `Surprise me`) is **visibly disabled**; no
  reading, verdict, or share link is reachable from the browser yet.
- The deck and spread positions rendered at `/` are static/inert — no card selection,
  placement, or reveal is wired to the UI (the reading engine that will power this exists and
  is tested, but is not yet connected).
- No persistence, authentication, cookies, or browser storage is used or required.

## Roadmap

See `design/mvp-tech-design.md` and the `bootstrap-remix-foundation` change's `design.md` for
the full milestone table. Milestone 1 (deck content and reading rules) is implemented and
tested by the domain layer above. Next up — **UI integration**: wiring the real Ask/Surprise
me flow, card selection and placement, and individual reveals into the browser — is a
separate, future OpenSpec change; it is not part of this change's scope.
