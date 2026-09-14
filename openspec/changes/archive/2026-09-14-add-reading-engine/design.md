## Context

See [proposal.md](proposal.md) for scope. `app/actions/public/initial-board.tsx` owns only preview question text; no domain implementation exists. The manifest already discovers colocated `app/**/*.test.ts` tests through Node's test runner. The installed `remix` package exports `remix/data-schema`, so boundary validation needs no new package.

`design/mvp-tech-design.md` sections 5–19 define the reading rules; the foundation roadmap identifies content/engine as the next milestone. The foundation remains unarchived with all 20 tasks checked. Its `application-shell` spec stays untouched; archiving it is separate work and does not block this additive change.

## Goals / Non-Goals

**Goals:** One usable domain module boundary for the next UI slice, a complete authored deck, predictable failure behavior, and small runnable tests for the rules that can invalidate a reading.

**Non-Goals:** UI interaction, a share codec, new routes, runtime package changes, a deck plugin system, a generic state-machine framework, alternate spreads in the UI, artwork, or asynchronous interpretation.

## Decisions

### 1. Small domain files, one supplied deck

Add files only under `app/domain/tarot/` for the behavior in this change:

| File | Responsibility |
| --- | --- |
| `deck.ts` | Content schema with inferred data types and structural/cross-field validation |
| `decks/developer.ts` | The authored catalog, prompts, meanings, and templates from the deck-content spec |
| `reading.ts` | Question schema/normalization, session state/transitions, completed-reading validation and interpretation |
| `deck.test.ts`, `reading.test.ts` | Colocated behavior tests using the existing Node runner |

Keep the state types beside their implementation. Split interpretation into another file only if actual implementation size makes `reading.ts` difficult to read; do not pre-create `types.ts`, `index.ts`, helper folders, or service layers. Use short explicit `.ts` imports, matching the current runtime setup.

Functions receive a validated deck; no mutable global active deck or session. Export the first deck as readonly validated application data. The engine handles position IDs supplied by that data, not hardcoded `context`/`problem`/`advice` branches. A renamed test copy proves replacement without shipping a second deck.

### 2. Static authored content and validation at its boundary

The [deck-content spec](specs/deck-content/spec.md) is the complete initial copy, including all 48 fragments. In the developer data module, derive each standalone meaning's text once by capitalizing its fragment's first letter and adding a period. Export both `text` and `summaryFragment` in the validated definition, as required by the tech document. This avoids maintaining duplicate English copy. Replacement decks may author those fields independently; this editorial derivation is not a rule hardcoded into the engine.

Use the installed schema facility for structural types/validation; use small ordinary checks for uniqueness, exact card/position counts, meaning coverage, and template references. Parse the deck once at its export boundary, failing with an actionable authoring error. Do not reparse the whole deck on each pick/reveal, create a registry, or add a branded validation framework.

Templates are plain strings with `{position-id}` placeholders. Validate that each of the three configured positions appears exactly once, with no unknown or malformed brace tokens, then use one ordinary replacement pass to insert the matching fragments. No general template language, conditionals, localization layer, or runtime content generation. Manually review examples from both templates; structural checks cannot establish whether a joke reads well.

### 3. Question and interaction boundaries

Use a question schema and its inferred type beside the reading functions. For unknown external input, require a well-formed Unicode string, then apply `trim().normalize('NFC')` and count Unicode code points. Accept at most 160; empty normalized input means choose a surprise prompt. Preserve interior whitespace, case, and punctuation. Count code points rather than UTF-16 units so an ordinary supplementary emoji counts once; a multi-code-point emoji sequence may count more than once. This is an explicit proposal choice refining the source's approximate limit, not an existing UI behavior.

Return a small discriminated result for operations with real validation failures: success with the value, or failure with `invalid-question` / `invalid-reading`. Keep diagnostic messages generic and avoid echoing raw questions. No result library or exception subclass is needed. Invalid question validation occurs before any RNG call. Authored deck failures are development errors, distinct from user input failures.

Placement/reveal/reset operate on trusted engine-produced state. Invalid targets, repeated actions, or actions in the wrong phase return the original state reference. This handles repeated input harmlessly and lets a future UI skip redundant updates. Do not revalidate every nested field of state produced by the engine. Unknown completed-reading input gets one boundary parse and checks before interpretation; malformed JSON/URL decoding is reserved for the share codec.

### 4. Session setup and explicit states

Use a discriminated union with the product's five states:

| State | Data and legal progress |
| --- | --- |
| `idle` | Active deck ID, empty question; a valid start enters choosing |
| `choosing` | Fixed normalized question, nine fixed card IDs indexed 0–8, and 0–2 selections; successful third placement enters ready |
| `ready` | Three face-down selections; one reveal enters revealing |
| `revealing` | Three selections, 1–2 revealed; third reveal enters complete |
| `complete` | Canonical completed reading and interpretation; reset returns idle |

