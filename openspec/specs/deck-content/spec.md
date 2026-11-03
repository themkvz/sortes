# deck-content Specification

## Purpose

Define the authored developer-themed deck and the content contracts needed to produce coherent readings without runtime text generation or theme-specific engine logic.

## Requirements

### Requirement: Complete first deck

The application SHALL provide one deck with ID `developer`, name `Developer Tarot`, and spread ID `context-problem-advice`. Its ordered positions SHALL be `context` / `Context`, `problem` / `Problem`, and `advice` / `Advice`. It SHALL contain exactly the 16 cards in the following catalog, with unique stable IDs, names, short descriptions, and meanings for every position. Artwork is outside this capability.

| ID | Name | Short description |
| --- | --- | --- |
| merge-conflict | The Merge Conflict | Two realities, one branch. |
| infinite-refactor | The Infinite Refactor | Almost clean enough to start. |
| deprecated-api | The Deprecated API | The future has stopped supporting you. |
| friday-deploy | The Friday Deploy | A weekend with release notes. |
| green-ci | The Green CI | All checks passed. Reality is next. |
| missing-environment-variable | The Missing Environment Variable | Works on one machine. |
| legacy-system | The Legacy System | Yesterday still pays the bills. |
| todo | The TODO | A promise with no calendar. |
| rewrite | The Rewrite | A fresh start with familiar problems. |
| mvp | The MVP | Small enough to actually exist. |
| rubber-duck | The Rubber Duck | Your quietest senior engineer. |
| unexpected-dependency | The Unexpected Dependency | One install, several new obligations. |
| production-database | The Production Database | The one place theory has consequences. |
| cache | The Cache | Yesterday's truth, delivered faster. |
| code-review | The Code Review | Your idea has entered the group chat. |
| rollback | The Rollback | Progress occasionally points backward. |

#### Scenario: Load the developer deck

- **WHEN** a consumer loads the developer deck
- **THEN** it receives these 16 unique cards and exactly these three ordered positions
- **AND** every card has nonempty content for each position

### Requirement: Authored meanings and composable fragments

Each cell below SHALL define that card's summary fragment for the named position. Its standalone meaning text SHALL be the same English phrase with the initial letter capitalized and one final period. Context and Problem fragments are complete clauses beginning with a lowercase letter; Advice fragments are lowercase imperatives. Fragments SHALL contain neither terminal punctuation nor template placeholders. This bounded editorial contract allows the same phrase to work alone and within a verdict.

| Card ID | Context fragment | Problem fragment | Advice fragment |
| --- | --- | --- | --- |
| merge-conflict | two reasonable decisions landed on the same lines | each person is defending their own version of the plan | settle one disagreement before adding another idea |
| infinite-refactor | a small cleanup has turned into the main project | the code keeps getting cleaner while the release keeps slipping | ship one useful change before you rename another folder |
| deprecated-api | yesterday's shortcut now comes with a migration guide | something you rely on has already moved on | replace the unsupported part, not the whole system |
| friday-deploy | the deadline is louder than the test results | the plan only works if nobody needs their weekend | ship it when someone is around to watch it land |
| green-ci | every check passed, and the checks only test what you told them to | a green pipeline is doing all the reassuring | click through the real user path before you call it done |
| missing-environment-variable | one unwritten setting is holding the whole project together | the setup notes skip the one step that makes it work | write down the missing setting before you try again |
| legacy-system | old decisions are still doing useful work | nobody remembers which odd detail is load-bearing | learn one boundary well before you replace what sits behind it |
| todo | a past version of you left a very optimistic note | the deferred work moves to the next sprint, every sprint | finish one small promise or delete it honestly |
| rewrite | the current mess makes a blank file look tempting | starting over feels like knowing more, and it is not | prove the new approach on one small slice first |
| mvp | a small thing that works has met real users | the wishlist is growing faster than the part people use | cut one requirement and finish the remaining loop |
| rubber-duck | the answer is already in your explanation | the problem stays vague because nobody has said it out loud | explain the failing step as if the duck will maintain it |
| unexpected-dependency | a handy package came with decisions of its own | the borrowed fix now needs more care than the original problem | check whether the platform already does enough |
| production-database | real users have made the data messier than the examples | the experiment is one query away from data you cannot get back | rehearse on a copy before you touch the real thing |
| cache | an old answer is still being served with confidence | stale data arrives faster than anyone can question it | check the source before you speed up the answer |
| code-review | a second pair of eyes has found the edges of the idea | the thread is debating style instead of the real risks | agree on what the code should do before arguing about how it looks |
| rollback | the last working version is still within reach | pride is making a rollback feel like defeat | restore the last good state, then investigate without pressure |

#### Scenario: Position-specific meaning

- **WHEN** `mvp` is interpreted in the `advice` position
- **THEN** its meaning is `Cut one requirement and finish the remaining loop.`
- **AND** its summary fragment is `cut one requirement and finish the remaining loop`

### Requirement: Surprise prompts and verdict templates

The deck SHALL provide these five prompts in this order:

1. `Should I rewrite it?`
2. `Should I deploy today?`
3. `Do I really need another dependency?`
4. `Should this become a microservice?`
5. `Will this side project survive the weekend?`

It SHALL provide these two verdict templates in this order, each containing all three position placeholders exactly once:

1. `The setup: {context}. The snag: {problem}. Your next move: {advice}.`
2. `The cards show that {context}. Right now, {problem}. Their advice: {advice}.`

#### Scenario: Coherent composition

- **WHEN** the first template is composed with `legacy-system` as Context, `infinite-refactor` as Problem, and `mvp` as Advice
- **THEN** the verdict is `The setup: old decisions are still doing useful work. The snag: the code keeps getting cleaner while the release keeps slipping. Your next move: cut one requirement and finish the remaining loop.`
- **AND** no placeholder or doubled terminal punctuation remains

### Requirement: Content validity and replacement

A supported deck SHALL have exactly 16 unique nonempty card IDs and three unique nonempty ordered position IDs, nonempty deck/spread IDs and labels, complete meanings, at least one valid prompt, and at least one compatible template. Prompts SHALL be nonempty and fit the reading engine's normalized question limit. Each template SHALL reference every configured position exactly once and no unknown placeholder. An invalid deck SHALL be rejected with an actionable authoring error before a session uses it; missing meanings SHALL not be silently replaced with generic text.

The engine SHALL accept a replacement deck of this shape without depending on developer card names, position IDs, or English position labels. The exact developer catalog and copy above apply to the first deck; replacement decks supply their own text and grammatical contracts.

#### Scenario: Incomplete authored content

- **WHEN** a deck has duplicate card IDs, a missing position meaning, an invalid prompt, or an unknown template placeholder
- **THEN** content validation fails with the affected field or ID identified

#### Scenario: Replace content without changing rules

- **WHEN** a valid replacement deck uses different card IDs, position IDs, labels, and templates
- **THEN** session creation, placement, reveal, and interpretation use that supplied content without engine changes
