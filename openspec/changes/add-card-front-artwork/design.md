## Context

See `proposal.md` for motivation and `specs/reading-experience/spec.md` for behavior. A design is included to settle the art direction, asset review, and presentation-layer integration before generating images.

The user selected engraved ImageGen illustrations matching `public/cards/card-back.webp`. `design/ui-ux-design.md` and the card-design section of `design/mvp-tech-design.md` call for a name, symbol or illustration, short phrase, and frame. `ReadingBoard` already renders the correct card text after each reveal and in the completed spread. The domain card schema contains no artwork field, and `deck-content` explicitly leaves artwork outside its capability.

## Goals / Non-Goals

**Goals:** A complete 16-image set with clear small-scale motifs; local, optimized delivery; one presentation-only association from a stable card ID to its illustration; native accessible image rendering.

**Non-Goals:** New deck fields, an artwork registry or service, runtime image generation, new dependencies, a gallery or deck picker, reveal animation, sharing, or a general board redesign. The existing contrast and dense-mobile-text findings remain separate polish work; this change must not make text smaller or introduce overflow.

## Decisions

### 1. Use the existing card back as the visual reference

Use ImageGen during the apply workflow, with the actual card back as the reference. Keep its evergreen `#17352E`, seafoam `#68B5A2`, parchment `#EEE2C7`, and limited amber `#F1A64B`; reuse the quiet engraved frame, matte print texture, and broad lines. Each portrait has one clear central motif and generous inset space. Do not bake card text into pixels, introduce a new emblem system, or copy logos or realistic occult imagery.

This keeps the fronts recognizably part of the existing deck. SVG symbols were the alternative offered; the user chose engraved ImageGen illustrations.

Starting motifs for the generation brief:

| Stable card ID | Main motif |
| --- | --- |
| merge-conflict | Two folded paper paths meeting at a crossed, unresolved seam |
| infinite-refactor | Scissors trimming a paper ribbon that curls back into the same loop |
| deprecated-api | An old ornate key beside a new lock whose keyhole no longer matches |
| friday-deploy | A sealed release crate balanced on a ledge beneath a setting sun |
| green-ci | Three checkmarked stone tiles forming a bridge toward an untested far bank |
| missing-environment-variable | One empty socket in an otherwise connected plugboard |
| legacy-system | An old stone arch carrying a newer platform on its keystone |
| todo | A pinned unfinished checklist of empty square boxes, with no written text |
| rewrite | Fresh parchment laid over a patched working drawing, with old patches visible at the edges |
| mvp | A tiny working hand-cranked machine with unused extra parts set aside |
| rubber-duck | A plain bath duck facing a loose coil of tangled thread |
| unexpected-dependency | One opened package pulling a chain of smaller linked boxes behind it |
| production-database | A stack of precious record vessels protected under a glass bell jar |
| cache | A serving tray holding an old pressed leaf while a fresh leaf waits behind it |
| code-review | Two hands examining one drawing and pointing at its exposed weak joint |
| rollback | A figure stepping back onto a sturdy lower stair while the next stair crumbles |

These are authoring directions, not replacements for the authored names or meanings. Refine visual details during asset review while retaining each card's theme and the chosen style.

### 2. Review concrete assets before UI integration

Generate the 16 fronts in a consistent set, using the card back and accepted front references to keep treatment aligned. Save source images under `design/card-fronts/<card-id>.png` and record the prompts, references, and card associations in `design/card-fronts/README.md`. Present the actual set at full size and representative small display size for user review. Record approval before adding it to the board, following the explicit asset-confirmation requirement in `openspec/future-scope.md`.

No image generation or UI work happens in the propose workflow. During apply, the asset review is a deliberate checkpoint; do not mark it complete or integrate unapproved artwork. Changes to composition within the selected style can be resolved there without changing this behavior contract.

Alternative: integrate draft images immediately. That would bypass the roadmap's asset confirmation and make placeholder art look final.

### 3. Use static files and a direct card-ID path

Export the approved fronts as WebP files at `public/cards/developer/fronts/<card-id>.webp`. Start with the existing back's approximately 492 by 700 pixel delivery size; preserve the portrait artwork and inset motif rather than cropping to force a frame. Keep full-resolution sources out of `public/` and record final dimensions and file sizes in the source notes. Optimize export size without adding a runtime image service or a new package.

Derive the public URL directly from the revealed developer card's trusted stable ID. There are 16 fixed cards, so no runtime manifest, schema extension, theme adapter, or configurable resolver is needed. Use the existing root `public/` static middleware; the installed Remix files-and-assets guide documents this path for files served as-is. No change to `app/assets.ts` allowlists or routes is needed.

Alternative: adding artwork URLs to domain cards would couple the engine and content validation to a presentation concern that the current specs explicitly exclude.

### 4. Add one image inside the existing revealed-card branch

In `app/actions/public/initial-board.tsx`, resolve the card ID alongside the existing revealed/completed card data and render its native `img` only in the revealed article. Keep the name, description, and meaning as the existing text nodes. Use `alt=""` for the decorative image, and reserve a portrait artwork area before image loading completes. Fit that area to its column, with a maximum width of 164 CSS pixels so a desktop image does not dominate its text; narrow columns reduce the image width naturally. Use containment instead of cropping the motif.

Keep front URLs out of hidden markup, CSS backgrounds, and preloads. Do not wait for load or decode before updating reveal state or the verdict. A failed image leaves the reserved background and readable text; an image error must not start another reading, reveal another card, or substitute a different illustration. Use existing Remix `on(...)` events if an error handler is needed; no new loading-state module is warranted.

Alternative: using the illustration as the entire card background would make text contrast and image failure harder to control, while image-embedded text would remove the existing accessible content.

### 5. Test the asset boundary and the reveal behavior

Use one small Remix check against the active deck's 16 IDs to catch missing or empty exported files. Extend the existing reveal E2E journey to verify the front URL matches each actual revealed card, loads successfully, and is absent before that card's reveal. Extend image-failure coverage to block front requests and finish reveal, verdict, and restart using text. Keep the existing keyboard, drag, touch, and 320px checks; do not add 16 duplicate reading journeys or retest domain interpretation.

Visual review is required for distinct motifs and set consistency; a file-existence assertion cannot prove either. Inspect the illustrated layout at desktop, 390px, and 320px, including slow or blocked images, without claiming the separate board-polish work is complete.

## Risks / Trade-offs

- Generated cards can drift in palette or line weight. Mitigation: shared references, a concrete set review, and regeneration of only the rejected assets.
- Sixteen large originals can increase delivery size. Mitigation: ship optimized WebP derivatives only; keep source artwork under the design directory already excluded from the production image.
- A misplaced path can show the wrong card or expose it early. Mitigation: derive paths from the revealed card's stable ID and assert the actual DOM URL and reveal boundary.
- Artwork adds height to an already dense 320px spread. Mitigation: size the art within each column, reserve its area, retain existing text sizes, and inspect real narrow-screen results before marking the UI task complete.

## Migration Plan

No data, dependency, runtime, or route migration is required. Deploy approved static files together with their UI integration through the existing Bun container. Rollback removes the front-image rendering and files while leaving the text reading and shared back intact.
