# reading-sharing Specification

## Purpose

Let a visitor deliberately share a completed reading through a bounded, self-contained URL that another visitor can open without an account or stored server record.

## Requirements

### Requirement: Confirm sharing of a completed reading

The live reading SHALL offer `Share` only after all three cards are revealed. Activating it SHALL show: "Your question will be included in the shared link. Anyone with the link can read it." The visitor SHALL explicitly choose `Share anyway` before a payload or share URL is generated, displayed, put in link markup, copied, or requested. `Cancel` or Escape SHALL close the warning without creating a link, changing the reading, or writing to the clipboard. The warning and its controls SHALL be keyboard accessible, with focus restored to Share on dismissal. Restart SHALL discard the warning and any generated link; sharing a subsequent reading SHALL require fresh confirmation.

#### Scenario: Keep sharing unavailable before completion

- **WHEN** a visitor is idle, choosing, placing, or revealing fewer than three cards
- **THEN** no share action or generated share URL is present

#### Scenario: Warn and cancel without disclosure

- **WHEN** a visitor activates Share on a completed reading and then cancels or presses Escape
- **THEN** the privacy warning was shown before any payload generation, URL exposure, or clipboard write
- **AND** the completed reading stays unchanged and focus returns to Share

#### Scenario: Confirm and recover from clipboard failure

- **WHEN** a visitor chooses Share anyway
- **THEN** the app generates the URL for that completed reading and attempts to copy it
- **AND** it reports success only when copying succeeds, otherwise leaves a labeled, selectable URL and a clear manual-copy instruction
- **AND** restarting removes that URL and requires confirmation for any new reading

### Requirement: Define and validate the V1 shared URL contract

The shared route SHALL be `GET /r/:payload`. The payload SHALL be unpadded base64url of UTF-8 JSON containing exactly the fields `v`, `d`, `s`, `q`, and `c`: `v` SHALL be numeric `1`, `d` SHALL be `developer`, `s` SHALL be `three-card`, `q` SHALL be a nonempty, well-formed, trimmed NFC-normalized string of at most 160 Unicode code points, and `c` SHALL be exactly three distinct known developer card IDs in Context, Problem, Advice order. These positions SHALL be fixed for V1. Names, meanings, verdict text, HTML, timestamps, and other fields SHALL NOT be included or trusted. Encoded payloads SHALL be nonempty and at most 2048 ASCII characters; invalid encoding, invalid UTF-8, invalid JSON, incorrect types, missing or extra fields, invalid questions, and unsupported version/deck/spread/card data SHALL be rejected before interpretation. The same normalized completed reading SHALL produce the same payload.

#### Scenario: Round-trip a completed reading

- **WHEN** a completed reading is encoded and opened through its shared URL
- **THEN** its question and all three card-to-position assignments are preserved
- **AND** a valid 160-code-point Unicode question fits within the payload limit

#### Scenario: Reject malformed or oversized data

- **WHEN** a payload is empty, exceeds 2048 characters, has invalid base64url, UTF-8, or JSON, or does not match the V1 field contract
- **THEN** it is rejected without partial interpretation or silent coercion

#### Scenario: Reject impossible or unsupported readings

- **WHEN** a payload contains an unknown version, deck, spread, or card, duplicate cards, the wrong number of cards, or an invalid question
- **THEN** it is rejected without choosing substitute cards or a surprise question

### Requirement: Reproduce a read-only completed reading

A valid shared URL SHALL return HTML with status 200 containing the normalized question, all three revealed cards with their illustrations, names, descriptions, position-specific meanings, and the same deterministic verdict as the original live reading while deck content and the interpretation algorithm are unchanged. The result SHALL follow V1 position order and reuse the completed board's visual language, including its responsive card and interpretation presentation. On phones, three compact card faces SHALL remain side by side with full-width, position-labeled interpretation blocks below; body text SHALL be at least 16 CSS pixels with line height at least 1.45. Each card's text SHALL have one accessible representation. Essential result content SHALL be available with JavaScript disabled. The shared page SHALL provide a native link to start a fresh reading at `/`; it SHALL NOT offer picking, placement, reveal, editing, restart-in-place, or another share action. Opening or reloading a shared link SHALL NOT create or resume an interactive session. All user text SHALL be rendered as escaped text. Decorative artwork failure SHALL leave the result readable, and the page SHALL remain keyboard usable without horizontal overflow at widths of 320 CSS pixels and wider.

#### Scenario: Open the same result in another browser

- **WHEN** another visitor opens or reloads a valid shared URL, including with JavaScript disabled
- **THEN** the question, ordered cards, meanings, and verdict match the completed original
- **AND** there are no interactive card or sharing controls and no reveal animation is required

#### Scenario: Start a separate reading

- **WHEN** the recipient follows the shared page's link to `/`
- **THEN** the ordinary board starts idle with empty input and no imported shared state

#### Scenario: Display user text safely without artwork

- **WHEN** the question contains HTML-like text or shared artwork cannot load
- **THEN** the question is readable as literal text without executing markup
- **AND** card text, verdict, and the link home remain usable on narrow screens

#### Scenario: Read a shared result on a phone

- **WHEN** a recipient opens a shared result at 320 or 390 CSS pixels, including without JavaScript
- **THEN** its three compact card faces use the same position order and labeled full-width interpretation blocks as a live completed reading
- **AND** long names and meanings remain complete and readable without duplicate text or horizontal scrolling

### Requirement: Return controlled shared-link errors

A nonempty payload that fails validation SHALL return a readable application-owned HTML error page with status 400, a concise explanation, and a link to `/`. It SHALL NOT echo the raw payload, expose partial results or stack traces, or crash the normal reading route. Unknown paths outside the registered shared route SHALL retain the normal 404 behavior; unexpected server failures SHALL retain the generic 500 behavior.

#### Scenario: Recover from an invalid shared URL

- **WHEN** a visitor opens a malformed or unsupported payload under `/r/:payload`
- **THEN** the response has status 400 and shows the invalid-reading message and a working link home
- **AND** it contains no raw token, partial reading, or internal error details

### Requirement: Limit sharing disclosure and compatibility promises

The app SHALL create links locally without saving readings to a database, browser storage, or an external service. It SHALL NOT log question text, payloads, or full shared URLs. Valid and controlled-invalid shared-route responses SHALL send `Cache-Control: no-store`, `Referrer-Policy: no-referrer`, and `X-Robots-Tag: noindex, nofollow`. Links SHALL be treated as public, editable data rather than authenticated proof of origin; encoding SHALL NOT be described as encryption or anonymity. V1 SHALL use the existing interpretation algorithm and current deck content. A later unsupported format SHALL fail explicitly; preserving historical deck content or supporting future formats is outside this milestone.

#### Scenario: Avoid incidental shared-URL disclosure

- **WHEN** the app serves a valid or invalid shared payload
- **THEN** its response sets the specified cache, referrer, and indexing headers
- **AND** the app adds no logging or persistence of the shared reading

#### Scenario: Preserve the current result contract

- **WHEN** the same V1 URL is opened against unchanged deck content and interpretation rules
- **THEN** its result is deterministic and matches the current live reading algorithm
- **AND** unsupported future versions are rejected rather than guessed or silently upgraded
