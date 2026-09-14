## Context

See [proposal.md](proposal.md) for motivation and scope. The repository contains Git history, `openspec/config.yaml`, agent workflows, and three design sources; it has no application manifest, installed stack, tests, or CI. The configured schema is `spec-driven`, with no existing main specs or changes.

Source precedence:

1. `design/mvp-tech-design.md`: product rules, server/browser responsibilities, minimal routes, deterministic data, and no persistence.
2. `design/design.pen`: visual foundation and initial-screen design identified by the user.
3. `design/ui-ux-design.md`: interaction and visual intent supporting the canvas.

The pen.dev MCP connection failed during planning. Neither canvas contents nor exact tokens/assets have been inspected. Reading the canvas through pen.dev and recording its relevant frames/tokens is an implementation prerequisite for visual work; do not invent exported assets or claim pixel fidelity from the Markdown alone.

## Goals / Non-Goals

**Goals:** Reproducible local development, strict checks, one real route-test boundary, and the existing initial board running on Remix 3. Make the next feature's red/green/refactor loop cheap. Keep content, domain rules, and UI separable without creating empty layers.

**Non-Goals:** A complete MVP in one change, new product design, a reusable starter framework, monorepo tooling, speculative dependency installation, remote CI activation, or publishing. The preview's disabled primary action is temporary milestone behavior; the reading-flow change will replace that spec requirement.

## Decisions

### 1. Bootstrap the existing repository using the actual Remix 3 starter

Inspect the published CLI/template for the selected release in a temporary directory, then copy only the required application files into this repository. Preserve `design/`, `openspec/`, `.agents/`, `.claude/`, and Git history. Never use a force scaffold over the root or run a new Git initialization here.

Research on 2026-09-14 found `remix@next` resolves to `3.0.0-rc.2`, with Node `>=24.3.0`; `remix@latest` still resolves to `2.17.5`. Select and pin the explicit Remix 3 version in the manifest and lockfile. Recheck release metadata before applying: documentation and GitHub `main` can move ahead of the published template. Use that pinned release's CLI and shipped guidance as the implementation authority. [Official installation guidance](https://github.com/remix-run/remix#installation), [registry metadata](https://registry.npmjs.org/remix/next).

Use a pinned supported Node 24 patch at least `24.3.0` for development, tests, CI, and container runtime. Update the tech document's `22.19+` baseline during apply. Use a pinned Bun version for dependency management and script invocation, with `bun.lock`, `packageManager`, and frozen installs in CI/container builds. `bun run` invokes scripts whose runtime remains explicitly `node`; do not silently substitute `bun --bun`.

Why: this follows the project's Remix 3 choice and its verified Node starter. React Router 7 / Remix 2 are different stacks; a Bun server adaptation adds a compatibility experiment the first milestone does not need. [Starter manifest](https://github.com/remix-run/remix/blob/main/template/package.json).

### 2. Minimal dependency budget

| Dependency/tool | Classification | Introduced | Reason |
| --- | --- | --- | --- |
| `remix` at the selected explicit 3.x release | Production dependency | Foundation | Framework, UI, routing, asset handling, Node TSX loader, and schema validation subpaths |
| `typescript` | Development dependency | Foundation | Strict static checks independent of runtime transforms |
| `@types/node` matching Node 24 | Development dependency | Foundation | Runtime types |
| `@biomejs/biome` | Development dependency | Foundation | One formatter, linter, and import organizer |
| `lefthook` | Development dependency | Foundation | Local Git check hooks |
| `node:test`, `node:assert/strict` | Runtime standard library | Foundation | Small behavior and router tests; no test package needed |
| `@playwright/test` and browser binaries | Development dependency | Functional reading flow | One browser flow, later invalid-share coverage; no simulated DOM |
| Docker | External development tool | Foundation | One reproducible application image |
| pen.dev and OpenSpec | Existing design/planning tools | Already present | No application dependency |

