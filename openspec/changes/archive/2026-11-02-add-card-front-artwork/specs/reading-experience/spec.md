## ADDED Requirements

### Requirement: Provide a coherent illustrated front for every developer card

Each of the 16 cards in the active developer deck SHALL have its own distinct symbolic front illustration, associated with that card's stable identity. The set SHALL use a consistent engraved print style, portrait composition, and the existing card-back palette: evergreen, seafoam, parchment, and restrained amber. Each illustration SHALL relate to its card's existing theme and remain recognizable at its rendered mobile size. The artwork SHALL NOT contain baked-in names, descriptions, meanings, logos, or watermarks. The set SHALL use playful developer imagery rather than realistic occult scenes. Front artwork SHALL ship with the application and require no runtime generation or external image host.

#### Scenario: Cover the whole developer deck

- **WHEN** any of the 16 developer cards is individually revealed
- **THEN** its own illustration is available and corresponds to its stable card identity
- **AND** no card depends on another card's illustration as a placeholder

#### Scenario: Present a consistent visual set

- **WHEN** the illustrations are compared at desktop and narrow-screen display sizes
- **THEN** their palette, frame treatment, line weight, and composition form one engraved set that matches the shared card back
- **AND** their main motifs remain distinguishable without embedded text

### Requirement: Show front artwork only for an individually revealed card

A card's front illustration SHALL enter the rendered interface only after that card's own manual reveal. Face-down choices, placed cards, and the drag preview SHALL retain the existing shared back and generic labels; they SHALL NOT contain that card's front image or a card-specific front-image URL in rendered markup or accessibility labels. Revealing one card SHALL expose only that card's front illustration, while other placed cards remain face-down. Loading an image SHALL NOT reveal another card, delay the existing reveal action, or delay the final verdict. The completed result SHALL retain the correct illustrations in configured spread order regardless of placement or reveal order.

Artwork and card identities remain public application content; this requirement concerns what the interface discloses, not secrecy from source or developer-tool inspection.

#### Scenario: Keep hidden cards visually anonymous

- **WHEN** cards are being chosen, dragged, placed, or waiting for their individual reveal
- **THEN** their controls show only the shared card back and generic labels
- **AND** their corresponding front images and card-specific front-image URLs are absent from rendered markup and accessibility labels

#### Scenario: Reveal one illustration at a time

- **WHEN** a visitor reveals one placed card after all three positions are filled
- **THEN** that card's own front illustration appears with its existing text
- **AND** the remaining unrevealed cards keep their backs and the verdict stays gated until the third reveal

#### Scenario: Complete without waiting for images

- **WHEN** the third card is revealed while an illustration is still loading
- **THEN** the completed question, card text, and deterministic verdict appear immediately in configured spread order
- **AND** each illustration remains associated with its card when it finishes loading

### Requirement: Keep illustrated readings accessible and usable without images

Card names, short descriptions, and position-specific meanings SHALL remain selectable, accessible text outside the artwork. Illustrations SHALL be decorative to assistive technology so they do not duplicate adjacent card names. The artwork area SHALL reserve its portrait proportions during loading and failure, fit its spread column without horizontal scrolling at widths of 320 CSS pixels and wider, and SHALL NOT shrink, cover, or replace the existing text and controls. Missing, blocked, or failed artwork SHALL leave the card's text readable and the reading, verdict, and restart operable, without substituting another card's illustration.

#### Scenario: Read an illustrated card with assistive technology

- **WHEN** a revealed card is read through its accessible content
- **THEN** its existing name, description, and position meaning are available as text
- **AND** its decorative illustration adds no duplicate spoken label

#### Scenario: Finish a reading when front images fail

- **WHEN** front-artwork requests fail or are blocked during a reading
- **THEN** the artwork area keeps its proportions and every revealed card retains its correct text
- **AND** the visitor can reveal the remaining cards, read the verdict, and use Ask again

#### Scenario: Read illustrated cards on a narrow screen

- **WHEN** a visitor completes a reading at a 320 CSS pixel viewport
- **THEN** each illustration fits its column without cropping its main motif, shrinking the text, covering controls, or adding horizontal scrolling
