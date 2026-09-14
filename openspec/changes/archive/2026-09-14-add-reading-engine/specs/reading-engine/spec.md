## Purpose

Provide reusable reading behavior that turns a question and three deliberate card choices into a stable interpretation, independently of rendering, storage, and network services.

## ADDED Requirements

### Requirement: Normalized bounded questions

Starting a reading SHALL accept only a string question. It SHALL trim leading/trailing whitespace and normalize Unicode to NFC before counting up to 160 Unicode code points. Internal whitespace, letter case, and punctuation SHALL be preserved. Non-string input, ill-formed Unicode strings, and normalized input longer than 160 code points SHALL return a controlled validation failure without changing the current state or consuming randomness. Input SHALL not be silently truncated or semantically analyzed.

#### Scenario: Normalization preserves framing

- **WHEN** a reading starts with `  Should I  rewrite it?  `
- **THEN** the stored question is `Should I  rewrite it?`
- **AND** equivalent composed/decomposed Unicode question spellings normalize identically

#### Scenario: Exact length boundary

- **WHEN** input contains exactly 160 normalized code points, including supplementary-plane characters
- **THEN** it is accepted
- **AND** 161 code points, a non-string value, or an unpaired surrogate produce a validation failure

### Requirement: Start with fixed hidden choices

Starting from idle SHALL create a choosing session containing nine distinct cards selected from a shuffled copy of the supplied valid 16-card deck. Hidden-choice positions SHALL identify real cards before any placement; their identities and ordering SHALL remain stable for that session. Setup SHALL not modify the authored deck or another session.

For empty normalized input, setup SHALL select one of the deck's prompts, store it as the question, and enter choosing immediately. The session SHALL not accept a second start until reset. Fresh sessions SHALL consume fresh randomness but SHALL not guarantee a different result by retrying.

#### Scenario: Ask and Surprise me

- **WHEN** an idle reading starts with a valid nonempty question
- **THEN** that normalized question is stored with nine preassigned distinct hidden choices
- **AND WHEN** an idle reading starts with whitespace-only input
- **THEN** a configured prompt is stored and nine choices are prepared in the same operation

#### Scenario: Stable choices and independent sessions

- **WHEN** two sessions are created and a card is placed in one session
- **THEN** that session's nine original identity assignments remain unchanged
- **AND** the other session and authored deck remain unchanged

### Requirement: Final card placement

While choosing, the consumer SHALL be able to place an unpicked hidden choice into any empty configured position. A placed card SHALL remain face-down and SHALL not be replaced, moved, removed, or picked again. Exactly three successful placements SHALL enter ready; placement order SHALL not determine spread order.

An unknown choice, out-of-range/noninteger choice index, unknown position, occupied position, already picked card, or placement outside choosing SHALL leave state unchanged. A repeated start outside idle SHALL also leave state unchanged. These rejected interaction commands SHALL not consume randomness or throw an unexpected error.

#### Scenario: Invalid placement is harmless

- **WHEN** a consumer attempts to reuse a selected choice, overwrite a position, or place into an unknown position
- **THEN** the previous state and its existing selections remain unchanged

#### Scenario: Third placement locks selection

- **WHEN** the third distinct card is placed into the remaining empty position
- **THEN** the session becomes ready with three face-down cards
- **AND** further placement attempts leave that state unchanged

### Requirement: Individual reveal and completion

Reveal SHALL be allowed only after all three positions are filled. Each placed card SHALL be revealable independently, in any order, with its own position-specific meaning. Zero revealed cards corresponds to ready, one or two to revealing, and three to complete. No reveal-all command SHALL exist.

An unknown position, reveal before ready, repeated reveal, or reveal after completion SHALL leave state unchanged. Before the third reveal, session output SHALL contain no completed reading or final verdict. The third reveal SHALL produce the completed reading and deterministic interpretation immediately, without waiting for animation or a timer.

#### Scenario: Gated reveal

- **WHEN** a consumer attempts to reveal after only two placements
- **THEN** neither card identity presentation state nor session status changes
- **AND WHEN** all three cards are placed and one is revealed
- **THEN** only that card is marked revealed and the final verdict remains unavailable in session output

#### Scenario: Complete in any reveal order

- **WHEN** all three placed cards are revealed in any order
- **THEN** the session becomes complete with the same reading and verdict for the same question and position assignments

### Requirement: Canonical deterministic interpretation

A completed reading SHALL contain version 1, deck ID, normalized question, spread ID, and exactly three card/position pairs ordered by the supplied spread's position order. Its interpretation SHALL contain each card's name, short description, standalone meaning for its assigned position, and one complete verdict composed from the corresponding summary fragments.

The same completed reading and unchanged deck content SHALL always yield the same interpretation. Template choice SHALL be a deterministic function of normalized question, deck ID, spread ID, and ordered card/position assignments. It SHALL not depend on time, environment, random draws, object property order, placement order, or reveal order. Different questions are allowed to choose the same template.

#### Scenario: Repeat interpretation

- **WHEN** the same completed reading is interpreted repeatedly, including with shuffled input pair order
- **THEN** the result is identical and its cards follow spread order

#### Scenario: Card-position assignment matters

- **WHEN** a card is assigned to Advice instead of Context in an otherwise valid completed reading
- **THEN** that card uses its Advice meaning and fragment
- **AND** template selection uses the changed assignment without guaranteeing a different template

#### Scenario: Reject impossible reading data

- **WHEN** interpretation receives an unsupported reading version, mismatched deck/spread, invalid question, unknown card/position, missing pair, or duplicate card/position
- **THEN** it returns a controlled invalid-reading failure rather than partial interpretation

### Requirement: Reset and ephemeral operation

Reset SHALL return any engine-owned session to idle with the same active deck and an empty question, discarding its choices, placements, reveal flags, and completed result. Reset SHALL consume no randomness; the next start SHALL prepare the next session. Domain operations SHALL use no network, storage, cookies, timers, or global session state, and SHALL not log question text.

#### Scenario: Ask again

- **WHEN** a complete or incomplete session resets
- **THEN** it returns to idle with no previous reading data and the same active deck
- **AND** a subsequent start independently prepares nine hidden choices
