## Context

See `proposal.md` for motivation and `specs/reading-experience/spec.md` for behavior. A design is included because pointer capture, cancellation, and native click activation need explicit decisions before implementation.

`ReadingBoard` in `app/actions/public/initial-board.tsx` owns the current setup-scope UI state and native buttons. Its `put` handler delegates to the guarded domain `place` command, clears pending selection, and restores focus. The domain already prevents replacement and card reuse; it needs no new drag concept. Existing E2E tests cover the full click, touch, keyboard, reveal, and reset flows.

## Goals / Non-Goals

**Goals:** Keep the enhancement inside the route-local board; make drag completion use the same placement and focus path as a button activation; leave persistent reading state untouched until a valid release.

**Non-Goals:** A reusable drag framework, touch or pen dragging, native HTML drag-and-drop, new libraries, auto-scrolling, snap or return animations, card artwork changes, and board redesign. Bun and the current official Remix app/test structure remain in place.

## Decisions

### 1. Use the documented Remix event and lifecycle primitives

Attach typed Pointer Events with `on(...)`, retain native `click` handlers for ordinary activation, and use `ref` cleanup signals for any element-owned resources. Scope any temporary global listeners to a gesture cleanup signal and abort them at gesture end or board removal. Follow the installed Remix 3.1 interactivity guide, particularly event handlers and DOM-reference lifecycle; do not add a parallel event system.

Alternative: a drag library adds an unneeded dependency and lifecycle layer for nine buttons and three destinations. A shared mixin can wait until there is a second consumer.

### 2. Separate a mouse press from an active drag

Accept one primary mouse pointer on an unpicked choice while choosing. Record its pointer id, choice index, starting coordinates, and source element; capture the pointer on that stable source. The assumed activation threshold is 6 CSS pixels of movement, named in source with its unit. Below that threshold, finish as an ordinary click without changing pending selection during pointer-down. Ignore touch, pen, other mouse buttons, and additional gestures.

Do not change the reading or `pending` while moving. Keep the original source in layout so capture and focus have a stable owner. A small route-local gesture record is enough; no new domain states or reducer are needed.

Alternative: selecting the dragged source on pointer-down would overwrite an existing pending choice even when the gesture later fails.

### 3. Hit-test the current pointer location and commit once

Use release coordinates to resolve a configured empty position within this board. Give slot containers a stable position identifier so hit-testing does not depend on their button's disabled state, which currently depends on `pending`. Reject targets outside this board and recheck the live choosing state, available source, and empty destination at release.

Pointer capture directs events to the source, so an event target is not a destination. A decorative fixed preview with `pointer-events: none` allows coordinate hit-testing beneath it. Use the same target resolution for hover feedback and final release; do not cache slot rectangles across scrolling or layout changes. See [pointer capture](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture) and [elementFromPoint](https://developer.mozilla.org/en-US/docs/Web/API/Document/elementFromPoint).

Pass the dragged choice index through the existing route-local placement path rather than first selecting it with a second action. Share the current domain call, pending reset, status update, and focus sequence with click placement. Clear the active gesture before committing, so the resulting render or normal capture release cannot cancel or repeat a successful placement.

Alternative: a second placement implementation could drift from the existing focus and third-card rules.

### 4. Treat release and cancellation as separate from native click activation

Consume only the native click associated with an activated drag, including an invalid or Escape-cancelled drag. `preventDefault` on a pointer event alone is not a sufficient click policy; verify the browser event sequence. Keep suppression tied to that gesture, clear it before a fresh pointer gesture, and allow keyboard activation immediately. Do not use a broad timeout that can swallow the next intentional click. See the [Pointer Events click rules](https://www.w3.org/TR/pointerevents3/#the-click-auxclick-and-contextmenu-events).

End gestures on release, Escape, `pointercancel`, unexpected `lostpointercapture`, window blur, or board removal. Release capture if still held and remove preview/highlight/listeners. Clear the gesture before releasing capture so normal cleanup is harmless. Invalid drops and browser interruptions leave `pending` unchanged; Escape clears it through the existing selection-cancellation behavior. Restore source focus on a still-focused board when available, but do not call focus after window blur or removal.

Alternative: handling only pointer-up can leave the board stuck after a browser interruption.

### 5. Reuse the current visual language and tests

Use the shared decorative card back for the preview, retain its fallback background, and use existing focus/selection colors for a valid target outline. Keep the preview out of the accessibility tree and constrain its visible area to the viewport so it does not create scrolling. Motion follows the pointer directly; no transition or completion timer is required, including with reduced motion. Preserve native touch scrolling and do not apply `touch-action: none` to the board.

Add a small set of real mouse E2E cases to the current Remix suite using `page.mouse`; HTML `dragTo` models a different event system. Cover successful placement, wrong targets, cancellation and recovery, and the click generated after release. Use focused component checks only for interruption events that the browser cannot reliably produce through automation. Keep existing full-flow tests as fallback regressions; do not duplicate domain-placement tests or test Pointer Events themselves.

## Risks / Trade-offs

- A generated click can select or reveal after a drop. Mitigation: gesture-specific suppression and an assertion immediately after the third drop.
- A render can replace a source or target. Mitigation: keep the captured choice mounted until gesture completion and resolve destinations against the current board.
- Browser capture and interruption behavior can differ. Mitigation: exercise real Chromium mouse input and manually check desktop Firefox and Safari when available; report unavailable coverage.
- Mouse-only dragging does not add stylus or touch dragging. Mitigation: the complete tap and keyboard paths remain available, including on hybrid devices.

## Migration Plan

No data, dependency, route, or environment migration is needed. Ship through the existing Bun runtime and CI. Rollback removes the drag handlers and feedback while retaining the current non-drag reading loop.
