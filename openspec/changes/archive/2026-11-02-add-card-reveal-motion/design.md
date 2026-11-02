## Context

See `proposal.md` for motivation. The refactored board renders one keyed spread slot per position in `app/actions/public/reading-board.tsx`. Its `turn` handler commits the pure board transition and queues existing focus movement. A revealed article contains a portrait artwork frame followed by accessible text; the same rendering path supplies completed readings. Styles live in `reading-board.styles.ts`; reading and drag logic have separate owners.

The installed `node_modules/remix/guides/07-animation.md` documents CSS-first styling, native Web Animations API interactions, and reduced-motion handling. Its optional animation helpers require the separately versioned, unstable `@remix-run/ui` package, which this app does not install. Use the existing Remix APIs and browser primitives for this small effect.

Include this design to settle replay, cancellation, and accessibility behavior before implementation.

## Goals / Non-Goals

**Goals:** Keep motion local to the artwork, preserve stable revealed nodes, and make the non-animated final state the default. Reuse the current reveal, focus, and image-failure paths.

**Non-Goals:** No animation state in `board-state.ts` or the tarot domain, animation manager, shared motion abstraction, dependency, or change to the drag gesture. Do not animate article height, text, verdict, or the overall board.

## Decisions

### One local back-to-front effect

Animate only the existing portrait artwork area. Use the shared back as a temporary decorative face and the approved illustration as the front. Keep both within the same reserved frame; the extra back face must be hidden from assistive technology and must not accept pointer input. Leave all text outside the moving layers.

Use a single turn around the vertical axis with a default duration of 240 ms, recorded in one named millisecond constant. Use transforms and face visibility to avoid mirrored artwork. This brief turnover explains the manual reveal without a separate entrance effect, bounce, glow, or layout animation. Exact easing is a visual tuning detail within this duration and scope.

### Native animation attached to the revealed artwork lifecycle

Use the documented Remix `ref` lifecycle and native `Element.animate()` for the one-shot face motion. Keep the small setup and cleanup beside the board rendering, with final-state styles in `reading-board.styles.ts`. Cancel native animations on the ref lifecycle abort signal; do not await `Animation.finished` or install completion callbacks that update reading state or focus. Keep the revealed artwork node stable across later reveals and the transition to complete, so insertion does not replay prior cards.

The normal, non-animated styles show the front and hide the temporary back. Native animation availability and reduced-motion checks belong at the point that starts the effect. Missing animation support simply leaves this final state. Cancel active effects when reduced motion becomes enabled; release any media-query listener on lifecycle abort.

Alternatives: a CSS transition needs the replaced back and front to retain a common stateful host; a CSS-only entrance can be smaller if it produces the same real back-to-front turnover and cleanup behavior. Prefer that equivalent simpler form if the installed styling API supports it directly. Neither option needs the optional UI package. Delaying `turn`, retaining an animation phase in domain state, or adding timeouts would make reading correctness depend on presentation and is excluded.

### Immediate state and stable identity

Preserve `turn` and its focus sequence: reveal state, text, status, verdict, and restart render in the same update as today. The decorative motion can continue after focus moves. Unrevealed slots still render no card-specific front image or URL. Generate no images and wait for no image decoding before starting or finishing a reading.

Allow different cards to animate concurrently. Repeated activation uses the existing reveal guard. Restart removes old artwork and its effects; a subsequent reading owns fresh nodes. Do not persist motion flags or use timers to remove temporary markup.

### Verify behavior with existing journeys

Extend the reveal-order journey to observe that only the newly revealed artwork animates, that prior artwork retains identity, and that the third reveal exposes the verdict and focus while motion is pending. For timing-sensitive checks, pause native animations through the browser animation API after they start rather than sleep for a guessed duration. Verify restart during a paused effect and an immediately usable new reading.

Extend reduced-motion and blocked-image journeys. Check both an initial reduced-motion preference and enabling it during a running effect. Verify the final result when native animation is unavailable. Assert observable state and animation presence or absence; do not add tests for exact easing, keyframe arrays, framework internals, or duplicate domain behavior. Inspect the actual flip in a real browser because functional checks cannot judge its visual quality.

## Risks / Trade-offs

- A completion render could remount revealed artwork and replay motion. Mitigate with stable slot and artwork identity and a browser check spanning all three reveals.
- Cancellation could leave the back on top of the front. Mitigate with final-state base styles, decorative non-interactive layers, and no persistent fill or state-changing completion callback.
- Different back and front sizes can make the swap look abrupt. Keep the current layout and reserved front proportions; tune only the artwork turnover. Broader deck geometry stays in the separate polish milestone.
- Browser rendering differs for 3D transforms. Inspect normal and reduced motion at desktop, 390 px, and 320 px; retain the final front and readable text if animation cannot run.

## Migration Plan

No data or route migration. Ship the local view and style changes with browser coverage. Rollback removes the decorative effect and retains the existing immediate reveal behavior.
