## Why

A reload today throws away a reading in progress: the question, the nine hidden choices, the placed cards and any reveals. On phones, an accidental pull-to-refresh or a tab the browser discards in the background ends the ritual halfway. Visitors should be able to come back to the reading they started in the same browser session, without anyone being able to read the hidden card identities from what the browser stores, and without the empty board flashing before the restored reading appears.

## What Changes

- Once a reading starts, the board keeps a copy of its progress in one `HttpOnly` session cookie, updated after every start, placement and reveal. A reload, or a return through back/forward, restores the same question, the same nine hidden choices, the placed cards and the revealed cards, through to a completed verdict.
- The cookie value is an opaque token sealed by the server with authenticated encryption (AES-256-GCM, key from a server secret). It carries no readable card identity or question; a tampered, expired or foreign token is rejected, the cookie is cleared, and the board starts fresh.
- The server reads the cookie when it renders `/` and server-renders the restored reading, so the first paint already shows it and hydration starts from the same state. There is no visible restoring step and no client request to open the token.
- Two small stateless POST routes seal the reading into the cookie and clear it. Nothing is stored on the server, and request bodies, tokens and cookies are never logged. `/` responses send `Cache-Control: private, no-cache` and `Vary: Cookie` because the page now depends on the cookie: the browser revalidates it, never reuses a copy cached for another cookie, and may still use the back/forward cache. Every seal and clear carries a client sequence number, so a superseded request cannot replace a newer saved state.
- `Ask again`, the end of the browser session, and an expired token (24 hours) all discard the saved reading. Questions that were typed but never started are not saved. Tabs of the same browser session share the one saved reading.
- A restored reading does not replay card flips, sparkle bursts or the verdict entrance, and keyboard focus and the live status land on the next useful action.
- A new required production setting, `READING_STATE_SECRET`, holds the sealing key. Development and test generate a temporary key at startup.
- **BREAKING (behavior)**: reloading during a reading no longer returns to an empty board, and the board now sets one strictly necessary session cookie and sends reading state to its own server. This replaces the current "memory only, never persisted or transmitted, no cookies" rule for live readings. Sharing, shared pages and the no-JavaScript entry are unchanged.

## Capabilities

### New Capabilities

- `reading-restore`: sealing the in-progress reading into a session cookie, what is saved and when, how the server restores it on render, expiry, rejection of invalid tokens, and what is never stored, logged or exposed.

### Modified Capabilities

- `reading-experience`: "Keep interaction state temporary and restartable" changes from memory-only to restore within the browser session, with `Ask again` clearing the saved reading.
- `application-shell`: "Controlled route failures and private input" allows the sealed session cookie and the seal and clear requests in place of "only in browser memory" and "no cookies", while keeping the no-logging and no-server-storage rules.

## Impact

- Board client code (`app/actions/public/`): seal after state changes, clear on `Ask again` and on a failed seal, start from a server-provided restored snapshot, skip entrance effects for restored cards.
- Domain (`app/domain/tarot/`): a versioned, validated snapshot of a reading that rebuilds a `ReadingState` without trusting its input.
- Server: seal and clear POST routes with JSON-only bodies, body-size limits, request ordering and `no-store` responses, cookie reading and restored rendering in the home action, a sealing module using Web Crypto, and a new validated environment setting in `app/env.ts` and `.env.example`.
- Deployment: `READING_STATE_SECRET` must be set in production; rotating it invalidates saved readings, which then start fresh.
- Tests: browser tests that assert no browser storage writes change to assert only the sealed `HttpOnly` cookie; new server, domain and end-to-end tests for restore, tampering and expiry.
- No new dependencies.
