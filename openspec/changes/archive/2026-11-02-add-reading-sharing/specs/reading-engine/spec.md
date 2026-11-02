## MODIFIED Requirements

### Requirement: Canonical deterministic interpretation

A completed reading SHALL expose the normalized question and the interpretation of exactly three distinct known cards assigned to the configured positions in spread order. Its interpretation SHALL contain each card's identity, name, short description, standalone meaning for its assigned position, and one complete verdict composed from the corresponding summary fragments. Serialization version, deck ID, and spread ID SHALL be validated at the sharing boundary; they SHALL NOT require extra interactive-session state.

The same normalized question and ordered card/position assignments with unchanged deck content SHALL always yield the same interpretation. Template choice SHALL be a deterministic function of that question and those assignments. It SHALL not depend on time, environment, random draws, object property order, placement order, or reveal order. Different questions are allowed to choose the same template. Adding sharing SHALL preserve the current live interpretation algorithm and its existing known-result checks.

Untrusted serialized reading data SHALL be validated before interpretation. An unsupported version, mismatched deck/spread, invalid question, unknown card/position, missing assignment, or duplicate card/position SHALL produce a controlled invalid-reading failure at that boundary, rather than partial interpretation or an internal assertion error. Trusted live readings SHALL reuse the same interpretation logic without decoding a share payload.

#### Scenario: Repeat interpretation

- **WHEN** the same normalized question and card-to-position assignments are completed or reconstructed repeatedly, including after different placement and reveal orders
- **THEN** the result is identical and its cards follow spread order

#### Scenario: Card-position assignment matters

- **WHEN** a card is assigned to Advice instead of Context in an otherwise valid completed reading
- **THEN** that card uses its Advice meaning and fragment
- **AND** template selection uses the changed assignment without guaranteeing a different template

#### Scenario: Reject impossible reading data

- **WHEN** the untrusted-reading boundary receives an unsupported reading version, mismatched deck/spread, invalid question, unknown card/position, missing pair, or duplicate card/position
- **THEN** it returns a controlled invalid-reading failure before interpretation rather than partial interpretation
