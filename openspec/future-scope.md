# Future scope

The suggested changes below are planning notes only; they are not implemented or approved for
implementation. Each needs a separate OpenSpec proposal before build.

Product sources: [MVP tech design](../design/mvp-tech-design.md) and
[UI/UX design](../design/ui-ux-design.md).

## Implemented milestones

- **`add-desktop-card-dragging`**: Desktop mouse dragging uses the existing placement command.
  Valid drops make the final placement; invalid drops and cancellation leave the reading
  unchanged. Escape also clears selection. Click, tap, and keyboard placement remain available;
  touch and pen use these non-drag controls. See the
  [change](changes/archive/2026-11-02-add-desktop-card-dragging/proposal.md).

## Suggested changes

- **`add-card-front-artwork`** — Add symbolic card fronts. Card names, descriptions, and meanings
  remain accessible text, and the shared card back stays unchanged. Confirm the specific art
  direction and assets before implementation.
- **`add-card-reveal-motion`** — Add an individual flip on manual reveal after all cards are placed. Respect reduced
  motion; do not make action completion depend on animation or add `Reveal all`.
- **`add-reading-sharing`** — Share completed readings only. Show a privacy warning and require
  explicit confirmation before exposing or copying a URL. Define a versioned payload and
  read-only shared route that reproduces the deterministic result; handle malformed payloads.
  No database is needed for sharing. Specify route and payload compatibility in its proposal.
- **`polish-reading-board`** — Use the existing pen.dev reference to improve board readability,
  responsive layout including 320px, available/selected/placed states, focus, and contrast.

## Remaining release checks

The current milestone does not complete future sharing checks: share codec and route tests,
plus happy-path and invalid-share browser flows. Broader browser and device verification also
remains. See the [audit findings](../anti-slop/audit-002-2026-11-02.md) for two open findings
that need user-selected fixes; neither is approved for implementation.
