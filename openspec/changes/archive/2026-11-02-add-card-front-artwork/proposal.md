## Why

Revealed cards currently contain only text, while the card-table design calls for a distinct symbol or illustration on each front. Add a coherent illustrated set so the reveal has a visual identity as well as a meaning.

## What Changes

- Add one distinct engraved ImageGen illustration for each of the 16 developer cards, matching the existing evergreen, seafoam, parchment, and restrained amber card-back palette.
- Review the generated asset set with the user before integrating it into the board, as required by the future-scope notes.
- Display a card's artwork only after its individual reveal, alongside its existing name, description, and position meaning.
- Keep text readable and the reading operable when images fail or are unavailable. Treat the illustration as decorative to assistive technology.
- Serve optimized local assets and retain the same shared back for hidden choices, placed cards, and drag previews.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `reading-experience`: Add a complete, consistent front-art set, reveal-gated rendering, and accessible image-failure behavior.

## Impact

- New generated source artwork, prompt records, and optimized public card-front files.
- The revealed-card markup and styles in `app/actions/public/initial-board.tsx`, plus focused asset and browser checks.
- README and future-scope notes describing the illustrated-card milestone.
- Artwork stays in the presentation layer; the reading engine, deck schema, authored meanings, stable card IDs, and verdict calculation do not change.
- No new dependency, route, runtime service, or asset pipeline. Reveal motion, sharing, and broader board polish remain separate changes.
