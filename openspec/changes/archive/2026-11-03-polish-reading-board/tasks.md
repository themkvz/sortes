## 1. Restore composition and control states

- [x] 1.1 Update the existing board styles and required shell alignment to match the inspected desktop ask/spread proportions and centered 82×116 staggered deck. Use the compact three-by-three deck below the documented desktop breakpoint, with uncropped artwork and stable non-overlapping hit areas. Keep the established document/action order and existing artwork.
- [x] 1.2 Fix the question field's unfocused boundary with a local control style/token and measure adjacent contrast. Add readable available/selected/placed/eligible/revealable cues, distinct focus, and fine-pointer-only hover using current semantics. Keep all targets at least 48×48 and distinguish idle disabled cards from already placed choices without exposing identity.
- [x] 1.3 Apply the pen.dev state badges, filled valid-target style, slot numbers and icons, header stage indicator, table gradient and halo rings, idle hint and deck copy; record the reference adaptations in design.md.

## 2. Make revealed readings readable on phones

- [x] 2.1 Separate revealed artwork from interpretation text in the current UI components. Keep three compact position slots with real local drop boxes and stable artwork keys; render one position-labeled interpretation block per revealed card below the row. Use one full-width column below 768 px and readable desktop alignment, at least 16 px body text and 1.45 line height, without extra disclosure actions or duplicate responsive markup.
- [x] 2.2 Reuse the same artwork/text rendering on shared-reading pages, including server-rendered output with JavaScript disabled and failed images. Preserve the current result, escaped question, position order, native home link, and absence of interactive board controls.

## 3. Verify behavior and layout boundaries

- [x] 3.1 Extend existing Remix/Playwright journeys to check compact/desktop deck geometry, non-color state cues, contrast, minimum hit areas, and unclipped focus. Cover the 768/1024 breakpoint transitions with a small representative set of checks; do not introduce snapshot tooling or tests mirroring every style constant.
- [x] 3.2 Update selectors that relied on text being inside a drop box while preserving all identity, ordering, focus, and cancellation assertions. Add partial-reveal and resize checks for one accessible interpretation per card, no disclosure of unrevealed text, full-width phone blocks, and no replayed motion. Run `bun run verify`, retaining existing drag, motion, image-failure, consent, and no-JavaScript sharing regressions.

## 4. Review the result and document the milestone

- [x] 4.1 Compare real browser states with the current pen.dev desktop/mobile/card-state references at 1440, 390, and 320 px. Inspect idle, selection, placement, reveal availability, partial/completed reading, sharing, and shared pages with keyboard/touch, reduced motion, long text, and increased text size. Check target hit boxes, focus, overflow, and both retained findings; run the scoped after-implementation antislop check and record necessary reference adaptations.
- [x] 4.2 Update README and future-scope notes after verification. Record the deck/readability/contrast milestone and evidence for closing the two old findings, without claiming broader browser, physical-device, CI, or production checks that were not performed.
