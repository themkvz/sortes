# application-shell Specification

## Purpose

Provide an accessible, responsive entry screen for the pseudo-tarot experience, establishing the application shell before the functional reading loop is added.

## Requirements

### Requirement: Direct server-rendered entry

The application SHALL respond to `GET /` with status 200 and an HTML document containing product branding, a labeled optional question input, a primary action, three empty spread positions, and an inactive hidden-card area. Essential initial content SHALL be present before browser JavaScript runs. The entry screen SHALL open directly onto the board without a marketing page or onboarding.

#### Scenario: First visit

- **WHEN** a visitor requests `/` with browser JavaScript disabled
- **THEN** the response is successful HTML and the initial board structure and labels are visible
- **AND** the page has a descriptive document title, language, and mobile viewport configuration

### Requirement: Explicit foundation preview

The foundation screen SHALL allow editing the question and display `Surprise me` for empty or whitespace-only input and `Ask` for nonempty trimmed input. The primary action SHALL remain visibly disabled with adjacent explanatory text that reading interaction is not yet available in this preview. No reading, verdict, or share link SHALL be fabricated.

#### Scenario: Question edit

- **WHEN** a visitor enters non-whitespace question text
- **THEN** the primary action label changes to `Ask` while remaining disabled
- **AND** clearing the question restores `Surprise me`

#### Scenario: Preview has no reading action

- **WHEN** a visitor clicks the disabled primary action or presses Enter in the question input
- **THEN** no reading starts, no navigation occurs, and question text is not submitted over the network

### Requirement: Existing design is the visual source

The initial board SHALL follow the foundation and first-screen design in `design/design.pen`, using `design/ui-ux-design.md` to interpret the interaction intent. The implementation SHALL preserve the card-table hierarchy and keep branding and controls secondary to the spread and card area. Missing visual details SHALL be identified during design inspection rather than represented as verified fidelity.

#### Scenario: Desktop and mobile design review

- **WHEN** the initial screen is compared with the existing design at desktop and phone widths
- **THEN** its typography, colors, card proportions, spacing, and composition are traceable to that design
- **AND** any necessary responsive adaptation is recorded for review

### Requirement: Accessible responsive foundation

The entry screen SHALL use semantic input and button elements, a programmatic input label, visible keyboard focus, readable text contrast, and decorative artwork hidden from assistive technology. At viewport widths from 320 CSS pixels through desktop sizes, the normal screen SHALL not require horizontal scrolling. Any motion SHALL respect reduced-motion preferences.

#### Scenario: Keyboard and narrow viewport

- **WHEN** a visitor uses a keyboard on a 320 CSS pixel viewport
- **THEN** the question input is reachable with visible focus, labels remain readable, and all three spread positions remain understandable without horizontal scrolling

#### Scenario: Reduced motion

- **WHEN** reduced motion is requested
- **THEN** nonessential motion is removed and the same information remains available as text

### Requirement: Controlled route failures and private input

The application SHALL return status 404 with a readable application-owned message for unknown routes and status 500 with a generic message for unexpected request failures. Production responses SHALL not expose stack traces. The foundation SHALL not persist, log, or transmit the edited question, and SHALL not require authentication, cookies, browser storage, or external services to display the board.

#### Scenario: Unknown route

- **WHEN** a visitor requests an unregistered path
- **THEN** the response has status 404 and provides a link back to `/`

#### Scenario: Unexpected server failure

- **WHEN** request processing fails unexpectedly in production mode
- **THEN** the response has status 500 and a generic readable message without a stack trace

#### Scenario: Ephemeral question

- **WHEN** a visitor edits the question and reloads `/`
- **THEN** the input returns to its initial empty state and no saved reading is restored
