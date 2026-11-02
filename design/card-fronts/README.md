# Developer card-front artwork

Generated with the built-in ImageGen tool. The user approved all 16 fronts for integration on 2026-11-02 after reviewing the actual set.

## Generation settings

- Use case: `stylized-concept`.
- Tool: built-in `image_gen.imagegen`, one call per card.
- Reference: `public/cards/card-back.webp` (style and frame only; unchanged).
- Arguments: `referenced_image_paths: ["/Users/themkvz/Code/sortes/public/cards/card-back.webp"]`, `transparent_background: false`.
- Sources: `design/card-fronts/<card-id>.png`.
- Approval: on 2026-11-02 the user selected “Approve all and integrate” after reviewing the actual set, satisfying `openspec/changes/archive/2026-11-02-add-card-front-artwork/tasks.md` task 1.2.

## Exact prompt template

Each initial call uses exactly the following text, with `{{MOTIF}}` replaced by its verbatim subject from the table below. No other prompt text is changed between cards. The targeted database revision is recorded separately below.

```text
Use case: stylized-concept.
Asset type: one finished portrait illustration for the front of a developer-themed pseudo-tarot card in Sortes.
Input image 1: style and framing reference only, the existing shared card BACK. Create a NEW FRONT, keeping the reference file unchanged. Match its evergreen field, quiet double-line rectangular ornamental frame, sparse mirrored corner flourishes, matte printed texture, and strong engraved linework. Replace the central looping knot completely with the subject below.
Subject: {{MOTIF}}
Composition: the single main motif dominates the center and reads clearly at only 82 x 116 CSS pixels. Use a few bold shapes, confident broad strokes, open negative space, and restrained engraved detail. Keep every important part inside a 6 percent inset. The motif may be asymmetric; the quiet outer frame matches the rest of the deck.
Palette: deep evergreen #17352E background, muted seafoam #68B5A2, warm parchment #EEE2C7 for the main drawing, only a very small muted amber #F1A64B accent. Subtle paper grain, flat matte ink, slightly hand-engraved edges.
Output: exactly ONE opaque flat rectangular portrait card-front artwork, approximately 41:58 aspect ratio, full bleed to the canvas edges. No surrounding tabletop, mockup, perspective, rounded cutout, or outside shadow.
Avoid: ALL text, letters, numbers, captions, titles, watermarks, logos, zodiac signs, stars, sparkles, skulls, eyes, realistic occult scenes, neon, glow, gradients, metallic foil, 3D renders, tiny fussy detail, or multiple card variants. The app renders the name and meaning separately.
```

## Exact per-card subjects

| Card ID | Subject |
| --- | --- |
| merge-conflict | Two folded paper paths meeting at a crossed, unresolved seam. |
| infinite-refactor | Scissors trimming a paper ribbon that curls back into the same loop. |
| deprecated-api | An old ornate key beside a new lock whose keyhole no longer matches. |
| friday-deploy | A sealed release crate balanced on a ledge beneath a setting sun. |
| green-ci | Three checkmarked stone tiles forming a bridge toward an untested far bank. |
| missing-environment-variable | One empty socket in an otherwise connected plugboard. |
| legacy-system | An old stone arch carrying a newer platform on its keystone. |
| todo | A pinned unfinished checklist of empty square boxes, with no written text. |
| rewrite | Fresh parchment laid over a patched working drawing, with old patches visible at the edges. |
| mvp | A tiny working hand-cranked machine with unused extra parts set aside. |
| rubber-duck | A plain bath duck facing a loose coil of tangled thread. |
| unexpected-dependency | One opened package pulling a chain of smaller linked boxes behind it. |
| production-database | A stack of precious record vessels protected under a glass bell jar. |
| cache | A serving tray holding an old pressed leaf while a fresh leaf waits behind it. |
| code-review | Two hands examining one drawing and pointing at its exposed weak joint. |
| rollback | A figure stepping back onto a sturdy lower stair while the next stair crumbles. |

