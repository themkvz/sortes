## 1. Define input boundaries and authored content

- [x] 1.1 Write failing normalization/boundary tests, then implement the question schema in `app/domain/tarot/reading.ts`; verify trimming/NFC, preservation of interior whitespace/case, 160 versus 161 code points, supplementary characters, non-string values, and malformed Unicode.
- [x] 1.2 Add failing content-integrity tests, then the deck schema and inferred types in `deck.ts`; verify valid shape passes and duplicate IDs, wrong card/position counts, missing meanings, invalid prompts, and missing/unknown/malformed template tokens fail with actionable authoring errors. Reuse the question validator for prompt normalization/limits; keep reading's deck-type imports type-only so runtime imports stay acyclic.
- [x] 1.3 Add the exact 16-card catalog, 48 position fragments, five prompts, and two templates from the deck-content spec in `decks/developer.ts`; verify one catalog-integrity test, derive standalone meanings once, and manually read representative verdicts from both templates for grammar and coherent tone.

## 2. Start isolated reading sessions

- [x] 2.1 Write failing session-setup tests, then implement idle/start with injectable randomness and a shuffled deck copy; verify manual question and empty-input surprise paths, nine distinct stable choices, unchanged authored data, independent sessions, and zero random draws on invalid questions or repeated starts outside idle.

## 3. Enforce placement and canonical interpretation

- [x] 3.1 Write failing placement tests, then implement immutable placement and the choosing-to-ready transition; verify arbitrary position order, face-down placements, locked occupied positions, no card reuse, invalid indices/IDs as no-ops, and exactly three successful placements before ready.
- [x] 3.2 Write failing completed-reading validation tests, then add canonical record parsing; verify version/deck/spread matching, exact cardinality, unique known cards/positions, nonempty normalized questions, and ordering by configured spread positions. Reject invalid records with `invalid-reading`, without URL parsing or serialization.
- [x] 3.3 Write the explicit expected-verdict test using the design's canonical vector, then implement deterministic template selection and fragment composition; verify that vector selects template index 1, pair-order permutations preserve output, changed positions use their own meanings, both templates compose correctly, and a fixed pair of questions demonstrates question-based variation without runtime randomness.

## 4. Complete the session lifecycle

- [x] 4.1 Write failing reveal/completion tests, then implement ready/revealing/complete transitions; verify premature, repeated, unknown-position, and post-completion reveals are no-ops, each valid reveal affects only its card, all reveal orders give the same final reading, and no completed result/verdict appears before the third reveal.
- [x] 4.2 Write a focused reset/immutability check, then implement reset from idle, incomplete, and complete sessions; verify active deck preservation, empty question, discarded session/result data, unchanged previous states, no random draws on reset, and independent choices on the next start.
- [x] 4.3 Exercise a full start/place/reveal/interpret/reset sequence with a renamed valid deck fixture; verify no engine branch depends on developer card names, position IDs, or labels, using the same implementation and without adding a production registry or second deck.

## 5. Verify and hand off

- [x] 5.1 Run `bun run verify` and inspect the final domain diff; verify the existing route tests and new domain tests pass, runtime modules use no Node-only/UI/storage/network imports, and package/lockfile/tooling/route files remain unchanged.
- [x] 5.2 Update the README to describe the tested engine milestone and `design/mvp-tech-design.md` to specify the exact question normalization/counting rule; verify documentation still identifies the browser as a disabled preview and names UI integration as the next change, without claiming sharing or playable interaction is implemented.
