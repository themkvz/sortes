## Why

The foundation renders the initial board, but no deck or reading logic exists. Add the content and tested domain rules that the next UI slice can use to deliver a complete, repeatable reading without putting product logic inside components.

## What Changes

- Define the first Developer Tarot deck: 16 named cards, five surprise prompts, Context/Problem/Advice positions, complete meanings, and two coherent verdict templates.
- Establish question normalization and an exact 160-Unicode-code-point limit, resolving the tech document's approximate limit.
- Add session setup that assigns nine unique hidden cards before interaction, immutable card placement, individual reveal gating, completion, and reset.
- Produce deterministic position-specific meanings and a final verdict from a canonical completed reading; question text provides variation without semantic analysis.
- Use the existing test runner for focused red/green/refactor checks of content integrity, invalid inputs/transitions, stable identities, and deterministic results.

## Capabilities

### New Capabilities

- `deck-content`: Complete, replaceable developer-deck data and its grammatical content contract.
- `reading-engine`: Question validation, session lifecycle, immutable choices, reveals, and deterministic interpretation.

### Modified Capabilities

None. `application-shell` remains the disabled initial preview. Its current spec lives in the completed, unarchived `bootstrap-remix-foundation` change; this change neither archives it nor modifies its requirements.

## Impact

Implementation adds domain modules and colocated tests under `app/domain/tarot/`, plus a short README update and an exact question-limit clarification in `design/mvp-tech-design.md`. It uses the installed `remix/data-schema` input-validation capability and Node's existing test runner; no packages, runtime upgrades, or tooling changes are needed.

UI wiring, card artwork, animation, drag-and-drop, share serialization/routes, persistence, and deployment are outside this change. Completion means the engine works through tests; the browser remains the foundation preview until the next change.
