## Why

The complete reading flow now has approved illustrated fronts, but manually revealing a card swaps its back for its front without motion. The next planned milestone adds the short card flip described in the product design, while keeping the reading immediate and usable without animation.

## What Changes

- Give each manually revealed card one brief flip that connects the shared back to its illustrated front.
- Keep card text, keyboard focus, live status, and the third-reveal verdict independent of motion and image loading.
- Show the final revealed state immediately when reduced motion is requested or animation cannot run.
- Preserve independent reveals in any order, including quick consecutive reveals and restart during motion.
- Keep existing artwork, deck layout, dragging, and reading rules. Exclude reveal-all, other motion effects, sharing, and the separate board-polish milestone.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `reading-experience`: Add optional individual reveal motion with reduced-motion and interruption behavior, preserving the existing reveal gate and accessibility contracts.

## Impact

- UI ownership: `app/actions/public/reading-board.tsx` and `reading-board.styles.ts`, following the current module split.
- Extend relevant journeys in `tests/browser/reading-experience.test.e2e.ts`; use the existing Remix test runner and Playwright.
- Follow installed Remix 3 animation guidance and existing platform primitives. No new dependency, domain state, route, API, persistence, or asset generation is planned.
- Update milestone documentation after implementation and verification.
