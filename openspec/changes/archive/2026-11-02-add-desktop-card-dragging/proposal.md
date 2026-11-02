## Why

The playable reading loop supports click, tap, and keyboard placement, but the intended desktop card-table interaction still lacks dragging. Add it as the next bounded milestone while preserving the complete non-drag flow.

## What Changes

- Let visitors drag an available hidden card with the primary mouse button into an empty spread position.
- Show a face-down drag preview and the currently valid destination without exposing card identity.
- Commit one final placement only after a valid drop. Cancelled gestures and invalid drops leave the reading unchanged; Escape keeps its existing selection-clearing behavior.
- Preserve ordinary clicks, touch scrolling and taps, keyboard selection and placement, reveal gating, and focus recovery.
- Verify real mouse gestures and cancellation through the existing Remix browser tests.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `reading-experience`: Add desktop dragging as an optional placement method with valid-target feedback, safe cancellation, and the existing accessibility and placement guarantees.

## Impact

- Route-local browser UI: `app/actions/public/initial-board.tsx`, including choice controls, spread targets, transient gesture state, and styles.
- Existing Remix component and E2E tests, primarily `tests/browser/reading-experience.test.e2e.ts`, plus milestone documentation.
- Reuse the current domain placement command and first-party Remix event/lifecycle APIs with native Pointer Events. No dependency, route, runtime, storage, or domain contract changes are planned.
- Card-front artwork, reveal animation, sharing, and broader visual polish remain separate future changes.
