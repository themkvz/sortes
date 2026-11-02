## Why

The reading engine and authored deck are tested, but `/` still shows a disabled preview. Connect them to the browser so a visitor can finish a reading and start another before work begins on dragging, animation, or sharing.

## What Changes

- Replace the preview-only question control with a working Ask / Surprise me flow and visible validation feedback.
- Present nine stable hidden choices, let visitors select a card and then an empty spread position, and keep placements final.
- Support the full flow with clicks, taps, and the keyboard. Reveal each placed card separately after all three positions are filled; show the verdict only after the third reveal.
- Add Ask again after completion and reset the question, choices, placements, reveal flags, and result in browser memory.
- Preserve the server-rendered initial board, existing design tokens, route error behavior, and private, ephemeral questions.
- Add a shared generated card-back asset at `public/cards/card-back.png`, with its generation prompt recorded at `design/card-back-prompt.md`.
- Update route and interaction checks and the README to describe the playable milestone.

Desktop dragging, new card-front artwork, flip animations, detailed visual polish, sharing, and shared-reading routes are separate follow-up changes. This milestone uses the documented select-card-then-slot fallback as its primary interaction. It is not the full MVP release.

## Capabilities

### New Capabilities

- `reading-experience`: Browser-owned reading sessions, question feedback, accessible selection and placement, gated individual reveals, completed results, and reset.

### Modified Capabilities

- `application-shell`: Replace the disabled-preview contract with an honest interactive entry and preserve server rendering, route errors, and question privacy throughout the reading loop.

The `reading-engine` and `deck-content` contracts stay unchanged.

## Impact

- Refactor the interactive board under `app/actions/public/`, integrating the existing domain functions and `developerDeck` through Remix client entries.
- Adjust `app/actions/board-page.tsx` so the board has one session owner and labels come from the supplied deck; retain app-owned route error checks and verify the board through browser tests.
- Add focused route and asset regressions with Bun, and verify the interaction loop with a repeatable real-browser check.
- Keep Remix 3.1 and Bun 1.4.4, existing routes, and existing domain exports. No new dependency, API endpoint, storage, authentication, or deployment is required.
