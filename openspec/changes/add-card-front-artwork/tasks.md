## 1. Produce and approve the illustrated set

- [x] 1.1 Generate the 16 engraved fronts with ImageGen using the existing card back, palette, and per-card motifs in `design.md`. Save one source image per stable ID under `design/card-fronts/` and record the exact prompts and references in its README; keep names and meanings out of the image pixels.
- [x] 1.2 Present the actual full set at full size and representative small size for user review. Resolve rejected assets within the chosen direction and record approval before UI integration; do not mark this task complete from the style choice alone.
- [x] 1.3 Export the approved images to `public/cards/developer/fronts/<card-id>.webp`, preserving portrait composition and motif insets. Record dimensions and file sizes, optimize delivery, and keep full-resolution source files out of public delivery.

## 2. Integrate and test the front artwork

- [x] 2.1 Add native decorative images only inside the existing revealed-card article, using the actual revealed/completed card ID. Reserve the portrait area, fit it within its column, retain all existing accessible text, and keep the reading operable while images load or fail. Preserve the shared back, drag behavior, reveal gate, focus, and immediate verdict.
- [x] 2.2 Add one asset-inventory check for all 16 active deck IDs. Extend the existing reveal browser journey to check correct front URLs, successful loading, and absence before each reveal; extend failure coverage to finish reveal, verdict, and restart with front requests blocked. Keep these tests in the Remix runner and reuse existing journeys rather than duplicating engine or per-card tests.

## 3. Verify and document the milestone

- [x] 3.1 Run `bun run verify` and inspect actual illustrated readings at desktop, 390px, and 320px with reduced motion and slow or blocked front images. Verify readable text, decorative accessibility markup, preserved image proportions, no horizontal overflow or unexpected client errors, and working click, drag, tap, keyboard, and restart controls. Run the after-implementation antislop check without expanding into the separately deferred polish fixes.
- [x] 3.2 Update the README and future-scope notes to describe the illustrated-front milestone and its asset review record. Keep reveal motion, sharing, and broader visual polish listed as future work.
