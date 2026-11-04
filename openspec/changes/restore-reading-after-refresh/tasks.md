## 1. Configuration

- [x] 1.1 Add `READING_STATE_SECRET` to `app/env.ts`: required in production with at least 32 characters, a random per-process secret in development and test, and a clear startup error otherwise. Extend `app/env.test.ts` and document it in `.env.example` and the README environment section (including that rotating it discards saved readings).
- [x] 1.2 Set a test secret for the CI container smoke check and `bun run start` documentation.

## 2. Domain snapshot

- [x] 2.1 Add a versioned reading snapshot to `app/domain/tarot/`: `toSnapshot(state)` for started readings and `fromSnapshot(deck, input)` that validates the shape with `remix/data-schema` and rebuilds the state through the existing transitions, without randomness.
- [x] 2.2 Let `start` accept a known choice list for restore while keeping the shuffled path unchanged.
- [x] 2.3 Test round trips for choosing, ready, revealing and complete states (same interpretation and verdict), and rejection of impossible snapshots: repeated or unknown cards, wrong choice count, picks without placements, reveals before three placements, unknown positions, non-canonical questions, unsupported versions.

## 3. Sealing, cookie and routes

- [x] 3.1 Add a sealing module using Web Crypto AES-256-GCM: key derived once from the secret, fresh IV per seal, version as additional data, base64url token. Test that tokens hide the question and card IDs, and that tampering, a different key, and an unsupported version all fail.
- [x] 3.2 Add the `sortes_reading` session cookie with `remix/cookie`: `HttpOnly`, `SameSite=Strict`, `Path=/`, no `Expires` or `Max-Age`, `Secure` in production only, and a clearing form with `Max-Age=0`.
- [x] 3.3 Make `readingSeal` set the cookie and answer `{ ok: true }`, with a 4 KB JSON-only body limit, schema validation and `Cache-Control: no-store`; any invalid input answers one generic 400 and clears the cookie.
- [x] 3.4 Replace the `readingOpen` route with `readingClear`, which always clears the cookie with a `no-store` response.
- [x] 3.5 In the home action, open the cookie with the same validation and 24-hour expiry, pass the restored snapshot to the board, clear a rejected cookie, and send `Cache-Control: no-store` on `/` (now `private, no-cache`, see 7.4). Keep the shared-reading route free of the cookie.
- [x] 3.6 Router tests: seal sets the cookie with the right attributes, invalid seals clear it, `GET /` with a valid cookie renders the restored question and cards (now with `private, no-cache`, see 7.4), tampered and expired cookies render idle and clear, the clear route clears, and request logs carry no cookie, token or question.

## 4. Board save and restore

- [x] 4.1 Seal after start, each placement and each reveal (including `Reveal all`), and keep only the latest in-flight request.
- [x] 4.2 Remove browser storage: no `sessionStorage` token, no open request; after a failed or timed-out seal, post a best-effort clear.
- [x] 4.3 Build the first board state from the restored snapshot prop on the server and in the browser; remove the restoring state and its "Restoring your reading…" message.
- [x] 4.4 Clear the cookie on `Ask again`; make sure the shared-reading page never reads or writes it.
- [x] 4.5 Render restored reveals and a restored verdict settled: no flip, sheen, sparkle burst or verdict entrance for cards revealed before the reload, while later reveals animate as usual.
- [x] 4.6 Keep the settled rendering in the server-rendered HTML, and after hydration of a restored board move focus to the next useful control and announce "Reading restored." in the live status.

## 5. Specs-backed browser coverage

- [x] 5.1 Replace the storage assertions with a check that, after a reading starts, the only stored value is the `HttpOnly` `sortes_reading` session cookie, that page scripts cannot read it, that local and session storage are empty, and that it contains no question text or card ID.
- [x] 5.2 Add end-to-end journeys: reload while choosing, during reveals and after completion restore from the first paint (the idle "Ask your question first" text never appears; same cards and verdict, no replayed effects, correct focus); back/forward restore; a tampered cookie starts at idle and is cleared; `Ask again` clears the cookie; another tab shares the reading; reload before starting stays idle.
- [x] 5.3 Keep the no-JavaScript entry, sharing, reduced-motion and drag journeys passing unchanged.

## 6. Verify

- [x] 6.1 Run `bun run verify` and `bun run doctor`.
- [x] 6.2 Check the restore flow in a real browser at 1440 and 390 px, including a slow network for the open request (first, `sessionStorage` version).
- [x] 6.3 Check the server-rendered restore in a real browser at 1440 and 390 px: no idle flash on reload, settled cards and verdict, focus after hydration.

## 7. Request ordering and caching

- [x] 7.1 Send a client sequence number (`Math.max(seq + 1, Date.now())`) with every seal and clear, and seal the envelope `{ n, at, r }` with the server time and the snapshot or `null`; move the seal time out of the domain snapshot.
- [x] 7.2 Skip the cookie update when the request's cookie holds a higher `n` (`{ ok: true, stale: true }`, no `Set-Cookie`); clear and invalid seals with a valid `seq` write a tombstone; `/` renders a tombstone idle without changing the cookie.
- [x] 7.3 Make clear JSON-only through the same 4 KB body reader, with a generic 400 that leaves the cookie alone.
- [x] 7.4 Send `Cache-Control: private, no-cache` and `Vary: Cookie` on `/` (Chromium reuses a `no-cache` page on back/forward without revalidating it); keep `no-store` on seal and clear.
- [x] 7.5 When the browser rejects a restored snapshot the server accepted, start idle and post a clear.
- [x] 7.6 Keep at most one seal or clear in flight on the client, so a request sent before a newer seal landed cannot return after it with the older cookie (the server check cannot see that case); then add the e2e that delays the second-to-last `Reveal all` seal response and checks that a reload restores the completed reading.
- [x] 7.7 Router tests: stale seal and clear ignored, a late older seal after clear does not resurrect the reading, clear rejects non-JSON, a tombstone renders idle without `Set-Cookie`, `/` sends `private, no-cache` with `Vary: Cookie`.
- [x] 7.8 Run `bun run verify` and `openspec validate restore-reading-after-refresh --strict`.
