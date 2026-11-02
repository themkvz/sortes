## Purpose

Provide a complete browser-based reading loop in which a visitor asks or surprises themselves, chooses and places hidden cards, reveals them individually, and receives a result. The experience is temporary and can be restarted without retaining prior reading state.

## ADDED Requirements

### Requirement: Show a shared decorative back on face-down cards
Every face-down choice and placed card SHALL use the same card-back artwork without disclosing card identity. The artwork SHALL retain a legible aspect ratio on mobile and desktop. It SHALL be decorative to assistive technology because its surrounding control provides the generic ordinal or position label. If the artwork is unavailable, the card SHALL retain a visible background and remain operable.

#### Scenario: Show the shared back on face-down cards
- **WHEN** hidden choices or placed cards are face-down
- **THEN** they show the same card-back artwork with a legible aspect ratio and no card identity disclosure
- **AND** the artwork is hidden from assistive technology while the control retains its generic label

#### Scenario: Keep cards operable when the back image fails
- **WHEN** the card-back artwork cannot be loaded
- **THEN** face-down cards retain a visible background and remain operable

### Requirement: Start a reading from a valid question
The experience SHALL offer `Ask` for nonempty input and `Surprise me` for empty or whitespace-only input while idle. Starting with a valid question SHALL display its trimmed, NFC-normalized value read-only and prepare nine stable, preassigned hidden choices from the active deck. Starting with empty or whitespace-only input SHALL choose a configured prompt and begin the same flow immediately. The question control SHALL accept at most 160 normalized Unicode code points; it SHALL validate the whole input rather than truncate it or rely on a native 160-character limit. Ill-formed Unicode and overlong normalized input SHALL receive inline feedback associated with the input, leave the experience idle, and consume no card-shuffle randomness. Pressing Enter in the question form SHALL start at most one reading. An attempt to start another reading while a reading is active SHALL leave the current question, choices, and placements unchanged.

#### Scenario: Ask with a valid question
- **WHEN** a visitor submits a valid nonempty question while idle
- **THEN** the normalized question becomes read-only and nine stable hidden choices appear

#### Scenario: Surprise me starts immediately
- **WHEN** a visitor submits empty or whitespace-only input while idle
- **THEN** a configured prompt is displayed as the read-only question and nine stable hidden choices appear in the same action

#### Scenario: Reject an invalid question
- **WHEN** a visitor submits a question that exceeds 160 normalized Unicode code points or contains ill-formed Unicode
- **THEN** concise inline feedback is programmatically associated with the input
- **AND** the experience remains idle with the input editable and no reading or shuffle started

#### Scenario: Count normalized Unicode code points
- **WHEN** a visitor enters a question containing supplementary-plane characters or text with decomposed Unicode
- **THEN** validation counts code points after trimming and NFC normalization rather than UTF-16 code units

#### Scenario: Enter submits once
- **WHEN** a visitor presses Enter in the question form while idle with valid input
- **THEN** exactly one reading starts

#### Scenario: Ignore a repeated start
- **WHEN** a visitor attempts to start another reading while a reading is active
- **THEN** the current question, choices, and placements remain unchanged

### Requirement: Choose and place hidden cards accessibly
The experience SHALL present nine stable, preassigned hidden choices as individually operable buttons with generic ordinal labels that do not reveal card identities. A visitor SHALL select one choice and then choose an empty configured spread position using pointer, Enter, or Space. Selecting another available choice while one is pending SHALL replace the pending choice. Pressing Escape while card selection is active SHALL clear only the pending choice. Successful placement SHALL clear the pending choice, leave the chosen card face-down, mark its choice unavailable, and leave all other choices and empty positions available. Activating an occupied position, reusing a picked choice, or attempting placement without a pending choice SHALL be a safe no-op. The active deck SHALL provide all position labels.

#### Scenario: Select a hidden choice
- **WHEN** a visitor activates one of the nine hidden-choice buttons
- **THEN** it becomes the pending choice without disclosing its card identity

#### Scenario: Replace or clear a pending choice
- **WHEN** a visitor selects another available choice while a choice is pending
- **THEN** the new choice becomes pending and the former choice is available again
- **AND WHEN** the visitor presses Escape
- **THEN** the pending choice is cleared without changing any placement

#### Scenario: Place into an empty position
- **WHEN** a visitor activates an empty configured position with a pending choice
- **THEN** that card is placed face-down, its choice cannot be reused, and the position label remains visible

#### Scenario: Ignore invalid placement actions
- **WHEN** a visitor activates an occupied position or attempts placement with no pending choice or a previously picked choice
- **THEN** the current placements and remaining choices stay unchanged

