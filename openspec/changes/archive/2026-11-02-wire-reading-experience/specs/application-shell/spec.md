## REMOVED Requirements

### Requirement: Explicit foundation preview
**Reason**: The foundation preview is replaced by the playable reading experience specified in `reading-experience`.
**Migration**: Visitors can start a reading through `Ask` or `Surprise me` and complete the browser interaction loop.

## MODIFIED Requirements

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

### Requirement: Controlled route failures and private input
The application SHALL return status 404 with a readable application-owned message for unknown routes and status 500 with a generic message for unexpected request failures. Production responses SHALL not expose stack traces. The experience SHALL keep edited questions and all incomplete or completed reading state only in browser memory; it SHALL not persist, log, or transmit the question or reading state, and SHALL not require authentication, cookies, browser storage, or external services for the reading loop. Reloading `/` at any point SHALL return to the initial empty state without restoring a reading.

#### Scenario: Unknown route
- **WHEN** a visitor requests an unregistered path
- **THEN** the response has status 404 and provides a link back to `/`

#### Scenario: Unexpected server failure
- **WHEN** request processing fails unexpectedly in production mode
- **THEN** the response has status 500 and a generic readable message without a stack trace

#### Scenario: Ephemeral question
- **WHEN** a visitor edits a question, starts a reading, or completes a reading and then reloads `/`
- **THEN** the input returns to its initial empty state and no saved or completed reading is restored
- **AND** the question and reading state have not been persisted, logged, or transmitted
