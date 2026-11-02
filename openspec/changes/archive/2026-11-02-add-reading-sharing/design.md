## Context

See `proposal.md` for motivation and the delta specs for behavior. `app/routes.ts` and `app/actions/controller.tsx` define explicit Remix routes/actions. `ReadingBoard` owns the temporary reading; completed state already contains the normalized question and interpreted cards with position/card IDs. `reading.ts` has a private pure `interpret` function and a pinned deterministic result in its tests. Version, deck, and spread fields were removed from live state by the recent refactor.

The older `reading-engine` spec still describes those removed fields and boundary validation inside the engine. Its delta updates that contract; implementing sharing must not restore the removed generic session machinery or change the existing verdict seed.

Installed documentation is canonical: Remix guides `02-routing-and-controllers.md`, `04-rendering-ui.md`, `05-interactivity.md`, `08-data-and-validation.md`, and `13-testing.md`, plus `src/data-schema/README.md`. The existing package provides the schema, route, render, and test APIs needed here.

## Goals / Non-Goals

**Goals:** One bounded browser/server codec, one read-only GET route, consent before link creation, and reuse of the current interpretation and result UI. Keep the normal board state and animation ownership intact.

**Non-Goals:** No persistence, deck registry, general restore-session command, historical content snapshots, payload signing, compression, encryption, native share-sheet integration, short-link service, or general dialog/layout framework. Sharing does not approve the deferred board-polish work.

## Decisions

### V1 is a small transport contract

Use `app/domain/tarot/share.ts` for schema, encoding, and decoding. Infer its payload type from the schema using `remix/data-schema`; do not maintain a second handwritten wire type. Use documented `object(..., { unknownKeys: 'error' })` and `parseSafe`, fixed metadata values, three known card IDs, and a uniqueness refinement. Validate the question through the existing normalization rule, additionally requiring nonempty input already in canonical form.

The encoder serializes these fields in this order:

```json
{"v":1,"d":"developer","s":"three-card","q":"Should I ship?","c":["merge-conflict","infinite-refactor","legacy-system"]}
```

`c[0]`, `c[1]`, and `c[2]` mean `context`, `problem`, and `advice`. `three-card` is the fixed V1 wire identifier, not new mutable engine state. Names, artwork URLs, interpretation text, and verdicts remain application content. Serialize using UTF-8 JSON and unpadded base64url with browser/stdlib encoding primitives; use no Node-only Buffer API in browser-reachable code.

Reject empty tokens, tokens longer than the named 2048-character limit, invalid alphabet/padding, and impossible base64 lengths before decoding. Decode UTF-8 strictly, parse JSON as unknown, then apply the schema and cross-field checks. Return a controlled failure for expected bad input; do not catch unrelated rendering or programming failures as invalid links. With no compression and a pre-decode limit, there is no unbounded decompression or JSON input.

This follows the conceptual payload and route in `design/mvp-tech-design.md` section 16. A fragment-based URL would need client decoding and would change the documented server-rendered route; do not introduce it. The question is deliberately public after confirmation. The 2048-character budget accommodates the existing 160-code-point limit, including escaped characters and multibyte Unicode, without a compression dependency.

### Reuse the current interpreter

Expose the existing pure interpretation operation and the small completed-input type it needs from `reading.ts`. The codec maps validated V1 cards to fixed ordered pairs and calls that same operation. Live reveals keep their existing direct call and trusted-input assumptions. Do not run shared data through shuffle, start, placement, reveal, or a restored session.

Preserve the current seed: JSON serialization of `[normalizedQuestion, orderedPositionAndCardPairs]`, hashed by the existing UTF-8 FNV-1a operation to choose a current deck template. Deck/spread identifiers validate transport compatibility; adding them to the seed would change already working live verdicts and is excluded. Existing known-result tests remain the authority; add a shared/live equality check using that result rather than a second interpretation implementation.

V1 fixes the field meanings, position order, and codec. It reproduces identical results with unchanged authored content and algorithm. Future content edits must make an explicit compatibility decision before changing interpretation; this milestone does not add old deck copies or a version registry.

### Add one explicit read-only route

Add `sharedReading: get('/r/:payload')` to `app/routes.ts` and the corresponding existing-controller action. Use the route helper for browser link generation, combining its path with the current page origin. Do not hard-code a development host or send the question to the server to generate a URL.

