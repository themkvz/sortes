## Context

See `proposal.md` for motivation and the delta specs for behavior. The current board stretches nine desktop choices across equal tracks, uses the same weak border token for the question field and decorative surfaces, and puts 12 px interpretation text inside three narrow card panels. Shared pages reuse those panels, so they inherit the phone readability problem.

The user selected three compact phone cards with full-width interpretation blocks below. This is an explicit adaptation of the existing design, not a new visual direction. Keep energy 2 / rhythm 1 / motion 2: the card table remains the focus; only the existing manual reveal motion is timed.

### Inspected reference

Read from the active `design/design.pen` through pen.dev on 2026-11-03, including screenshots and resolved bounds. No design nodes were changed.

| Reference | Inspected facts | Use |
| --- | --- | --- |
| `Qq5pE`, desktop initial reading | 1440×1024; ask/spread areas 828 px wide; spread has three 240 px slots with 54 px gaps | Center the ritual and recover its proportions; keep branding quiet |
| `yIGgQ`, desktop dormant deck | Nine 82×116 cards; 14 px gaps; top offsets 24, 14, 7, 2, 0, 3, 8, 15, 24 px; total 850×140 | Fixed compact card geometry and shallow vertical stagger, not rotated cards |
| `sJYYg`, mobile board in `XrOVz` | 390 px board, 16 px inset; compact 3×3 choices and three side-by-side positions | Preserve the compact ritual and generous targets; retain uncropped approved backs |
| `yteyW`, lifecycle samples in `SnUBA` | Rest, hover, selected, dragging, placed, revealable, revealed | Shape, emphasis, and generic state cues without exposing identity |
| Variables | Newsreader / Funnel Sans / IBM Plex Mono; current dark palette; 48 px target minimum | Reuse the existing design language and accessible controls |

Static mock exceptions stay explicit: the live app keeps one Ask / Surprise me action, existing question validation and status/focus behavior, approved ImageGen artwork instead of symbolic placeholders, and the implemented 240 ms reveal rather than changing motion to another canvas token. The mobile sketch does not define long completed meanings. Keep the established ask/spread/deck document order while adopting its compact geometry; this milestone does not reorder the reading commands or add mock-only controls.

The follow-up visual comparison aligns the full desktop header at x56/y42, the title at y110, the 656×70 question field with its label inside, and the empty 240×330 cards at y370. Empty position names sit inside their targets, with desktop helper copy; occupied labels sit above the artwork without shifting its top. Phone field/action controls share one row, and shell sizing includes its padding. Instructions follow the current reading state. Small mono labels follow design.pen sizes: 8–10 px for position numbers, stage metadata, slot labels, and phone target labels; body and helper text stay at 12 px or larger.

The header shows a decorative stage indicator `NN / 05` with ASK, CHOOSE, PLACE, REVEAL, or VERDICT derived from the reading state; phones show `N / 3 PLACED` instead. The page uses the reference's radial table gradient, with two faint halo rings behind the spread at 1024 px and wider. Idle shows the hint "Keep it specific. The deck is dramatic, not psychic." and the deck header "9 CARDS WAITING FOR YOUR QUESTION". The commitment note carries an amber lock. Icons are inline lucide SVGs; no dependency is added. See `anti-slop/audit-007-2026-11-03.md` for before/after measurements, inspector exceptions, and final screenshot review.

## Goals / Non-Goals

**Goals:** Recover the reference deck composition, make states clear, close the retained contrast/readability findings, and keep one semantic representation of each revealed interpretation across viewports.

**Non-Goals:** No new design system, dependency, image generation, persistence, deck content, interpretation rule, share format, route, or interaction state machine. Do not alter drag thresholds/cancellation or reveal timing to solve layout problems. Do not add a theme switch, parallax, or new entrance effects.

## Decisions

### Apply the composition through the existing styles

Keep styles in `app/actions/public/reading-board.styles.ts` and tokens in `app/actions/document.tsx`, with only the required page-shell alignment changes in `home-page.tsx`. Use the installed Remix `css`/`mix` model and ordinary responsive CSS. Browser width does not belong in component state.

Use the inspected 82×116 desktop card size and stagger offsets as named layout values. Center the 850 px row within a maximum 1000 px deck area. Reserve the largest vertical offset so focus and pointer feedback are not clipped. Use wrapper padding/offsets for the stagger; keep each native choice button's visible surface and hit area aligned, with no overlap or rotation. The idle deck is subdued; active choices reuse exactly the same ordinal positions.

Use the compact layout below 1024 CSS pixels, where the desktop row no longer has comfortable surrounding space. Keep a centered three-column deck with a maximum width around 390 px and control rows around 64 px high. The full control remains at least 48×48 while its portrait back is contained inside it. This adapts the mobile sketch's compact cells without stretching the portrait artwork. Check both sides of this breakpoint rather than shrinking nine cards until they fit.

Constrain the desktop ask/spread region to the reference's 828 px width with responsive side insets. Preserve three proportional spread positions at smaller widths. Avoid rigid page heights: completed readings, validation, and sharing can extend the page vertically.

### Separate artwork from interpretation once

Split the current revealed-card rendering into small artwork and text responsibilities within the existing board UI modules. The three position slots stay in one row, with the approved portrait artwork or hidden/reveal control in each. Render a second, position-ordered set of interpretation blocks below that row, using the same normal Remix text component for live and shared readings.

