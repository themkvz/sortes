## Context

See proposal.md for the motivation. Today the whole reading runs in the browser: `app/domain/tarot/reading.ts` shuffles with `Math.random`, the board keeps a `BoardState` in its setup scope, and the server only renders pages and serves assets. The deck, including every card name and meaning, already ships to the browser, and the current spec says card content need not be secret from inspection of client code. The visitor chose restore through the verdict and stored data that hides card identities. Hiding identities in storage is only possible if a key the browser does not have seals the data, so the server joins the loop for the first time.

A first version kept the token in `sessionStorage` and opened it with a client request after hydration. That made the empty board flash before the restored reading appeared. Keeping the token in a cookie lets the server open it while it renders `/`, so the first paint already shows the restored reading.

## Goals / Non-Goals

**Goals:**

- A reload or back/forward in the same browser session restores the exact reading, with the same deterministic result, from the first paint.
- The stored value reveals no question or card identity without the server key, and any altered, expired or impossible value is rejected.
- The server stays stateless and logs nothing about the reading.
- The board works exactly as today when sealing fails or the cookie is rejected.

**Non-Goals:**

- Hiding card identities from the running page itself (its memory, the shipped deck, and the hydration props of a restored page). Doing that would need the server to own the shuffle and reveal, which is a separate, much larger change.
- Separate readings per tab, restore across browsers or devices, or restore after the browser session ends.
- Restoring a pending selection, a drag in progress, or animation progress.
- Accounts, local storage, tracking or preference cookies, or any server-side reading store.

## Decisions

### 1. Seal on the server with AES-256-GCM, keyed from `READING_STATE_SECRET`

The server derives a 256-bit key from the secret once at startup (SHA-256 of the secret through Web Crypto `importKey`/`digest`, available in Bun with no dependency) and seals each snapshot with AES-GCM, a fresh 96-bit random IV per seal, and the format version as additional authenticated data. The token is `base64url(version byte ‖ IV ‖ ciphertext+tag)`. GCM gives confidentiality and tamper detection in one primitive, so no separate HMAC is needed.

- `app/env.ts` validates `READING_STATE_SECRET`: required in production with at least 32 characters; in development and test a random secret is generated per process, so tokens simply stop opening after a restart. `.env.example` documents it.
- Alternative considered: HMAC-signed but readable payload. Rejected, because the visitor asked for hidden identities.
- Alternative considered: plain base64url with a checksum and no server key. Simplest by far, but anyone can decode it.

### 2. A versioned snapshot validated by the domain, not trusted from the token

`app/domain/tarot/` gains a small snapshot module: `toSnapshot(state)` and `fromSnapshot(deck, input)`. The snapshot holds `{ v: 1, q, choices: [9 card ids], picked: [indices], placements: { [positionId]: { choice: index, revealed: boolean } } }`. The seal time and request order are not part of the reading, so the server keeps them in its own envelope (decision 7). `fromSnapshot` validates the shape with `remix/data-schema` and then rebuilds the state through the existing pure transitions (`start` with the stored choices instead of a shuffle, then `place` and `reveal` in a fixed order) so the engine's own rules decide whether the snapshot is possible. Any mismatch returns a single `invalid-snapshot` result.

- `start` gains an internal path that accepts a known choice list, so restore never consumes randomness and produces the same interpretation.
- Alternative considered: storing the full `ReadingState` JSON. Rejected: it couples storage to internal shapes and would let a sealed-but-wrong state skip the rules.

### 3. One `HttpOnly` session cookie, set and cleared only by the server

The token lives in the cookie `sortes_reading` with `HttpOnly`, `SameSite=Strict`, `Path=/`, no `Expires` or `Max-Age` (a browser-session cookie), and `Secure` in production. It is built with `remix/cookie` (`createCookie`) using an identity codec, because the base64url token is already cookie-safe; the token is sealed, so the cookie is not signed again. Clearing a saved reading replaces it with a sealed tombstone (decision 7), still a session cookie. Only `/` deletes the cookie, with an empty value and `Max-Age=0`, when it cannot open it.

- Page scripts cannot read the cookie, so the board never sees the token.
- All tabs of one browser session share the cookie, so they share the saved reading; the last saved step wins. This replaces the per-tab scope of the first version.
- `Secure` is off in development and test because they run on plain `http://localhost`.
- Alternative considered: keep `sessionStorage` and open the token after hydration. Rejected: the server cannot read it, so the first paint shows an empty board.

### 4. Seal and clear routes; restore happens while rendering `/`

`app/routes.ts` adds `readingSeal: post('/reading-state/seal')` and `readingClear: post('/reading-state/clear')`. Both accept only JSON bodies of at most 4 KB, carry the client's request sequence (decision 7), and answer JSON with `Cache-Control: no-store`.

- Seal reads `{ seq, snapshot }`, validates the snapshot with `fromSnapshot`, stamps the seal time with the server clock, and answers `{ ok: true }` with `Set-Cookie`. Any invalid input gets a generic `400 { error: 'invalid-reading-state' }`. With a valid `seq` it also writes a tombstone, so a failed seal never leaves an older step behind; without one the cookie is left alone.
- Clear reads `{ seq }` and answers `{ ok: true }` with a tombstone `Set-Cookie`; an invalid body gets the same generic 400 and leaves the cookie alone.
- The home action reads the cookie, opens the token, validates it with `fromSnapshot`, and checks its age (24 hours from the seal time, which only this server stamps). On success it renders the page with the snapshot as a serializable prop of the `ReadingBoard` client entry. A tombstone renders the idle board and keeps the cookie. With a rejected cookie it renders the idle board and deletes the cookie. `/` always sends `Cache-Control: private, no-cache` and `Vary: Cookie`, because its HTML now depends on the cookie: shared caches never keep it, the browser revalidates it on every load, and the back/forward cache can still restore the live page. Chromium reuses a `no-cache` page on back/forward without revalidating it, so without `Vary: Cookie` it showed the idle page cached before the reading started; with it, a changed cookie misses that copy.
- The shared-reading route neither reads nor sets the cookie.
- The privacy-safe request logger already logs only method, path and status, so bodies and cookies never reach the logs.
- Alternative considered: a `GET` with the token in the URL. Rejected: tokens in URLs leak into history and logs.

