# application-shell Specification

## Purpose

Provide an accessible, responsive entry screen for the pseudo-tarot experience, establishing the application shell before the functional reading loop is added.

## Requirements

### Requirement: Direct server-rendered entry

The application SHALL respond to `GET /` with status 200 and an HTML document containing product branding, a labeled optional question input, a primary action, three empty spread positions, and an inactive hidden-card area. Essential initial content SHALL be present before browser JavaScript runs. The entry screen SHALL open directly onto the board without a marketing page or onboarding. Until browser interaction is initialized, controls that would change reading state SHALL remain inactive and the page SHALL communicate that initialization is in progress. If browser JavaScript is unavailable, the page SHALL explain that the reading experience requires JavaScript and SHALL NOT fabricate a reading.

#### Scenario: First visit

- **WHEN** a visitor requests `/` with browser JavaScript disabled
- **THEN** the response is successful HTML and the initial board structure and labels are visible
- **AND** the page has a descriptive document title, language, and mobile viewport configuration
- **AND** the page explains that the reading experience requires JavaScript without presenting a fabricated reading

#### Scenario: Initialize the interactive board

- **WHEN** a visitor opens `/` with browser JavaScript available but the interaction is not yet initialized
- **THEN** server-rendered branding, the input, three empty spread positions, and inactive card area are visible
- **AND** state-changing controls remain inactive with an honest initialization status until the experience is usable

### Requirement: Existing design is the visual source

The board SHALL follow the card-table hierarchy, palette, typography, spacing, and card proportions in `design/design.pen`, using `design/ui-ux-design.md` to interpret interaction intent. The desktop initial-reading frame, mobile board, and card-state samples SHALL be the visual reference. Branding and controls SHALL stay secondary to the spread and deck; the application SHALL NOT introduce a dashboard, marketing sections, new artwork, or unrelated decorative effects. Existing functional contracts, including the single Ask / Surprise me action and manual reveal gates, SHALL take precedence over static mock copy or placeholder controls. Necessary responsive and accessibility adaptations SHALL be documented, including three compact phone cards with full-width interpretation blocks below them. Missing visual details SHALL be identified rather than represented as verified fidelity.

#### Scenario: Desktop and mobile design review

- **WHEN** the board is compared with the existing design at desktop and phone widths
- **THEN** its typography, colors, card proportions, spacing, composition, and state cues are traceable to the inspected design
- **AND** responsive, accessibility, and static-mock adaptations are recorded for review

### Requirement: Accessible responsive foundation

The board SHALL use semantic input and button elements, a programmatic input label, visible keyboard focus, readable text contrast, and decorative artwork hidden from assistive technology. Normal text SHALL meet at least 4.5:1 contrast, and enabled control boundaries and focus/state indicators SHALL meet at least 3:1 against adjacent backgrounds. The question input SHALL have a distinguishable boundary before focus; selection and availability SHALL NOT depend on color alone. Primary controls, hidden choices, and eligible spread targets SHALL have pointer areas at least 48 by 48 CSS pixels. At viewport widths from 320 CSS pixels through desktop sizes, the normal flow SHALL require no horizontal scrolling or clipped controls. Longer text and text enlargement SHALL reflow rather than be truncated. Any motion SHALL respect reduced-motion preferences and preserve existing behavior.

#### Scenario: Keyboard and narrow viewport

- **WHEN** a visitor uses a keyboard on a 320 CSS pixel viewport
- **THEN** the question input is reachable with visible focus, labels remain readable, and all three spread positions remain understandable without horizontal scrolling
- **AND** focus outlines remain visible and enabled controls retain their minimum target sizes

#### Scenario: Reduced motion

- **WHEN** reduced motion is requested
- **THEN** nonessential motion is removed and the same information remains available as text

#### Scenario: Identify an unfocused question field

- **WHEN** a visitor views the enabled question input before interacting with it
- **THEN** its boundary has at least 3:1 contrast against the adjacent backgrounds
- **AND** its text, placeholder, validation feedback, and keyboard focus remain readable

### Requirement: Controlled route failures and private input

The application SHALL return status 404 with a readable application-owned message for unknown routes and status 500 with a generic message for unexpected request failures. Production responses SHALL not expose stack traces. The ordinary reading loop SHALL keep edited questions and all incomplete or completed reading state only in browser memory; it SHALL not persist, log, or transmit the question or reading state, and SHALL not require authentication, cookies, browser storage, or external services. The sole sharing exception SHALL require explicit confirmation after the question-in-URL warning on a completed reading, as defined by `reading-sharing`; confirmed shared data can then be copied, displayed, and requested through the read-only shared route. Opening or cancelling that warning SHALL NOT authorize disclosure. Reloading `/` at any point SHALL return to the initial empty state without restoring a reading, including after sharing or after following a shared page's link home.

#### Scenario: Unknown route

- **WHEN** a visitor requests an unregistered path
- **THEN** the response has status 404 and provides a link back to `/`

#### Scenario: Unexpected server failure

- **WHEN** request processing fails unexpectedly in production mode
- **THEN** the response has status 500 and a generic readable message without a stack trace

#### Scenario: Ephemeral question

- **WHEN** a visitor edits a question, starts a reading, or completes a reading without confirming sharing and then reloads `/`
- **THEN** the input returns to its initial empty state and no saved or completed reading is restored
- **AND** the question and reading state have not been persisted, logged, or transmitted

#### Scenario: Disclose only after share confirmation

- **WHEN** a visitor confirms sharing of a completed reading after seeing the privacy warning
- **THEN** only that completed reading can be exposed through its share URL
- **AND** ordinary subsequent readings remain private until separately confirmed
