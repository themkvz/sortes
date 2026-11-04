## Purpose

Let a visitor reload or return to the page in the same browser session and continue the reading they started, while the stored copy reveals neither the question nor any hidden card identity.

## ADDED Requirements

### Requirement: Save a sealed copy of the reading in progress

After a reading starts, the experience SHALL keep a copy of its progress in one session cookie and update it after every start, placement and reveal. The copy SHALL contain the normalized question, the nine hidden choices in their order, which choices were picked, each placement with its position and reveal state, the time it was sealed, and the sequence number of the request that saved it. The cookie value SHALL be an opaque token sealed by the server with authenticated encryption under a server-held key; neither the question nor any card identity SHALL be readable from it without that key. Only the server SHALL set or clear the cookie, through its seal and clear responses. A question that was typed but never started, a pending selection that was not placed, and in-flight drag or animation state SHALL NOT be saved. Only one saved reading SHALL exist per browser session, under one fixed cookie name.

#### Scenario: Save after each step
- **WHEN** a visitor starts a reading, then places a card, then reveals a card
- **THEN** after each step the browser holds exactly one reading cookie for the current reading
- **AND** the cookie value contains no question text and no card ID, name, or meaning

#### Scenario: Nothing saved before a reading starts
- **WHEN** a visitor types a question but does not start a reading, or selects a choice without placing it
- **THEN** no new token is saved for that unstarted question or pending selection

#### Scenario: Sealing fails
- **WHEN** the seal request fails, times out, or returns an error
- **THEN** the reading continues normally in memory
- **AND** the saved reading is cleared so a reload cannot restore a stale step

### Requirement: Restore the reading when the page is rendered

When the server renders `/` for a request that carries a valid reading cookie, it SHALL render the restored reading directly: the same question as read-only, the same nine hidden choices in the same order, the placed and picked cards, and the revealed cards, including a completed reading with its verdict. The first paint SHALL show the restored reading, and the page SHALL NOT first show the idle board or a restoring message; the board in the browser SHALL start from the same restored state without another request. A restored reading SHALL continue under the existing rules for placement, reveal gates, `Reveal all`, sharing and `Ask again`. Restoring SHALL NOT replay card flips, sparkle bursts, or the verdict entrance, in the server-rendered HTML or after the board becomes interactive, and SHALL NOT show any card that was not revealed before the reload. When the board becomes interactive, focus SHALL move to the next useful control (the first available choice, the first revealable card, or the verdict) and the live status SHALL announce that the reading was restored.

#### Scenario: Reload while choosing
- **WHEN** a visitor has placed one card and reloads the page
- **THEN** the first paint shows the same question, the same eight remaining hidden choices and the placed card, without the idle board
- **AND** the visitor can place the remaining cards and finish the reading with the same deterministic result as without the reload

#### Scenario: Reload during reveals
- **WHEN** a visitor has revealed one of three placed cards and reloads
- **THEN** that card is shown face up without a flip, the other two stay face down and revealable, and no verdict is shown

#### Scenario: Reload after completion
- **WHEN** a visitor reloads after the verdict appeared
- **THEN** the completed reading and the same verdict are shown, with `Share` and `Ask again` available, and no entrance effects replay

#### Scenario: Back and forward navigation
- **WHEN** a visitor leaves the page and returns with the browser's back or forward button
- **THEN** the reading is restored the same way as after a reload

### Requirement: Keep the newest saved state when requests overlap

Every seal and clear request SHALL carry a sequence number that increases with each request of a page and stays above the requests of earlier page loads in the same browser. A seal or clear request that is superseded by a newer one SHALL NOT replace the newer saved state, even when it reaches the server or returns after the newer one: the server SHALL leave a saved state with a higher sequence number unchanged and answer the older request with success and no new cookie. Clearing SHALL leave a sealed marker that holds no reading, so a late older seal cannot bring a cleared reading back. On rendering `/`, that marker SHALL render the idle board without changing the cookie.

#### Scenario: Reveal all ordering
- **WHEN** a visitor uses `Reveal all`, and the seal for an earlier reveal returns after the seal for the last reveal
- **THEN** the saved reading stays complete
- **AND** a reload shows the completed reading and its verdict