Retain active deck identity throughout. Associate selections with position IDs, not insertion order. Counts come from selections/reveal flags; do not add `isComplete`, `canReveal`, or duplicated counters. Ready/revealing can discard the six unused choices. Complete state can discard session-only reveal flags and hidden choices because all result cards are revealed.

Setup takes an optional RNG function defaulting to `Math.random`. Its trusted contract is a number in `[0, 1)`; tests inject a deterministic sequence rather than monkey-patching the global RNG. For a surprise reading, consume one draw to choose a prompt first. Shuffle a copy of the 16 card IDs with descending Fisher–Yates, then retain the first nine. Do not sort with a random comparator, choose identity on placement, or retry to avoid a repeated session.

Only setup uses randomness. State transitions return immutable updates, without modifying incoming arrays/objects or deck data. Reset can be called from any state and does not shuffle until the next start. There are no session UUIDs, timestamps, timers, storage writes, event emitters, or background work.

The API can be a few named functions for initial state, start, place, reveal, reset, and interpretation. Keep invalid-command handling shared between future drag and non-drag callers by routing both to the same placement operation. No command bus or configurable transition table is needed.

### 5. Canonical completion and deterministic verdict

Follow the tech document's version-1 reading record: `version`, `deckId`, normalized `question`, `spreadId`, and three `{cardId, positionId}` pairs. Canonicalize pair order using the deck's spread positions. Validate exact cardinality, known IDs, unique cards/positions, matching deck/spread/version, and a valid nonempty normalized question before interpreting a standalone record. Empty input here is invalid: surprise selection only happens during session setup. The boundary parser normalizes a supplied question using the same rule before canonicalization.

Keep standalone interpretation separate from reveal gating: it can reconstruct a valid complete record without replaying a session, which the future share route needs. Session transitions only attach that record/interpretation on the third reveal. This is presentation gating, not secrecy: card identities and deck content are already application data.

Create the seed input with `JSON.stringify` of this fixed nested-array shape:

```text
[version, deckId, spreadId, normalizedQuestion,
  [[positionId, cardId], [positionId, cardId], [positionId, cardId]]]
```

Compute a synchronous unsigned FNV-1a hash over its UTF-8 bytes: start at `2166136261`, apply `Math.imul(hash ^ byte, 16777619) >>> 0` for each byte. Choose `hash % templates.length`. A short local function is enough; cryptographic hashing would add asynchronous work without a security requirement. Collisions are harmless because this selects phrasing, not reading identity. No exported general-purpose hash utility is needed.

Golden vector (computed during planning):

```text
[1,"developer","context-problem-advice","Should I rewrite it?",[["context","legacy-system"],["problem","infinite-refactor"],["advice","mvp"]]]
```

The expected unsigned hash is `211085329`, selecting template index `1` (the second template). Its verdict is `The cards remember that old decisions are still doing useful work. Right now, the architecture keeps improving while the finish line moves. Their advice: cut one requirement and finish the remaining loop.` Pin this as one explicit expected-output test, not a snapshot generated from the function under test. Also test that permuting pair/pick/reveal order does not change the result. Changes to authored content can change interpretations; permanent compatibility with old deck text is outside the MVP.

### 6. Focused TDD and handoff

Use the existing `node:test` and `node:assert/strict` commands. For each task, add the smallest failing behavior check, run it red, implement, then refactor green. Group closely related invalid inputs in tables. Do not add one test per card, giant snapshots, coverage targets, statistical randomness tests, or browser tooling for code that is not wired to the browser yet.

Keep a small set of scenario groups: content integrity; Unicode question boundaries; stable setup with seeded RNG; legal/illegal placements; reveal gating and reset; canonical deterministic interpretation and invalid records. A frozen input or before/after comparison proves immutability. A call-counting RNG proves no randomness is consumed after setup or on invalid questions. One example where two questions choose different template indices proves the question participates; do not require every different question to yield different prose.

Run `bun run verify` after implementation; its existing discovery covers the new tests. Update the README with the engine milestone and keep the preview limitation explicit. Clarify the exact normalization/counting rule in the technical document. UI, asset allow-lists, routes, Docker, CI, manifest, and lockfile need no edits for this change. The next change integrates this engine into the real Ask/Surprise me, placement, and reveal flow.

## Risks / Trade-offs

- [Pure engine is not a playable browser milestone] → State the boundary in the README and hand off directly to the UI-integration change.
- [Copy may be structurally valid but awkward] → Keep all draft copy in the reviewable content spec and manually read representative combinations for both templates.
- [Unicode length differs from native input maxlength] → Reuse this validator when wiring the form; do not silently replace code-point counting with UTF-16 length.
- [Premature reuse can inflate the engine] → Accept one deck value and use ordinary functions; replacement is proved with one test fixture.
- [Deterministic output drifts during refactoring] → Pin one explicit canonical vector and expected full verdict; test independence from runtime state and input ordering.

## Migration Plan

This change adds domain files and focused documentation updates without changing routes or stored data. There is no migration, deployment, or package upgrade. Preserve all current foundation edits. Validate the new change independently; foundation archival remains a separate requested operation.
