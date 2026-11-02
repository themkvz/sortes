## 1. Add artwork-only reveal motion

- [x] 1.1 Add one brief back-to-front flip to newly revealed artwork in `reading-board.tsx` and `reading-board.styles.ts`, following the installed Remix animation guide. Reuse the shared back and approved front, keep text static, preserve stable revealed nodes, and leave reading state, focus, verdict timing, and dragging unchanged. Add no dependency or animation state to the domain.
- [x] 1.2 Make the final front the base style. Skip motion for reduced-motion preference or unavailable animation support; settle active motion when reduced motion is enabled and cancel effects/listeners on artwork removal. Preserve image-failure behavior and immediate restart without timers or state-changing completion handlers.

## 2. Verify behavior in the existing browser suite

- [x] 2.1 Extend the reveal-order journey to check per-card motion, no replay on later reveals or completion, immediate text/focus/verdict while effects are paused, rapid independent reveals, and restart during motion followed by a fresh reading. Use the Remix runner and Playwright animation controls; avoid fixed sleeps and tests of exact keyframes or easing.
- [x] 2.2 Extend existing reduced-motion and blocked-image coverage to check instant reduced-motion reveals, changing preference during a flip, unavailable animation support, and completion/restart without waiting for images or animation. Keep decorative semantics, the reveal gate, and configured result order covered by the existing journeys.

## 3. Inspect and document the milestone

- [x] 3.1 Run `bun run verify` and inspect the actual flip at desktop, 390 px, and 320 px with normal and reduced motion. Exercise click, tap, keyboard, quick reveals, image failure, and restart; confirm no mirrored text, unwanted replay, horizontal overflow, stale effects, or client errors. Run the after-implementation antislop check within this scope.
- [x] 3.2 Update README and future-scope notes after verification. Record reveal motion as implemented while keeping sharing, broader board polish, and unrelated audit findings deferred.
