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

- **`add-card-front-artwork`**: All 16 developer cards have approved engraved fronts, revealed
  individually alongside accessible text. Optimized local images preserve the shared back
  and leave readings usable when images fail. See the [change](changes/archive/2026-11-02-add-card-front-artwork/proposal.md)
  and [asset review record](../design/card-fronts/README.md).

- **`add-card-reveal-motion`**: Individual manual reveals have a short artwork-only flip.
  Text, focus, and the verdict remain immediate; reduced motion shows the final front without
  a flip. Restart cancels old effects. See the [change](changes/archive/2026-11-02-add-card-reveal-motion/proposal.md)
  and [implementation check](../anti-slop/audit-004-2026-11-02.md).

- **`add-reading-sharing`**: Completed readings can create a V1 share URL after the privacy
  warning and explicit confirmation. Recipients get a read-only server-rendered result;
  invalid links have a controlled recovery page. Clipboard failure leaves a selectable URL.
  No database is used; historical deck-content compatibility remains outside this milestone.
  See the [change](changes/archive/2026-11-02-add-reading-sharing/proposal.md) and
  [implementation check](../anti-slop/audit-005-2026-11-02.md).

## Suggested changes

- **`polish-reading-board`** — Use the existing pen.dev reference to improve board readability,
  responsive layout including 320px, available/selected/placed states, focus, and contrast.

## Remaining release checks

Sharing codec, route, consent, clipboard-fallback, and invalid-link checks are implemented.
Broader browser and physical-device verification remains, along with CI and production
container checks for this milestone. See the [latest audit](../anti-slop/audit-005-2026-11-02.md)
for two retained board-polish findings; neither is approved for implementation.
