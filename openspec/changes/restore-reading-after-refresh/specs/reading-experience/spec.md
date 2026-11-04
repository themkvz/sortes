## MODIFIED Requirements

### Requirement: Keep interaction state temporary and restartable
The experience SHALL keep the question, choices, placements, reveal state, and result for the current reading in memory and, once the reading has started, as a sealed copy in a browser-session cookie as defined by `reading-restore`. Reloading or returning to the page in the same browser session SHALL restore that reading from the first paint; reloading before a reading starts, after `Ask again`, or after the saved copy expires or is rejected SHALL return to idle with empty input and no restored reading. After completion, `Ask again` SHALL return to idle, clear all reading state including the saved copy, keep the active deck, and focus the question input. The experience SHALL use the active developer deck only and SHALL NOT add a deck picker.

#### Scenario: Reload an incomplete or completed reading
- **WHEN** a visitor reloads during any started reading in the same browser session
- **THEN** the same reading is restored as defined by `reading-restore`

#### Scenario: Reload before a reading starts
- **WHEN** a visitor types a question without starting a reading and then reloads
- **THEN** the page returns to idle with empty input and no reading restored

#### Scenario: Ask again after completion
- **WHEN** a visitor activates `Ask again` after the verdict appears
- **THEN** all question and reading state is cleared, including the saved copy, the active deck is retained, and focus moves to the question input
