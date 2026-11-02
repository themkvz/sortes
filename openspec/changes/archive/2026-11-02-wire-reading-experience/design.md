## Context

See `proposal.md` for motivation and milestone scope. The app runs Remix 3.1 on Bun 1.4.4. `BoardPage` currently renders static spread/deck markup; `QuestionForm` is the only client entry and owns only the draft question. All reading operations and the developer deck already exist under `app/domain/tarot/` and are covered by 71 tests.

The asset server permits `app/routes.ts`, modules under `public/`, and Remix packages, but does not currently permit domain files. The browser will need the engine and authored deck. In `ReadingState`, partial reveals expose placement flags, while the complete interpretation appears only after the third reveal.

This design is included because the change crosses the server-rendered shell, client entry, asset boundary, and browser interaction tests. It introduces no new application layer or runtime dependency.

## Goals / Non-Goals

**Goals:**

- Keep one browser-owned engine state and preserve the engine's existing transition and validation contracts.
- Keep initial rendering deterministic and pass the same deck configuration to rendering and event handling.
- Make the integration testable at its route/asset boundary and through a complete browser journey.

**Non-Goals:**

- Change engine exports, deck content, routes, runtime tooling, or the source design.
- Add server actions, serialization, persistence, a state-management package, or a drag-and-drop package.
- Reproduce the full target MVP's artwork, motion, dragging, or sharing in this milestone.

The generated shared card-back source is `public/cards/card-back.png`; its prompt is recorded in `design/card-back-prompt.md`. Use the same back on every face-down choice and placed card. The opaque evergreen, teal, parchment, and amber print fits the existing palette. Preserve the existing 82 × 116 CSS card geometry and radius, fitting the image rather than stretching it; a small aspect-ratio difference is acceptable. Do not encode card identity in the back. Treat the image as decorative with empty alt text and hide it from accessibility APIs because the surrounding button provides its generic ordinal or position label. If the image fails to load, retain an operable card with a background fallback. Before UI integration, create a web-optimized derivative sized for small cards, retain the source PNG, and use an existing optimization tool if available; no runtime dependency is needed.

## Decisions

### 1. One client entry owns the reading board

Replace the question-only client boundary with a reading board under `app/actions/public/`. `BoardPage` keeps the document, header, and surrounding layout; the client entry owns the question, spread, choices, and result as one component tree. Extract the existing card/slot markup into local components only where it avoids repetition.

The client entry stores `ReadingState` from the existing engine plus a draft question, one pending choice index, and validation feedback. Use the current Remix component/handler pattern and request updates after accepted commands. Do not mirror session phases in extra booleans or copy engine placements into a second store.

Initialize with `idle(developerDeck)` on both server and browser. Do not shuffle, choose a prompt, or create a session during rendering or hydration. Enable state-changing controls only after the client handlers are attached; the server-rendered page includes an initialization status and a no-JavaScript explanation. Remove the preview-only disabled-action explanation when it stops being accurate.

**Alternative considered:** Independent question, deck, and spread islands would require shared mutable state or a new coordination layer. One owner fits this small flow and makes the DOM follow one accepted state transition.

### 2. Reuse the engine for every domain action

The question form prevents native submission and calls `start` once from idle. Use its validation result; do not add a second Unicode validator or a UTF-16 `maxlength=160`. An invalid draft remains editable with associated inline feedback. Successful start displays the normalized engine question read-only and moves focus to the first hidden choice. Subsequent start attempts cannot replace an active session.

Choosing a card only sets the pending choice index. Activating an empty position calls `place`; clear the pending index only after successful placement, then restore focus as specified. Selecting another available choice replaces the pending one; Escape clears it within the board. Occupied positions and picked choices remain unavailable without mutating state. Do not consume random draws in UI updates, selection, placement, or reveal handlers.

Each reveal calls `reveal`. Before completion, render card text by resolving the revealed placement's card and configured position against the supplied deck. Do this only for placements whose `revealed` flag is true. Render generic card backs for other placements without putting their face text in hidden DOM nodes or accessible names. Once complete, use the returned interpretation and canonical reading pairs for the full result.

Call `reset` for completed Ask again, clear UI-only draft/selection/error state, and focus the question input after rendering. The next start obtains fresh randomness; reset itself does not shuffle. Reload starts a fresh idle component without restoring session data.

**Alternative considered:** Extending the engine to provide a second partial-interpretation state would change an already tested contract. The supplied deck already contains the display text, so presentation can resolve a revealed card without an engine API change.