The action decodes the matched parameter and uses `context.render` with the normal `Document`: valid data produces a shared-result page with status 200; invalid data produces an application-owned page with status 400 and a link home. Use the single invalid-link message "The cards cannot read this timeline." Do not print the payload or reflect it into the error page. A missing payload segment remains an ordinary unmatched route with status 404; no extra route is needed.

Set `Cache-Control: no-store`, `Referrer-Policy: no-referrer`, and `X-Robots-Tag: noindex, nofollow` for valid and controlled-invalid shared responses through the documented response/header API. Do not add URL/request-body logging. These headers reduce incidental disclosure; they do not hide a URL from its recipient, browser history, or deployment infrastructure.

### Reuse result rendering without a second board

Extract only the revealed-card and question/verdict rendering actually used by both live and shared results. Keep normal Remix components in the current app structure and reuse existing styles and `Document`; do not build a new UI system. The live parent remains a client entry with its existing ref-driven artwork flip. The shared page renders completed content on the server without mounting `ReadingBoard` or introducing a client entry, so it needs neither session state nor reveal motion. Loading the document's existing browser bootstrap is harmless; essential shared content must not depend on it.

The live result retains Ask again and gains Share. The shared result has a native link to `/`, with no card actions or re-sharing flow. Both use the same text and image identity mapping. Image failure must not obscure text or the return link.

### Consent and copying are local UI concerns

Mount a small sharing control only inside the live completed-result branch. Use a native dialog for the exact warning and Cancel / Share anyway controls, the existing button styles, Escape dismissal, and focus return. Opening it creates no payload, href, or clipboard write. Native modal behavior supplies the focus boundary; avoid a custom focus trap or new component package.

Share anyway encodes the current completed reading synchronously and attempts `navigator.clipboard.writeText` from that user gesture. Show the URL in a labeled read-only field after confirmation, with truthful success status or a manual-copy instruction when the API is absent or rejects. Keep copying errors local; do not substitute an external sharing service or silently report success. A subsequent explicit copy attempt may reuse the approved URL.

Share UI state belongs to that mounted completed-reading control. Restart removes it and its dialog. Ignore late clipboard promise results after removal so an old operation cannot restore UI or steal focus in a fresh reading. A new completed reading requires a new warning and confirmation. Do not add a share phase to the domain or drag logic.

### Focus tests on the new boundary

- Codec tests: one pinned V1 token, round-trip Unicode and escaped text at the question limit, exact position mapping, malformed/oversized encoding, invalid UTF-8/JSON, wrong types/fields, unsupported IDs/version, duplicates, and equality with the current live verdict. Use representative table cases, not tests for base64 or the schema framework itself.
- Router tests: valid SSR content and status, controlled invalid status/message, escaping, the three privacy headers, and the native home link. Preserve existing 404 and generic 500 coverage without duplicating it.
- Browser journeys: no Share before completion; warning before any URL/clipboard write; Cancel/Escape with focus recovery; confirmed copy success and rejected/absent clipboard with manual fallback; fresh-browser shared result including JavaScript disabled; restart discards prior share state. Scope the existing no-transmission sentinel checks to unconfirmed ordinary sessions, adding explicit consent-aware assertions rather than disabling privacy checks.
- Real-browser inspection: 320 px, 390 px, desktop, keyboard/touch, dialog dismissal, long selectable URL, image failure, and reduced motion. Run `bun run verify` and the scoped after-implementation antislop check.

## Risks / Trade-offs

- Public question-bearing URLs can be forwarded, edited, or retained in browser/proxy history. Mitigation: explicit warning and confirmation; no promise of secrecy or authenticity, no automatic opening or external submission, and the specified response headers.
- Deck text or template changes can change an old link's result. Mitigation: fixed V1 contract and current-result test; require a later explicit content-compatibility decision, without building historical storage now.
- Clipboard access differs across browsers and contexts. Mitigation: make the approved URL selectable and report manual-copy fallback truthfully.
- Extracting card markup could remount live artwork and replay motion. Mitigation: preserve keyed position identity and existing reveal-motion regressions; do not hydrate the shared result.
- Removing an active dialog or resolving a clipboard promise after restart can disturb focus. Mitigation: tie local UI work to its mounted lifetime and cover restart while a copy is pending.

## Migration Plan

No data migration or dependency installation. Add the route, codec, and completion-only control together, verify, then update the README and future-scope notes. Rollback removes the sharing control and route while ordinary readings keep working; already distributed links would then return 404. Do not claim durable historical link support in release documentation.
