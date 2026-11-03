## MODIFIED Requirements

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