#### Scenario: Ask again, then start quickly
- **WHEN** a visitor activates `Ask again` and starts a new reading before the clear request has returned
- **THEN** the saved reading is the new reading, and a late clear or a late seal of the old reading does not replace it

### Requirement: Reject invalid, expired, or foreign tokens safely

The server SHALL accept a token only if it was sealed with the current key, has not been altered, uses a supported version, is no older than 24 hours, and describes a reading that the reading rules could have produced: nine distinct known cards, picks and placements that match the choices, at most three placements in distinct configured positions, reveals only after all three placements, and a canonical question. On rendering `/` with any other cookie, the server SHALL clear the cookie and render the idle board with an empty question, without an error page. The seal request SHALL accept only JSON bodies, SHALL be limited in body size, and SHALL validate its input before use; an invalid seal request SHALL be rejected with a generic error that names no field or card and SHALL clear the saved reading when it carries a valid sequence number. The clear request SHALL accept only JSON bodies under the same size limit, and SHALL reject an invalid one with the same generic error without changing the cookie. The board SHALL treat a seal request that has not completed within 8 seconds as failed.

#### Scenario: Tampered token
- **WHEN** the reading cookie is edited by hand and the page reloads
- **THEN** the server rejects it, clears the cookie, and renders the board at idle

#### Scenario: Expired token
- **WHEN** the saved token is older than 24 hours when the page reloads
- **THEN** it is rejected, the cookie is cleared, and the board starts at idle

#### Scenario: Key rotated
- **WHEN** the server's sealing key changes and a visitor reloads with a token sealed under the old key
- **THEN** the token is rejected, the cookie is cleared, and the board starts at idle

#### Scenario: Impossible reading in a validly sealed token
- **WHEN** the server receives a token whose contents break the reading rules, such as a reveal before three placements or a repeated card
- **THEN** it is rejected the same way as a tampered token

#### Scenario: Invalid seal request
- **WHEN** the seal route receives a malformed, oversized, non-JSON or impossible body
- **THEN** it answers with the same generic error
- **AND** it clears the saved reading if the body carries a valid sequence number, and otherwise leaves the cookie unchanged

#### Scenario: Invalid clear request
- **WHEN** the clear route receives a non-JSON, oversized or malformed body
- **THEN** it answers with the same generic error and leaves the cookie unchanged

### Requirement: Keep restored readings private and scoped to the browser session

The saved token SHALL live only in one session cookie named `sortes_reading` with `HttpOnly`, `SameSite=Strict`, `Path=/`, no expiry date or maximum age, and `Secure` in production. It is the application's only cookie and is strictly necessary for restoring the reading. Page scripts SHALL NOT be able to read it, and `Ask again` SHALL clear the saved reading through the clear route, which leaves a sealed marker that holds no reading. All tabs of the same browser session SHALL share the one saved reading, and the most recently saved step SHALL win. The token SHALL NOT be written to local storage, session storage, IndexedDB, the URL, or any server-side store. The seal and clear routes and the restoring render SHALL be stateless: the server SHALL NOT store, cache, or log request bodies, cookies, tokens, questions, or card identities, and SHALL send `Cache-Control: no-store` on seal and clear responses and `Cache-Control: private, no-cache` with `Vary: Cookie` on `/` responses, so `/` is revalidated, a copy cached for another cookie is never shown, and the back/forward cache stays usable. A shared-reading page SHALL neither read nor set the reading cookie. Sealing SHALL NOT be described to visitors as hiding the reading from someone with access to the open page itself.

#### Scenario: Ask again clears the saved reading
- **WHEN** a visitor activates `Ask again` and then reloads
- **THEN** the board starts at idle with an empty question
- **AND** the reading cookie holds no reading

#### Scenario: Other tabs share the saved reading
- **WHEN** a visitor opens the board in another tab of the same browser session while a reading is saved
- **THEN** the other tab shows the same saved reading
- **AND** the tab that started the reading is unchanged

#### Scenario: Scripts cannot read the token
- **WHEN** a reading has been saved
- **THEN** `document.cookie` does not include the reading cookie, and local and session storage stay empty

#### Scenario: Server keeps nothing
- **WHEN** a reading is saved, restored, and completed
- **THEN** server logs show only the method, route shape and status for seal, clear and page requests, with no cookie, token, question, or card identity