### 5. Client: seal after each committed step, start from the restored snapshot

- After `start`, every successful `place` and every `reveal` (including each step of `Reveal all`), the board posts the snapshot to seal. One `AbortController` cancels an older in-flight request so the last step wins. A seal that fails or takes longer than 8 seconds is followed by a best-effort clear on the same controller.
- `Ask again` cancels any in-flight seal and posts a clear.
- If the browser's `fromSnapshot` rejects a snapshot the server accepted (a version skew between server and client code), the board starts idle and posts a clear, so the next load agrees with it.
- The board rebuilds its first state from the snapshot prop with `fromSnapshot` during setup, on the server and in the browser, so both render the same restored board and hydration needs no extra request. The server-rendered board keeps its controls inactive with "Preparing the deck…" like the idle board; after hydration the board becomes ready, the live status changes to "Reading restored.", and focus moves through the existing `focus()` helper to the first available choice, the first revealable card, or the verdict. There is no restoring state.

### 6. Restored cards render settled

The board marks positions that were already revealed in the snapshot, and `RevealedCard` skips the flip, sheen and sparkle burst for them; the result panel skips its entrance (`@starting-style`) through a `data-restored` attribute. Because the marks come from the snapshot prop, the server-rendered HTML is already settled. Cards revealed after the restore animate as usual.

### 7. Order seal and clear requests by a client sequence number

Aborting a fetch does not stop the server from answering it, so an older seal (for example during `Reveal all`) or the clear from `Ask again` could land after a newer seal and replace it. The client keeps one counter and sends `seq = Math.max(seq + 1, Date.now())` with every seal and clear. It is based on milliseconds, so the first request of a reloaded page still beats the old page's requests. The sealed value is an envelope `{ n: seq, at: serverNow, r: snapshot | null }`, where `r: null` is a tombstone for a cleared reading.

- Before it sets the cookie, the server opens the request's current cookie. If that cookie is valid and its `n` is greater than the incoming `seq`, the server leaves it unchanged and answers `200 { ok: true, stale: true }` without `Set-Cookie`. Otherwise it seals the new envelope. Equal values are written, so one request may be retried.
- Clear writes a tombstone instead of deleting the cookie, so a late older seal cannot bring a cleared reading back.
- `seq` must be a non-negative safe integer. `at` replaces the snapshot's former `sealedAt` for the 24-hour expiry.
- Known limit: the browser attaches the cookie when it sends a request. A request that is sent before a newer seal lands, and whose response arrives after it, carries the older cookie, so the server cannot see that it is stale. The client closes that gap by keeping at most one seal or clear in flight: while one runs, only the newest pending write is kept, and it is sent when the current one settles. Steps are no longer aborted, since an aborted request can still reach the server.
- Alternative considered: a server-side store keyed per browser. Rejected: the server stays stateless.

## Risks / Trade-offs

- [Card identities still exist in page memory, in the shipped deck, and in the hydration props of a restored page] → The spec limits the promise to the stored copy, and the UI makes no secrecy claim. The restored page is sent with `private, no-cache` and `Vary: Cookie`, so shared caches never keep it, but the browser's own cache and back/forward cache may hold its HTML, including the hydration props, until the browser session ends. Full secrecy is listed as a separate future change.
- [Tabs share one saved reading] → A reading started in a second tab replaces the first tab's saved copy; the first tab keeps working in memory. Accepted for a single-visitor ritual.
- [`READING_STATE_SECRET` missing or weak in production] → Startup fails with a clear message, the same way an invalid `PORT` does today; the CI container smoke check sets a test secret.
- [Secret rotation discards saved readings] → Acceptable: they start fresh and the cookie is cleared. Document it in the README's environment section.
- [Extra request after every step on slow networks] → Sealing runs after the UI has updated and never blocks interaction; only the latest step is kept.
- [The request sequence comes from the client clock] → A clock set far ahead only makes that browser's own requests win, and a clock moved back between page loads makes the new page's requests stale until it catches up; the sequence orders requests and grants nothing else.
- [Clock skew between server instances affecting expiry] → One instance stamps and checks the seal time, so there is none today; add an allowance if several instances with different clocks ever serve the app.
- [Another site could post to the seal or clear route] → `SameSite=Strict` keeps the cookie off cross-site requests, and seal accepts only JSON bodies. At worst a cross-site page could clear a saved reading, which then starts fresh.
- [Existing e2e tests assert no browser storage writes] → Replace those assertions with "only the sealed `HttpOnly` `sortes_reading` cookie exists, scripts cannot read it, and it contains no question or card ID".

## Migration Plan

1. Deploy with `READING_STATE_SECRET` set; nothing to migrate, as no readings are stored today.
2. Rollback: deploy the previous version. Saved cookies are then ignored and disappear when the browser session ends.
