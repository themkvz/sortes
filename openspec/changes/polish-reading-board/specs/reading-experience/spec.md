## ADDED Requirements

### Requirement: Preserve the reference deck composition

At desktop widths that fit the reference deck, the nine face-down choices SHALL appear as compact portrait cards in a centered row with the reference's shallow vertical stagger and spacing, without stretching to fill wide tracks. At phone and intermediate widths they SHALL form a compact three-by-three arrangement with distinct, non-overlapping hit areas. The approved shared-back artwork SHALL retain its proportions without cropping. The idle deck SHALL appear inactive; during choosing, the nine identities and ordinal positions SHALL stay stable as cards are picked. Visual offsets SHALL NOT change document order, obscure focus, expose card identities, cause horizontal overflow, or prevent a primary-mouse drag from starting on its visible source.

#### Scenario: Show the desktop deck

- **WHEN** a visitor views the idle or choosing board at a 1440 CSS pixel viewport
- **THEN** the deck shows nine compact portrait cards with a centered, shallow stagger traceable to the desktop reference
- **AND** starting and making choices retain the same ordinal arrangement rather than stretching or reordering the cards

#### Scenario: Condense the deck without shrinking hit targets

- **WHEN** the board is viewed at 390 or 320 CSS pixels or crosses between compact and desktop layouts
- **THEN** the deck remains usable without overlap or horizontal scrolling, with hit areas at least 48 by 48 CSS pixels
- **AND** the three-by-three compact layout preserves the back artwork and choice order

### Requirement: Distinguish card interaction states

Available, pending selection, already placed, eligible empty target, and revealable states SHALL have visible cues consistent with the pen.dev card-state reference and native accessible semantics. Pending selection SHALL have a shape or text cue in addition to color. A picked choice SHALL remain in its original deck position, visibly marked as placed and unavailable without revealing its identity; inactive idle choices SHALL NOT be labeled as already placed. Eligible empty targets SHALL remain distinguishable from occupied or inactive targets. Placed cards SHALL remain face-down and locked until all three are placed; only then SHALL a visible generic reveal cue appear. Keyboard focus SHALL remain distinct from selection, and hover styling SHALL apply only to available controls on hover-capable input. During a drag, the eligible target under the pointer SHALL show the same valid-target cue as selection-based placement, and cancellation behavior SHALL remain intact.

#### Scenario: Select and place a hidden card

- **WHEN** a visitor selects an available choice and places it into an empty position
- **THEN** pending selection and eligible destinations are visibly identified without card identity disclosure
- **AND** the picked choice stays at its ordinal position with a placed/unavailable cue, while other choices stay available

#### Scenario: Distinguish reveal availability from placement

- **WHEN** fewer than three cards are placed
- **THEN** placed cards remain visibly locked and reveal is unavailable
- **AND WHEN** the third distinct card is placed
- **THEN** each placed card has an understandable generic reveal cue without revealing itself or the verdict

#### Scenario: Keep focus and drop feedback usable

- **WHEN** a visitor navigates by keyboard or drags over an empty target and then cancels
- **THEN** focus or the valid-drop indicator is visible without relying only on color
- **AND** cancellation restores the existing usable state without stale hover or selection feedback

## MODIFIED Requirements

### Requirement: Support the complete flow on narrow screens without motion

The complete reading flow SHALL be usable at viewport widths of 320 CSS pixels and wider without horizontal overflow. No animation SHALL be required to understand or complete any action or result. The initial and interactive experience SHALL use configured deck labels and meanings as text. On phones, three compact spread cards SHALL remain side by side, with each revealed card's name, description, and position-specific meaning in its own full-width interpretation block below the card row. Interpretation body text SHALL be at least 16 CSS pixels with line height at least 1.45, and SHALL NOT be squeezed into narrow card columns, clipped, abbreviated, or hidden behind an additional action. Blocks SHALL be clearly labeled by position and card name and ordered by configured spread position. Only an individually revealed card SHALL contribute a block; each name, description, and meaning SHALL have one accessible text representation. Reflow and viewport resizing SHALL preserve selected/placed cards, reveal state, focus recovery, and the existing one-shot reveal behavior.

#### Scenario: Complete a reading at 320 CSS pixels

- **WHEN** a visitor completes the full reading flow at a 320 CSS pixel viewport
- **THEN** controls and spread positions remain usable without horizontal scrolling
- **AND** three compact card faces remain in one row while their complete interpretations occupy full-width blocks below

#### Scenario: Complete the flow without animation

- **WHEN** motion is unavailable or disabled
- **THEN** every choice, placement, reveal, and result remains understandable and operable

#### Scenario: Read partial reveals without exposing other cards

- **WHEN** a visitor reveals one card in any position on a phone
- **THEN** only that card's labeled interpretation appears below the row, with readable full-width text
- **AND** other unrevealed identities and the verdict remain absent until their existing gates permit them

#### Scenario: Resize without duplicating or replaying content

- **WHEN** the viewport changes between phone and desktop widths during a reading
- **THEN** the same reading and card-to-position assignments remain and revealed content has one accessible representation
- **AND** prior reveal animations do not replay and no action requires restoring lost selection or focus
