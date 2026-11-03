## MODIFIED Requirements

### Requirement: Existing design is the visual source

The board SHALL follow the card-table hierarchy, palette, typography, spacing, and card proportions in `design/design.pen`, using `design/ui-ux-design.md` to interpret interaction intent. The desktop initial-reading frame, mobile board, and card-state samples SHALL be the visual reference. Branding and controls SHALL stay secondary to the spread and deck; the application SHALL NOT introduce a dashboard, marketing sections, new artwork, or unrelated decorative effects. Existing functional contracts, including the single Ask / Surprise me action and manual reveal gates, SHALL take precedence over static mock copy or placeholder controls. Necessary responsive and accessibility adaptations SHALL be documented, including three compact phone cards with full-width interpretation blocks below them. Missing visual details SHALL be identified rather than represented as verified fidelity.

#### Scenario: Desktop and mobile design review

- **WHEN** the board is compared with the existing design at desktop and phone widths
- **THEN** its typography, colors, card proportions, spacing, composition, and state cues are traceable to the inspected design
- **AND** responsive, accessibility, and static-mock adaptations are recorded for review

### Requirement: Accessible responsive foundation

The board SHALL use semantic input and button elements, a programmatic input label, visible keyboard focus, readable text contrast, and decorative artwork hidden from assistive technology. Normal text SHALL meet at least 4.5:1 contrast, and enabled control boundaries and focus/state indicators SHALL meet at least 3:1 against adjacent backgrounds. The question input SHALL have a distinguishable boundary before focus; selection and availability SHALL NOT depend on color alone. Primary controls, hidden choices, and eligible spread targets SHALL have pointer areas at least 48 by 48 CSS pixels. At viewport widths from 320 CSS pixels through desktop sizes, the normal flow SHALL require no horizontal scrolling or clipped controls. Longer text and text enlargement SHALL reflow rather than be truncated. Any motion SHALL respect reduced-motion preferences and preserve existing behavior.

#### Scenario: Keyboard and narrow viewport

- **WHEN** a visitor uses a keyboard on a 320 CSS pixel viewport
- **THEN** the question input is reachable with visible focus, labels remain readable, and all three spread positions remain understandable without horizontal scrolling
- **AND** focus outlines remain visible and enabled controls retain their minimum target sizes

#### Scenario: Reduced motion

- **WHEN** reduced motion is requested
- **THEN** nonessential motion is removed and the same information remains available as text

#### Scenario: Identify an unfocused question field

- **WHEN** a visitor views the enabled question input before interacting with it
- **THEN** its boundary has at least 3:1 contrast against the adjacent backgrounds
- **AND** its text, placeholder, validation feedback, and keyboard focus remain readable
