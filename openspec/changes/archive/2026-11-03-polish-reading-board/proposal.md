## Why

The reading, artwork, motion, and sharing milestones are complete, but the board still differs from the pen.dev composition. Two retained findings also remain: the question input boundary has insufficient contrast, and three narrow text columns make completed readings cramped at 320 px.

## What Changes

- Restore the desktop deck's small portrait cards, centered arrangement, spacing, and shallow vertical stagger from `design/design.pen`, instead of stretching nine cards across equal tracks.
- Align the ask area and spread with the reference's card-table hierarchy, keeping the existing single Ask / Surprise me action and approved artwork.
- Keep the phone deck compact and the three spread cards side by side. As explicitly selected by the user, put each revealed interpretation in a full-width block below the card row on phones, rather than stacking the cards or squeezing their text into three columns.
- Make available, selected, already placed, valid-drop, and revealable states distinguishable without relying only on color, using the reference's circular state badges and filled valid-target style. Improve keyboard focus, control boundaries, text size, and spacing.
- Add the reference's header stage indicator, table gradient, idle hint, and deck copy.
- Apply the same readable result layout to read-only shared pages, including without JavaScript. Preserve partial-reveal secrecy and card-to-position associations.
- Close the two retained audit findings through measured contrast and real-browser review. Exclude new artwork, new motion effects, engine changes, payload changes, and a wider redesign.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `application-shell`: Specify design fidelity, accessible contrast, and responsive control targets for the polished board.
- `reading-experience`: Define the deck composition, visible interaction states, and readable phone interpretations while preserving the existing reading flow.
- `reading-sharing`: Apply the same compact-card/full-width-text phone presentation to shared results without adding interactivity.

## Impact

- Main owners: the board styles, board/card/result components, shared-reading page, and existing page shell. Keep the current Remix component and CSS patterns.
- Extend existing browser journeys for responsive text placement, contrast, state cues, focus, and drag hit targets. Keep engine, codec, and current motion/sharing regression coverage.
- No new dependency, route, transport format, session state machine, persistence, or generated asset.
- Reference inspection on 2026-11-03 covered the live pen.dev desktop frame, mobile board, card-state samples, and variables. The selected phone interpretation layout is a documented adaptation because those static frames do not show long completed meanings.