### 3. Keep content-driven controls and simple focus behavior

Render spread positions from `deck.positions` in configured order and use their IDs for commands. Render hidden choices by their stable choice index with generic ordinal labels, not card names. A selected choice has an exposed selected/pressed state. Use native form/input/button semantics, visible focus, and text meanings. No new deck registry or picker is needed.

Support pointer/touch activation and native keyboard button activation through the same handlers. After each placement, focus an available hidden choice; after the third placement, focus the first revealable card. After a reveal, focus the next unrevealed card, then the verdict region after the last reveal. Provide concise live status messages instead of putting the entire board or verdict in a repeatedly announced live region. Handle focus after the relevant render/update so a disabled or removed control does not strand keyboard users.

Reuse existing CSS tokens, card geometry, and responsive layout. Make the necessary revealed text and errors readable at 320px without requiring animation. Desktop dragging and detailed visual treatment remain a separate change, as stated in the proposal; the existing UI/UX document remains the source for that later work.

**Alternative considered:** Starting with drag handling would add pointer lifecycle and drop-target behavior before the basic flow is reviewable. The documented select-then-slot fallback already supports every required placement and provides a working keyboard/touch baseline.

### 4. Open only the intended client module boundary

Extend `app/assets.ts` to allow the existing client-safe tarot module subtree, `app/domain/tarot/**`, while preserving `denyFiles: ['app/**/*.test.*']` and the existing Remix package allowance. These domain modules contain authored public content and pure reading functions. Keep environment loading, server entry points, other actions, local env files, and tests unavailable as client assets.

Do not copy the engine or deck into `public/` and do not allow all of `app/**`. Card identities in downloaded source are public implementation data; hiding their names in the experience is a presentation rule, not a security promise.

**Alternative considered:** Moving domain files would disturb their established ownership and tests. A narrow additional asset allowance lets server and browser import the same source.

### 5. Run tests with Remix and Playwright

Use the official Remix test runner and `remix/assert` for engine regressions, router behavior, and asset-boundary regressions. Keep the 404 router test and verify generic 500 handling at the Bun server adapter boundary. Check that the client entry and its domain dependencies are served while test, environment, and server modules stay blocked; use the browser suite for the initial board rather than a redundant HTML smoke test.

Add Remix browser component tests using `render()` from `remix/component/test` and Remix E2E tests using `t.serve(await createTestServer(router.fetch))`. Use the pinned Playwright library through Remix as the browser driver. Cover pointer and keyboard journeys, validation including Unicode boundaries, locked placements, partial reveals, final verdict, reset/focus, reload, and no question-bearing network/storage writes. Reuse actual rendered choices rather than assuming random card identities. Exercise desktop, 390px, and 320px viewports and check client errors. Include card-back loading, shared use, and interaction when the image is unavailable.

Keep server tests separate from browser tests, and run the unified Remix suite in `verify`. Use Playwright as a dev dependency; do not add `@playwright/test` or a DOM emulator. CI installs Chromium and its system dependencies before verification.

## Risks / Trade-offs

- [The client imports a module that the asset server blocks] → Test the client entry and its domain import graph in production mode, including the non-root Bun container; keep denied-source checks alongside positive asset tests.
- [A hidden card leaks its face through accessibility text or hidden markup] → Gate face rendering on that placement's reveal flag and inspect both the DOM and accessible names before and after each reveal.
- [The draft validator disagrees with the engine] → Use `start` and the existing normalized question contract; verify supplementary characters, trim/NFC, 160 accepted code points, and 161 rejected code points.
- [Focus disappears when a control becomes disabled or the board changes phase] → Apply the explicit focus sequence after rendering and complete the whole flow with only the keyboard.
- [Hydration reinitializes or randomizes a reading] → Keep initial state idle and deterministic; start only from an explicit user command and test reload and repeated activation.
- [A playable board is mistaken for the full MVP] → Update the README with this milestone's click/tap/keyboard support and explicitly retain dragging, visual polish, and sharing as follow-up work. Do not render a dead Share control.

## Migration Plan

No stored data or routes are migrated. Apply the client-board refactor and its narrow asset allowance together, then verify the route, browser, and production-container paths. Update the README only when the behavior is implemented. Rollback restores the previous static board/client entry and asset allowance together; there is no durable reading data to recover. Deployment is outside this planning change.
