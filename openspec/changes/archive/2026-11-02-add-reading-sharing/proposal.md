## Why

A completed reading can be viewed only in its current browser session. The next planned milestone lets a visitor deliberately share that result as a self-contained link, with a clear warning that the question becomes readable by anyone holding the link.

## What Changes

- Offer `Share` only after completion. Show the privacy warning and require `Share anyway` before generating, displaying, or copying a link; cancelling leaves the reading unchanged.
- Add `GET /r/:payload` as a read-only, server-rendered completed reading, with a link to start a new reading at `/`.
- Define V1 as unpadded base64url of UTF-8 JSON with exactly `{ v: 1, d: 'developer', s: 'three-card', q, c }`. `c` contains three distinct known card IDs in Context, Problem, Advice order; `q` is the normalized question. Limit the encoded payload to 2048 characters.
- Recalculate meanings and the verdict from existing deck content and the current deterministic algorithm. Do not put authored result text or HTML in the payload.
- Reject malformed or unsupported links with a controlled HTML 400 page. Keep clipboard failure recoverable through a selectable link, and render the shared result without requiring JavaScript.
- Keep ordinary readings ephemeral. Sharing is an explicit exception after confirmation; shared requests use no-store, no-referrer, and no-index headers. No database, accounts, compression, encryption, remote sharing service, or new dependency.
- Reconcile the canonical interpretation spec with the current refactored engine: version/deck/spread validation belongs to the share boundary, and the live verdict algorithm stays unchanged.

## Capabilities

### New Capabilities

- `reading-sharing`: Confirmed link creation, the bounded V1 wire contract, read-only shared results, controlled failures, and compatibility limits.

### Modified Capabilities

- `application-shell`: Permit transmitting a completed reading only through explicitly confirmed sharing while preserving private, in-memory ordinary sessions.
- `reading-engine`: Describe the current completed output and deterministic interpretation, with untrusted serialized data validated before it reaches the interpreter.

## Impact

- Add a small sharing codec beside the reading domain; expose only the existing pure interpretation operation needed by the validated shared route.
- Extend the typed Remix route map and existing controller; add shared-result and invalid-link rendering using the current document and reusable card/result UI.
- Add completion-only sharing UI within the existing client boundary. Preserve board-state and drag modules, reveal timing, restart, and current visuals.
- Use installed `remix/data-schema`, `remix/routes`, rendering APIs, and the existing Remix test runner with Playwright. Add focused codec, route, and consent/clipboard browser checks.
- V1 reproduces results while deck content and the current algorithm remain unchanged. Future content changes need an explicit compatibility decision; historical deck snapshots and long-term link preservation remain outside this milestone.
