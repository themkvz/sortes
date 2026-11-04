## MODIFIED Requirements

### Requirement: Controlled route failures and private input

The application SHALL return status 404 with a readable application-owned message for unknown routes and status 500 with a generic message for unexpected request failures. Production responses SHALL not expose stack traces. The ordinary reading loop SHALL keep an edited question that was never started only in browser memory. Once a reading starts, its state SHALL exist only in browser memory and in the sealed, `HttpOnly` browser-session cookie defined by `reading-restore`; the only transmission of reading state SHALL be the stateless seal and clear requests and that cookie on requests to the application's own server, which SHALL NOT store, cache, or log the question, cookies, tokens, or card identities. That cookie is the only cookie the reading loop sets and is strictly necessary for restoring a reading. The reading loop SHALL not require authentication, other cookies, local or session storage, or external services. The sole sharing exception SHALL require explicit confirmation after the question-in-URL warning on a completed reading, as defined by `reading-sharing`; confirmed shared data can then be copied, displayed, and requested through the read-only shared route. Opening or cancelling that warning SHALL NOT authorize disclosure. Reloading `/` before a reading starts or after `Ask again` SHALL return to the initial empty state without restoring a reading. A shared page SHALL neither read nor set the reading cookie, so following its link home shows the reading saved in that browser session, if any, or the initial empty state.

#### Scenario: Unknown route

- **WHEN** a visitor requests an unregistered path
- **THEN** the response has status 404 and provides a link back to `/`

#### Scenario: Unexpected server failure

- **WHEN** request processing fails unexpectedly in production mode
- **THEN** the response has status 500 and a generic readable message without a stack trace

#### Scenario: Ephemeral question

- **WHEN** a visitor edits a question without starting a reading and then reloads `/`
- **THEN** the input returns to its initial empty state and no reading is restored
- **AND** the question has not been persisted, logged, or transmitted

#### Scenario: Started reading is sealed, not exposed

- **WHEN** a visitor starts a reading
- **THEN** the only stored copy is the sealed token in the `HttpOnly` reading cookie, which page scripts cannot read
- **AND** the question and card identities are sent only to the application's own seal route, and are not logged or stored on the server

#### Scenario: Disclose only after share confirmation

- **WHEN** a visitor confirms sharing of a completed reading after seeing the privacy warning
- **THEN** only that completed reading can be exposed through its share URL
- **AND** ordinary subsequent readings remain private until separately confirmed