### Requirement: Gate reveals until placement is complete
The experience SHALL lock further choice and placement actions after the third distinct card is placed. Only then SHALL each placed card become independently revealable. Before its own reveal, a placed card SHALL expose only its configured position label and generic hidden-card description; its name, short description, and position meaning SHALL not appear in rendered content or accessibility labels. The verdict SHALL remain absent from rendered content and accessibility labels until the third reveal. Revealing a card SHALL expose only that card's name, short description, and meaning for its configured position. On the third reveal, the completed result SHALL contain the original normalized question, all three revealed cards and their position-specific meanings, and exactly one deterministic verdict. The result SHALL follow configured spread order regardless of placement or reveal order. The experience SHALL not provide a reveal-all action or a Share placeholder in this milestone. Card names and meanings are public deck content and are not required to be secret from inspection of client code.

#### Scenario: Third placement enables reveal
- **WHEN** the third distinct card is placed
- **THEN** all choice and placement actions are locked and each placed card can be revealed individually

#### Scenario: Keep unrevealed card identity out of the interface
- **WHEN** fewer than three cards have been placed or a placed card has not been revealed
- **THEN** that card's name, short description, and position meaning are absent from rendered content and accessibility labels

#### Scenario: Reveal one card
- **WHEN** a visitor reveals one placed card after all positions are filled
- **THEN** only that card's name, short description, and position-specific meaning become available
- **AND** unrevealed cards retain their generic hidden descriptions

#### Scenario: Show the verdict on the third reveal
- **WHEN** the final unrevealed placed card is revealed
- **THEN** the completed result appears immediately in configured spread order
- **AND** it contains the original normalized question, all three revealed cards and position-specific meanings, and exactly one deterministic verdict
- **AND** no reveal-all action is available
- **AND** no Share placeholder is shown

#### Scenario: Keep verdict hidden until completion
- **WHEN** fewer than three placed cards have been revealed
- **THEN** no verdict is present in rendered content or accessibility labels

### Requirement: Keep interaction state temporary and restartable
The experience SHALL keep the question, choices, placements, reveal state, and result only for the current in-memory session. Reloading at any point SHALL return to idle with empty input and no restored reading. After completion, `Ask again` SHALL return to idle, clear all reading state, keep the active deck, and focus the question input. The experience SHALL use the active developer deck only and SHALL NOT add a deck picker.

#### Scenario: Reload an incomplete or completed reading
- **WHEN** a visitor reloads during any reading state
- **THEN** the page returns to idle with empty input and no reading restored

#### Scenario: Ask again after completion
- **WHEN** a visitor activates `Ask again` after the verdict appears
- **THEN** all question and reading state is cleared, the active deck is retained, and focus moves to the question input

### Requirement: Provide recoverable keyboard focus and concise status
All actions SHALL be operable by keyboard with visible focus. After every successful placement, focus SHALL move to the next unpicked choice, wrapping to the first unpicked choice when needed; after the third placement it SHALL move to the first revealable card. After a reveal, focus SHALL move to the next unrevealed card, or after the third reveal to the verdict heading or its containing region. After `Ask again`, focus SHALL move to the question input. State changes SHALL be announced through concise live status updates and SHALL not repeatedly announce the full verdict.

#### Scenario: Recover focus after every placement
- **WHEN** a visitor successfully places a card
- **THEN** focus moves to the next unpicked choice, wrapping to the first unpicked choice when needed, or after the third placement to the first revealable card

#### Scenario: Recover focus after reveal
- **WHEN** a visitor reveals a card using the keyboard
- **THEN** focus moves to the next unrevealed card, or after the third reveal to the verdict heading or containing region

#### Scenario: Recover focus after restart
- **WHEN** a visitor activates `Ask again`
- **THEN** focus moves to the question input

#### Scenario: Announce state changes concisely
- **WHEN** the reading starts, a card is placed, a reveal becomes available, a card is revealed, or the reading completes
- **THEN** a concise status update communicates the change without repeating the full verdict

### Requirement: Support the complete flow on narrow screens without motion
The complete reading flow SHALL be usable at viewport widths of 320 CSS pixels and wider without horizontal overflow. No animation SHALL be required to understand or complete any action or result. The initial and interactive experience SHALL use configured deck labels and meanings as text.

#### Scenario: Complete a reading at 320 CSS pixels
- **WHEN** a visitor completes the full reading flow at a 320 CSS pixel viewport
- **THEN** controls and spread positions remain usable without horizontal scrolling

#### Scenario: Complete the flow without animation
- **WHEN** motion is unavailable or disabled
- **THEN** every choice, placement, reveal, and result remains understandable and operable
