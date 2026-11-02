## 1. Establish the client boundary and initial board

- [x] 1.1 Inspect the existing board and pen.dev reference, and read the installed Remix client-entry/update/focus documentation. Verify the idle board, inactive pre-hydration actions, initialization feedback, and no-JavaScript explanation through browser checks; retain the app-owned 404 router test and generic 500 server-adapter test without a redundant HTML smoke test.
- [x] 1.2 Replace the question-only entry with one reading-board client entry under `app/actions/public/`; move the spread, choices, and result under that owner, preserve the outer document/header and existing tokens, and initialize the same idle state on server and browser without randomness.
- [x] 1.3 Add the narrow tarot-domain asset allowance in `app/assets.ts` and Remix route/asset regressions. Verify the client entry and engine/deck modules load while test, environment, and server modules remain unavailable; preserve the explicit test-file deny rule.
- [x] 1.4 Generate and save the shared card-back image with ImageGen, and record its prompt in `design/card-back-prompt.md`.
- [x] 1.5 Create a web-optimized derivative and use the shared card-back asset in the card component. Preserve the card geometry and aspect ratio, provide decorative accessible markup and an image-failure background fallback, and verify the asset loads and interactions remain operable.

## 2. Start and validate readings

- [x] 2.1 Wire the native question form to the existing start operation, prevent network submission, and enable it only after client initialization. Verify Ask, immediate Surprise me, Enter submitting once, normalized read-only active questions, nine stable hidden choices, and unchanged active sessions on repeat start attempts.
- [x] 2.2 Show associated inline validation feedback while retaining an editable invalid draft. Verify trim/NFC, preserved interior text, supplementary characters, 160 accepted normalized code points, 161 rejected code points, and malformed Unicode without silent truncation, a UTF-16 limit, or a started reading.

## 3. Select and place cards without dragging

- [x] 3.1 Render generic ordinal choice buttons and configured position labels. Add one pending choice index, expose its selected state, allow another choice to replace it, and clear only the pending choice on Escape within the reading controls.
- [x] 3.2 Route slot activation through the existing placement operation. Clear pending selection after a successful placement and verify arbitrary slot order, face-down placements, no card reuse, no occupied-slot replacement, and harmless activation without a pending choice.
- [x] 3.3 Make placement work with click, tap, Enter, and Space. Restore focus to an available choice after each placement; after the third placement, lock choice/placement actions and focus the first revealable card. Announce concise placement/ready status with visible focus.

## 4. Reveal, complete, and restart

- [x] 4.1 Wire individual reveal controls to the existing reveal operation. Resolve each partially revealed card's text from the deck only after its own reveal; verify names, short descriptions, meanings, and verdict text are absent from the DOM and accessibility labels while gated.
- [x] 4.2 Render the completed question, three cards with position-specific meanings, and exactly one engine-generated verdict in configured spread order immediately after the third reveal. Verify different placement/reveal orders, no Reveal all or dead Share control, and no animation/timer dependency.
- [x] 4.3 Add completed Ask again using the existing reset operation, clear UI-only state, and return focus to the question input. Complete the reveal focus sequence, ending at the verdict region; verify reload returns to idle from edited, choosing, partially revealed, and completed states without persistence.

## 5. Verify the playable milestone and document the handoff

- [x] 5.1 Add Remix browser component tests with `render()` and E2E tests with `t.serve(await createTestServer(router.fetch))`, using the pinned Playwright library through Remix, and document their invocation. Assert the complete pointer and keyboard journeys, pending-choice replacement/cancellation, locked placements, reveal/verdict gating, error association, reset/focus, reload, card-back asset loading/shared use, and image-failure interaction fallback; use actual rendered choices rather than pinned random card identities. E2E tests use an ephemeral loopback server and clean up through the Remix test context.
- [x] 5.2 Run that browser check at desktop, 390px, and 320px widths, including a touch-sized viewport and reduced motion. Verify no horizontal overflow, readable card text, keyboard focus, concise live updates, no unexpected client errors, and no question/reading-bearing network or storage writes.
- [x] 5.3 Run `bun run verify`, review the engine/content diff for unintended changes, and build/run the non-root Bun production container. Verify its client import graph and complete reading flow, then stop only the processes/containers started for these checks.
- [x] 5.4 Update the README to describe the implemented click/tap/keyboard reading milestone and Remix runner commands. Keep desktop dragging, new card-front artwork, flip animations, detailed visual polish, and sharing clearly listed as later work; do not claim the full MVP is complete.