Pin tool versions selected during installation and let Bun write the lockfile. `remix/ui`, `remix/node-tsx`, and `remix/data-schema` are imports from `remix`, not separate installations. Use the latter for external input schemas when those inputs arrive; do not add Zod/Valibot alongside it without a demonstrated missing requirement. [Remix package API](https://api.remix.run/api/remix/overview/).

Do not install React, React DOM, Vite, Tailwind, shadcn/ui, Zustand, TanStack Query, React testing libraries, Vitest/Jest, drag/animation libraries, dotenv, an ORM, auth, analytics, or AI SDKs. App-owned CSS and browser APIs cover this product's stated needs. Remix's own test runner is available, but the starter's standard-library runner is sufficient for initial tests; a later migration is only justified by needed first-party browser-test functionality.

### 3. Configuration follows the starter's runtime model

Keep ESM, strict checking, `NodeNext` module/resolution settings, type-only imports, explicit relative `.ts` imports, DOM libraries, `noEmit`, and `jsxImportSource: remix/ui`. The `jsx: react-jsx` compiler setting specifies a JSX transform; it does not add React. Runtime TSX transformation does not typecheck and does not resolve TypeScript-only path aliases. Keep short relative imports initially; use native package imports only if deeper shared imports actually appear and server/browser resolution is verified. [Starter TypeScript config](https://github.com/remix-run/remix/blob/main/template/tsconfig.json), [CLI/loader documentation](https://guides.remix.run/cli-and-tooling/).

Keep the generated Node server, route map, router, document rendering, and asset-serving setup. Enable client code only for the question/action label in this change. Prefer the starter's local client-entry convention rather than a second frontend entry pipeline. Import no Node-only modules into browser code.

Start with the files needed now, approximately:

```text
app/
  actions/
    controller.tsx
    controller.test.ts
    public/
      initial-board.tsx
      board.css
  routes.ts
  router.ts
server.ts
public/                 # static assets actually used by the screen
```

Retain additional files required by the pinned starter rather than forcing this outline onto it. When the reading slice starts, add `app/domain/tarot/` with deck content and pure domain functions. No empty service/repository layers, barrel files, deck registry, or state-store dependency.

### 4. Small, explicit developer commands

The following is the target command contract. Verify the published starter's executable details when applying; these are proposal decisions, not commands already run against an app.

| Script | Behavior |
| --- | --- |
| `dev` | Starter Node development server/watch command |
| `start` | Starter Node production server, using `remix/node-tsx` |
| `typecheck` | `tsc --noEmit` |
| `test` | Starter Node test command with `remix/node-tsx`; colocated `*.test.ts` tests |
| `test:watch` | The same Node tests in watch mode |
| `check` | `biome check .`, without mutation |
| `check:fix` | `biome check --write .`, explicit local fixes |
| `verify` | Check, typecheck, then tests; nonzero if any fails |
| `hooks:install` | `lefthook install`, explicit and documented |
| `doctor` | `remix doctor`, framework configuration diagnostics |

Expose filtered Node tests through the runner's supported options for short TDD cycles. Do not add a pretend `remix build` or a no-op build script: the inspected starter runs TypeScript/JSX source and serves assets. For this setup, production verification means the actual production server and its assets work, and the Docker image builds/runs. Reconcile the tech document's generic build requirement accordingly. [CLI commands](https://guides.remix.run/cli-and-tooling/), [production guidance](https://guides.remix.run/production/).

Biome uses 2 spaces, single quotes, semicolons as needed, 100-column formatting, and import organization. Enable Git ignore integration; restrict checks to owned supported source/config files. Preserve agent skills, planning documents, and `.pen` data without rewriting them. Keep recommended checks, narrowing any React-specific rule only when incompatible with verified Remix UI syntax; do not disable accessibility checks wholesale.

Lefthook pre-commit runs a read-only Biome check on supported staged file paths; pre-push runs `verify`. Document that checking a staged path checks its working-tree content, not a byte-for-byte staged snapshot. Do not auto-stage fixes; developers choose when to apply and stage them. Explicit hook installation avoids relying on package-manager lifecycle trust behavior. [Biome Git integration](https://biomejs.dev/guides/integrate-in-vcs/), [Lefthook staging behavior](https://lefthook.dev/configuration/stage_fixed/).

### 5. Environment, CI, and container baseline

Provide `.env.example` only for actual server configuration: development host/port and a production-mode explanation. No fake secrets, database URLs, or public API keys. Validate consumed environment variables at startup with an actionable configuration error (port range, host, supported environment mode). Keep default local startup working without copying an env file. Use native environment loading if needed; never send the environment object to browser code.

Ignore dependency directories, local env files (except the example), generated assets/caches, logs, coverage, and later browser-test artifacts. Add a small README covering runtime installation, `bun install --frozen-lockfile`, explicit hook setup, development, verification, and the preview's scope.

Add one GitHub Actions workflow file using pinned Node/Bun versions, a frozen install, and the same verification scripts. Run production/container smoke checks with a bounded startup wait and cleanup. Use read-only repository permissions, with no publish/deploy job or secrets. This change prepares the file locally; it does not push or enable remote settings. No runtime matrix, coverage service, release automation, or Compose stack.

Use a Dockerfile with a pinned Node 24 runtime image and a dependency stage using the pinned Bun version. The final image includes production dependencies, required TS/TSX source and config, public assets, and any actual generated asset files. Exclude development dependencies, tests, design sources, `.git`, local env files, and agent artifacts from the runtime image; run as a non-root user and bind to the container interface. Ensure any asset cache uses a writable location. Verify `/` and at least one CSS/client asset in production mode. No database/Redis container or deployment provider is required.

### 6. First screen as a clearly bounded preview

Inspect `design.pen` through pen.dev before exporting tokens/assets or implementing visual details. Extract only the foundation values and assets used by the initial screen: color, typography, spacing, card dimensions, borders, shadows, and any needed motion. Use CSS variables and component classes. Reuse licensed/provided artwork and fonts; missing assets are identified for review before substitution.

Implement the [application-shell contract](specs/application-shell/spec.md). Keep spread rendering data-driven with the current `Context`, `Problem`, and `Advice` labels. The temporary preview supports typing and action-label updates, but disables reading submission with a short visible explanation. Do not implement a fake shuffle, dummy verdict, hidden active share action, or a half-built state machine. The next slice replaces preview behavior when the real engine exists.

Review 320px and representative wider phone/desktop viewports, keyboard focus, reduced motion, contrast, and absence of horizontal scrolling. Errors stay readable with correct HTTP statuses; the share route is not registered until its validation/rendering slice.

### 7. Minimal TDD policy

For a crucial behavior, write the smallest failing test, observe the expected failure, implement the minimum behavior, then refactor while green. Keep tests beside the domain module or controller. Cover related cases with small tables rather than a test framework around the framework. Do not measure success by a coverage percentage.

Foundation tests cover `GET /` returning useful HTML, unknown routes returning 404, generic production error handling, and actual environment-input validation. Test request behavior through the exported router's Request/Response boundary without binding a port. For unexpected failure, use the existing error boundary or a narrowly scoped test stub; do not introduce a dependency-injection framework. Browser-check the small preview interaction manually and record the result; no snapshot suite, component harness, or trivial label helper solely to make it unit-testable.

| Later crucial boundary | Minimum behavior to drive with failing tests |
| --- | --- |
| Deck and session | Exactly 16 unique cards, three configured positions, complete meanings; 9 unique preassigned hidden choices remain stable across picks |
| State transitions | Cannot reuse a card, replace an occupied slot, reveal before 3 placements, or show verdict early; reset clears session/question |
| Interpretation | Same normalized question and cards in canonical spread order always produce the same meanings/verdict; reveal/pick order cannot change it |
| Share boundary | Unicode round-trip; bounded decoding; schema version, IDs, exact cardinality, duplicate/impossible combinations, and length validation |
| Routes/rendering | Valid shared result reproduces the reading; malformed/unknown payload gets the chosen controlled status; user text remains escaped |
| Browser flow | One question-to-completion/reset flow exercises non-drag keyboard selection and reveal gating; one invalid-share case plus share-confirmation/cancel assertions |

Use fixed randomness only at the session/shuffle boundary for tests; never assert probabilistic distributions or timing of CSS animation. Add `@playwright/test` when the real flow exists and keep Node tests for the pure/server behavior. Browser automation needs an actual browser; do not add jsdom or React Testing Library. The framework documents Request/Response testing and real-browser flow boundaries. [Remix testing guidance](https://guides.remix.run/testing/).

### 8. Roadmap from foundation to releasable MVP

Only milestone 0 belongs to this change's executable checklist. The later rows are ordered follow-up changes, with their own acceptance/spec refinement before apply; they are not unfinished tasks in this change.

| Milestone | Deliverable and sequence | Exit condition |
| --- | --- | --- |
| 0 — Foundation (this change) | Runtime/package setup → TypeScript/Biome/Lefthook → useful SSR route and tests → design-based initial preview → CI/container verification | Fresh install and verification succeed; initial screen matches inspected design at phone/desktop widths; production server/assets work |
| 1 — Content and reading rules | Specify the 16-card developer deck, IDs, prompts, three positions, meanings, grammatical fragment contracts, and templates; implement deck validation, question normalization, session creation, immutable placements/reveals, deterministic interpretation with TDD | Fixed inputs reproduce results; invalid transitions fail; all 16 cards have complete authored content. This is the separate deck-content specification required by the tech doc |
| 2 — Playable reading | Design missing choosing/placed/reveal/complete states; connect real Ask/Surprise me and 9 hidden choices; select-card/select-slot keyboard/touch fallback → individual reveals → verdict → reset; replace preview spec | Complete local reading with stable identities and no early verdict; one browser happy path passes |
| 3 — Physical interaction | Inspect/design drag states; Pointer Events and capture for desktop drag; CSS placement/flip feedback; cancellation leaves rules intact; preserve non-drag flow | Pointer drop and cancellation work; touch scroll remains usable; keyboard completion still works; reduced motion never blocks progress |
| 4 — Share and recover | Specify payload details/limits/status mapping; TDD versioned UTF-8 URL codec and validation → SSR `/r/:payload` → result reuse → warning confirmation → native share/clipboard with controlled fallback → invalid/unknown state UI | Reopened URL reproduces question/cards/meanings/verdict; cancel exposes no link; malformed or oversized URLs fail safely; invalid-share browser test passes |
| 5 — Release candidate | Complete missing mobile/error/share designs, content review, accessibility, cross-browser smoke, asset optimization, production/container verification; document hosting requirements | Every production acceptance item in the tech doc passes; deployment target and deployment are separately authorized |

The engine uses plain TypeScript functions and a discriminated union, accepting one deck definition as data. No runtime deck registry or generalized state-machine library. Fix the question maximum to an exact value in milestone 1 (the source currently says approximately 160), and set encoded/decoded payload bounds and error status mapping in milestone 4 before those behaviors are implemented. These are future-slice decisions, not incomplete acceptance criteria for this foundation.

## Risks / Trade-offs

- [Remix prerelease and moving docs] → Pin the selected release; verify its generated template and APIs before scaffolding; keep domain code independent of the UI/runtime.
- [Canvas unavailable during planning] → Require pen.dev inspection before visual implementation and record frames/tokens/assets used. Tooling/bootstrap work can proceed independently when apply is requested.
- [First milestone is not a playable product] → Label it as a local preview, keep the primary action disabled, and make the reading engine/flow the next deliverables. Do not deploy this milestone as the MVP.
- [Bun install with Node execution can be confused] → Document the distinction and run the same explicit Node scripts locally, in CI, and in the container.
- [JSX lint assumptions or runtime-only import resolution] → Verify real Remix UI source and client assets against TypeScript/Biome; retain the starter's supported resolution path.
- [Source-serving production runtime] → Include required source/config and verify assets inside the image; do not apply an unrelated Vite/static-export build recipe.
- [Late sharing can expose question text] → Privacy confirmation, input bounds, escaped rendering, and deterministic replay are mandatory milestone-4 gates, not optional polish.

## Migration Plan

This is additive bootstrapping; there is no data migration. Preserve the existing repository and documents, add only the approved foundation, then reconcile the tech document's runtime and verification sections. Verify from a clean dependency install and a local production image. No commit, push, PR, image publication, or deployment is performed unless separately requested. If implementation must be reverted, revert only its reviewed additions/edits and preserve the original design/spec/agent files and Git history.