At widths below 768 CSS pixels, interpretation blocks use one full-width column. At wider widths they can align in three readable columns beneath their corresponding card positions. Use at least 1 rem / 16 CSS px body text and line height 1.45 or greater; let text and user font settings determine block height. Each block includes its position label, card name, description, and meaning. Do not repeat that text inside the compact artwork slot, create separate hidden mobile/desktop copies, or add a details toggle. Stable position IDs and headings make the artwork/text association clear.

Derive visible blocks from currently revealed cards or the completed interpretation, never from unrevealed choice IDs. Keep artwork nodes keyed by position across further reveals, completion, and viewport changes so moving text does not replay a flip. Shared pages use the same rendering parts with all three cards present on the server; they do not hydrate an interactive board.

Alternatives rejected: stacking the entire phone cards contradicts the user's choice; CSS-only font shrinking keeps the known readability problem; duplicating responsive markup creates repeated accessible content and image/motion lifetimes. Separate the two responsibilities rather than introducing a general responsive-card engine.

### Keep real placement hit boxes and existing semantics

Retain one real `[data-position]` box per visual spread position. Do not extend a drop target over its full-width text block or make the target wrapper `display: contents`. The drag gesture finds the element under the pointer and its closest position, and tests calculate target centers from these boxes. Keep target geometry local to the three visible slots, even if text rendering moves out of them.

Preserve native buttons, generic hidden labels, ordinal choice indices, `aria-pressed`, disabled controls, and the established focus sequence. Update test selectors where interpretations legitimately move outside a position's hit box; continue checking position association, hidden identity gating, and configured result order. Do not change the drag module to accommodate an unnecessary wrapper layout.

### Give states a purpose and non-color cues

Use the pen.dev card-state badges: a 26 px circle at the card's top right — teal with a check for the pending choice, teal with a lock for a picked or placed card (with an unavailable native button for a picked choice), and amber with sparkles plus an amber border for a revealable card, shown only after placement completes. Eligible empty targets use the selected-surface fill, a solid teal border, a move-down icon, a teal label, and `Place in <Position>`; phones use a compact teal target with a plus icon. Empty slots show their position number and a circle-dashed icon. Keep idle inactive choices distinct from picked choices even though both have disabled buttons. The nine choice slots remain stable; never remove a picked item and shift other indices.

Focus has its own visible outline and stays distinguishable from selection. Fine-pointer hover can emphasize an available card without changing selection or starting a new timed effect; touch must not inherit a sticky hover state. During a drag, the eligible slot under the pointer uses the same filled valid-target style; the decorative pointer preview is unchanged.

### Fix functional boundaries without brightening every surface

Introduce a control-boundary token or local style instead of changing the decorative `--color-border` globally. The reference's neutral `#626861` provides a measured 3.14:1 against `#141815`, so it is a suitable quiet enabled-input boundary; it is not suitable for normal text. Retain high-contrast focus/state colors and the current readable text palette. Re-measure all adjacent background pairs at implementation time, including eligible empty targets and any opacity treatment.

Disabled artwork can be subdued, but placed/selected status text must remain readable. Do not fade an entire wrapper that contains a required status caption. Controls retain the reference's 48 px target minimum; outlines must not be cut off by the stagger or grid bounds.

### Verify the change at its actual boundary

Extend existing Remix browser/E2E journeys rather than adding domain tests or a screenshot-testing framework. Check compact/desktop geometry at representative widths and around 768/1024 breakpoints, meaningful state cues, computed contrast, minimum targets, partial reveals, one copy of each interpretation, and the full-width phone layout. Keep existing mouse cancellation, keyboard focus, reveal-motion, blocked-image, clipboard, and no-JavaScript shared-result coverage.

Run a real-browser comparison at 1440, 390, and 320 px across idle, choosing, selected, partially placed, revealable, partial reveal, completed, shared, and sharing-dialog states. Review long names/meanings, increased text size, focus at the deck edges, and resizing during a partially revealed reading. Do not add exact pixel snapshot assertions for every token or duplicate all existing journeys. Record reference deviations and close the two retained audit findings only when measured and visually checked.

### Reference adaptations

- One submit button reads "Ask" for a nonempty question and "Surprise me" for an empty one. The mock's separate "Ask the deck" button and "Surprise me" link are not added, because the spec's single-action contract takes precedence.
- The idle deck shows dimmed shared card backs instead of the mock's empty outlines, because face-down choices must use the shared back.
- Revealed cards show the approved engraved fronts instead of the mock's cream placeholder face.
- Phones keep the question → spread → deck order, and slots are sized for the card art instead of the mock's 115×86 targets.

## Risks / Trade-offs

- Moving interpretation text can detach it from its card. Mitigation: one stable position/card association, explicit position/name headings, and source order matching the configured spread.
- Deck offsets or structural changes can break hit testing and focus outlines. Mitigation: real slot boxes, aligned choice hit areas, reserved stagger space, and existing drag/focus journeys at the new sizes.
- A text-layout refactor can remount artwork and replay motion. Mitigation: stable position keys and resize/partial-reveal checks alongside the existing motion regression.
- The original weak border is part of the static mock. Mitigation: document the accessibility exception and change only functional boundaries, preserving decorative surfaces.
- Full-width phone text takes more vertical space. This is the chosen readability trade-off; retain all content and ordinary scrolling rather than clipping or adding another action.

## Migration Plan

No data or route migration. Apply the view/style changes together, retain the existing behavior tests, and update the README and audit after visual verification. Rollback restores the prior markup/styles without affecting engine state or shared URLs. Do not mark the known contrast/readability findings resolved before verification.
