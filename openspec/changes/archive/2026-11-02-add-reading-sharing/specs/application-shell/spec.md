## MODIFIED Requirements

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
