## ADDED Requirements

### Requirement: Animate each manual card reveal independently

After all three positions are filled, manually revealing a placed card SHALL give that card one short flip from the shared back to its own front when motion is allowed. The flip SHALL affect only the artwork area; card names, descriptions, meanings, position labels, and controls SHALL remain readable without rotating or becoming mirrored. A reveal SHALL NOT animate or disclose another unrevealed card. Placement, ordinary board updates, and completion of the reading SHALL NOT replay a previously revealed card's flip. No reveal-all action SHALL be added.

#### Scenario: Flip only the activated card

- **WHEN** a visitor manually reveals one card with motion allowed after all three cards are placed
- **THEN** only that card performs a brief back-to-front flip
- **AND** its text remains readable while the other unrevealed cards retain their shared backs and generic labels

#### Scenario: Preserve independent reveals in any order

- **WHEN** a visitor reveals another card before a previous flip finishes, including revealing the final card
- **THEN** each newly revealed card can perform its own flip without waiting for the earlier one
- **AND** already revealed cards do not replay their motion and results retain configured spread order

#### Scenario: Keep the placement and reveal gate

- **WHEN** a visitor places cards or updates pending selection before all three positions are filled
- **THEN** no reveal flip runs and placed cards remain face-down
- **AND** the existing manual reveal gate remains in force

### Requirement: Keep reveal motion optional and independent of reading progress

Revealing a card SHALL commit its revealed state, accessible text, live status, and existing focus movement immediately. Revealing the third card SHALL make the deterministic verdict and restart action available immediately. None of these behaviors SHALL wait for animation or image loading, and rapid or repeated activation SHALL NOT duplicate a reveal or verdict. Reduced-motion preference SHALL show the final revealed artwork without a flip; enabling reduced motion during a flip SHALL settle it to its final state. Unavailable, disabled, interrupted, or cancelled animation SHALL leave the final revealed state usable. Restart or board removal during motion SHALL end the old visual effect without restoring old content or moving focus later. Motion SHALL preserve portrait proportions, decorative artwork semantics, and usability without horizontal overflow at widths of 320 CSS pixels and wider.

#### Scenario: Finish a reading while motion or images are pending

- **WHEN** the visitor reveals the final card while a flip is running or a front image is still loading or has failed
- **THEN** the correct card text, final verdict, restart action, and completion focus are available immediately
- **AND** no animation or image completion is needed to finish the reading

#### Scenario: Respect reduced motion

- **WHEN** a visitor reveals a card with reduced motion requested or enables that preference during a flip
- **THEN** the card displays its final revealed state without continuing a flip
- **AND** reveal order, text, live status, focus, and verdict timing retain their normal behavior

#### Scenario: Recover from interrupted motion or restart

- **WHEN** animation is unavailable or interrupted, or a visitor restarts or removes the board during a flip
- **THEN** the current reading state remains usable or the requested reset completes immediately
- **AND** old animation work cannot restore cards, change the new reading, move focus later, or produce an unhandled error

#### Scenario: Keep moving artwork decorative and contained

- **WHEN** a card flips at desktop or a narrow viewport of at least 320 CSS pixels
- **THEN** its artwork keeps its portrait area and adds no horizontal scrolling or duplicate accessible content
- **AND** names, descriptions, meanings, and controls remain readable and operable