## Review

The user approved this generated set, including the database revision, separately from the earlier style selection. The review sheet and drafts were removed after approval; they remain in git history.

## Targeted database revision

The first database rendering resembled vinyl records. The final source uses thick stacked database cylinders instead.

- Tool: built-in ImageGen.
- Input at generation time: `design/card-fronts/production-database.png` (the first rendering).
- `transparent_background: false`.
- Selected output: `production-database.png`.

Exact edit prompt:

```text
Use case: precise-object-edit.
Input image: edit target, the generated Production Database card-front illustration.
Change ONLY the stack inside the glass bell jar. Replace the vinyl records with a clear conventional database stack: three thick cylindrical storage tiers stacked vertically, solid elliptical top, straight sides, broad visible horizontal divisions. Make the tiers substantial canisters rather than thin discs. No concentric record grooves, no center holes, no printed labels, no music references.
Keep the glass dome, base, frame, evergreen background, seafoam and parchment engraved drawing, small amber highlights, dimensions, and all surrounding details unchanged. Match the exact existing flat engraved matte print treatment. No text, numbers, logos, new props, or extra ornaments. Deliver one opaque portrait card-front image.
```


## Source inventory

Generated on 2026-11-02. All 16 source PNGs are distinct and have portrait dimensions.

| Card source | Pixels | Bytes |
| --- | --- | --- |
| [merge-conflict](merge-conflict.png) | 1054 × 1492 | 2,310,390 |
| [infinite-refactor](infinite-refactor.png) | 1054 × 1493 | 2,244,863 |
| [deprecated-api](deprecated-api.png) | 1054 × 1493 | 2,275,474 |
| [friday-deploy](friday-deploy.png) | 1054 × 1493 | 2,298,069 |
| [green-ci](green-ci.png) | 1054 × 1493 | 2,379,221 |
| [missing-environment-variable](missing-environment-variable.png) | 1054 × 1492 | 2,287,372 |
| [legacy-system](legacy-system.png) | 1054 × 1493 | 2,378,379 |
| [todo](todo.png) | 1055 × 1491 | 2,343,826 |
| [rewrite](rewrite.png) | 1054 × 1492 | 2,569,953 |
| [mvp](mvp.png) | 1054 × 1493 | 2,183,958 |
| [rubber-duck](rubber-duck.png) | 1054 × 1492 | 2,435,233 |
| [unexpected-dependency](unexpected-dependency.png) | 1054 × 1492 | 2,135,055 |
| [production-database](production-database.png) | 1053 × 1493 | 2,205,571 |
| [cache](cache.png) | 1054 × 1492 | 2,384,665 |
| [code-review](code-review.png) | 1054 × 1492 | 2,250,819 |
| [rollback](rollback.png) | 1054 × 1492 | 2,219,040 |

## Approved web exports

Exported with the installed `cwebp`, quality 82, method 6, width 492 pixels and proportional height. Command per asset:

```sh
cwebp -quiet -q 82 -m 6 -resize 492 0 design/card-fronts/<card-id>.png -o public/cards/developer/fronts/<card-id>.webp
```

| Card ID | Pixels | Bytes |
| --- | --- | --- |
| merge-conflict | 492x697 | 34,626 |
| infinite-refactor | 492x697 | 36,578 |
| deprecated-api | 492x697 | 42,286 |
| friday-deploy | 492x697 | 37,174 |
| green-ci | 492x697 | 36,152 |
| missing-environment-variable | 492x697 | 41,242 |
| legacy-system | 492x697 | 46,910 |
| todo | 492x696 | 32,910 |
| rewrite | 492x697 | 42,574 |
| mvp | 492x697 | 42,790 |
| rubber-duck | 492x697 | 38,524 |
| unexpected-dependency | 492x697 | 34,580 |
| production-database | 492x698 | 41,808 |
| cache | 492x697 | 49,338 |
| code-review | 492x697 | 33,862 |
| rollback | 492x697 | 41,042 |
