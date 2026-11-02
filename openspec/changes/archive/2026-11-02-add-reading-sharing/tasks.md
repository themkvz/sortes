## 1. Add the bounded sharing contract

- [x] 1.1 Add `app/domain/tarot/share.ts` with the inferred strict V1 schema and deterministic UTF-8/base64url codec. Enforce the 2048-character pre-decode limit, canonical nonempty question, fixed metadata/order, known unique cards, and controlled decoding failures. Add focused table-driven codec tests, including a pinned token and Unicode/escaping boundaries.
- [x] 1.2 Expose the existing pure interpreter and its required input type for validated shared data. Keep the current seed and live flow unchanged; verify shared/live equality against the existing known-result case. Keep transport validation in the sharing boundary and preserve the recent engine simplification.

## 2. Render read-only shared results

- [x] 2.1 Reuse the existing revealed-card and result markup through small ordinary Remix components, preserving live slot identity and reveal-motion behavior. Add shared-result and invalid-link pages using the current document, styles, decorative artwork, escaped text, and a native link home; do not mount an interactive board or new client entry on the shared page.
- [x] 2.2 Add the typed `GET /r/:payload` route and existing-controller action. Return 200 for valid data and controlled HTML 400 for invalid payloads, with no raw-token reflection and the specified cache/referrer/indexing headers on both. Add targeted route tests for status, result mapping, escaping, headers, and recovery link; retain existing 404/500 coverage.

## 3. Add confirmed sharing to completed readings

- [x] 3.1 Add the completion-only Share control, native privacy dialog, Cancel/Escape focus recovery, and Share anyway confirmation. Generate the typed same-origin URL and attempt clipboard copying only after confirmation; show truthful copy status and a labeled selectable URL for manual fallback. Reset all share UI on restart and ignore late clipboard results after removal.
- [x] 3.2 Add or extend existing Remix/Playwright journeys for consent before disclosure, cancel/Escape, copy success and rejected/absent clipboard, shared reading in a fresh browser with JavaScript disabled, invalid-link recovery, and restart during a pending copy. Preserve ordinary-session no-transmission assertions and existing reveal-motion regressions.

## 4. Verify and document the milestone

- [x] 4.1 Run `bun run verify` and inspect desktop, 390 px, and 320 px flows with keyboard/touch, reduced motion, blocked artwork, and long selectable URLs. Confirm immediate live results, correct shared results without JavaScript, usable warning/focus recovery, no horizontal overflow or unexpected client errors, and no stale share UI. Run the scoped after-implementation antislop check without taking on deferred board-polish fixes.
- [x] 4.2 Update README and future-scope notes after verification. Document the V1 route/payload and content-compatibility limit, public question-bearing URLs, explicit confirmation and manual-copy fallback, then record sharing as implemented while leaving broader board polish and unrelated findings deferred.
