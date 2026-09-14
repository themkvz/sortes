# Pseudo Tarot — MVP Tech Design & Requirements

## 1. Product

Pseudo Tarot is a small interactive web toy where a user asks an ordinary question, manually chooses hidden pseudo-tarot cards, reveals them, and receives a deterministic domain-specific interpretation.

The product is intentionally playful rather than mystical. Cards, meanings, prompts, spread labels, copy, and visual identity can be adapted to a specific domain such as software development, startups, work, relationships, or another theme.

The application opens directly into the experience. There is no separate marketing landing page in MVP.

---

## 2. MVP Goal

The MVP validates three things:

1. Remix 3 as the application framework for a highly interactive small web app.
2. pen.dev as the main design workflow for the board, cards, states, and responsive UI.
3. Whether the core interaction is entertaining enough on its own:

```text
question
→ choose hidden cards
→ place cards
→ reveal cards
→ verdict
→ share
```

The MVP should optimize for polish of this loop rather than number of features.

---

## 3. Core Product Principles

- One primary experience instead of separate marketing and app pages.
- No authentication.
- No database.
- No AI-generated interpretations.
- Cards and interpretations are deterministic application data.
- The user manually chooses hidden cards.
- Selection should feel meaningful even though the user cannot see card identity.
- A placed card is a final choice.
- The user reveals each card manually.
- The final result should feel like one coherent punchline, not three unrelated card descriptions.
- Mobile and desktop should both be first-class.
- Shared readings work without server-side persistence.
- Deck content should be replaceable without changing the reading engine.
- The MVP should not introduce abstractions that are only useful for hypothetical future features.

---

# 4. MVP User Flow

## 4.1 Initial State

The root route immediately shows:

- minimal product branding;
- optional question input;
- primary action;
- three empty spread slots;
- inactive hidden-card area.

Example:

```text
What do you want to ask?

[ Should I rewrite this project again? ]

[ Ask ]

[ Context ]   [ Problem ]   [ Advice ]
```

If the question input is empty:

```text
[ Surprise me ]
```

If it contains text:

```text
[ Ask ]
```

No onboarding is required.

---

## 4.2 Ask

When the user presses `Ask`:

1. the question becomes part of the current reading;
2. the question input becomes read-only for this reading;
3. a reading session is created;
4. 9 hidden cards are prepared;
5. the spread becomes active;
6. the user enters card-selection mode.

The application does not semantically analyze the question in MVP.

The question is used as framing and as part of deterministic result variation.

---

## 4.3 Surprise Me

If no question is entered, the primary action becomes `Surprise me`.

Pressing it:

1. selects one predefined domain-specific prompt;
2. displays it as the current question;
3. immediately starts card-selection mode.

There is no second `Ask` step.

Example prompts for a developer deck:

```text
Should I rewrite it?
Should I deploy today?
Do I really need another dependency?
Should this become a microservice?
Will this side project survive the weekend?
```

---

# 5. Deck and Pseudo-Choice

The first MVP deck contains exactly:

```text
16 cards
```

At the beginning of each reading:

1. the 16-card deck is shuffled;
2. 9 cards are selected from it;
3. those 9 card identities are assigned before user interaction;
4. the user sees only their face-down representations.

The 9 cards do not reshuffle between picks.

The user chooses exactly 3 of the 9 cards.

This creates pseudo-choice:

> The user does not know what the cards are, but still chooses real, already-determined cards.

Card identity must never be generated at click or drop time.

---

# 6. Card Selection

Desktop primary interaction:

```text
hidden card
→ drag
→ spread slot
```

The user chooses which spread position receives each card.

Once a card is successfully placed into a spread slot:

- its selection is final;
- it cannot be replaced with another card;
- it cannot return to the available-card area;
- it remains face-down until the user reveals it.

The UI may reinforce this with product copy such as:

```text
The choice is made.
```

or:

```text
The cards remember.
```

The card identity remains hidden after placement.

---

## 6.1 Non-Drag Fallback

Drag-and-drop is the primary interaction, but not the only supported interaction.

For touch, keyboard, or reduced-precision input:

```text
select card
→ select available spread slot
```

The same selection rules apply.

The reading must remain fully completable without precise drag interaction.

---

# 7. Spread

The reading engine must not hardcode tarot-specific positions.

A spread is configuration data.

Example:

```ts
type SpreadDefinition = {
  id: string;
  positions: [
    SpreadPosition,
    SpreadPosition,
    SpreadPosition,
  ];
};

type SpreadPosition = {
  id: string;
  label: string;
};
```

The first deck can use:

```text
Context
Problem
Advice
```

A future deck could use:

```text
Past
Present
Future
```

or:

```text
You
Them
Reality
```

Changing spread labels must not require changes to the reading engine or board logic.

The MVP uses exactly one three-card spread.

---

# 8. Ready State

Once all three spread positions contain cards:

- no more cards may be selected;
- the remaining six hidden cards become irrelevant;
- the reading enters the `ready` state;
- each placed card becomes independently revealable.

There is no `Reveal all` action in MVP.

---

# 9. Manual Reveal

The user reveals each card manually.

Interaction:

```text
tap / click card
→ flip animation
→ show card identity
→ show position-specific meaning
```

The user may reveal the three cards in any order.

Each card tracks its own reveal state.

Example:

```ts
type SelectedCard = {
  cardId: string;
  positionId: string;
  revealed: boolean;
};
```

The final verdict remains hidden until all three cards have been revealed.

---

# 10. Reading Result

A completed reading contains:

```ts
type Reading = {
  version: 1;
  deckId: string;
  question: string;
  spreadId: string;
  cards: SelectedCardResult[];
};

type SelectedCardResult = {
  cardId: string;
  positionId: string;
};
```

The completed result shows:

1. original question;
2. spread positions;
3. three revealed cards;
4. position-specific meaning for each card;
5. deterministic final verdict;
6. share action;
7. ask-again action.

Example:

```text
You asked:

"Should I rewrite this project again?"

CONTEXT
The Legacy System

You are still paying for decisions nobody remembers making.

PROBLEM
The Infinite Refactor

Changing one abstraction has somehow created four new abstractions.

ADVICE
The MVP

Eventually you will discover that half of this was unnecessary.

VERDICT

Someone else's decision started this mess.
You're currently making it architecturally beautiful.
Ship before you discover another framework.
```

---

# 11. Domain-Specific Decks

The engine must not know individual card themes.

A deck is application data.

```ts
type DeckDefinition = {
  id: string;
  name: string;

  prompts: string[];
  cards: CardDefinition[];
  spread: SpreadDefinition;
  summaryTemplates: SummaryTemplate[];
};
```

Card:

```ts
type CardDefinition = {
  id: string;
  name: string;
  shortDescription: string;
  symbol?: string;

  meanings: Record<string, CardMeaning>;
};
```

Meaning:

```ts
type CardMeaning = {
  text: string;
  summaryFragment: string;
};
```

Example:

```ts
{
  id: "merge-conflict",
  name: "The Merge Conflict",
  shortDescription: "Two realities collide.",
  meanings: {
    context: {
      text: "Two incompatible decisions created the situation you are in.",
      summaryFragment:
        "two incompatible decisions created the mess"
    },
    problem: {
      text: "You are currently resolving consequences created somewhere else.",
      summaryFragment:
        "someone else's decision is still running the project"
    },
    advice: {
      text: "Resolution is possible, but somebody will lose a line of code.",
      summaryFragment:
        "resolve the conflict before adding another abstraction"
    }
  }
}
```

---

## 11.1 First MVP Deck

The first MVP ships with exactly one deck.

Working theme:

```text
Developer Tarot
```

Target:

```text
16 cards
```

Possible cards:

```text
The Merge Conflict
The Infinite Refactor
The Deprecated API
The Friday Deploy
The Green CI
The Missing Environment Variable
The Legacy System
The TODO
The Rewrite
The MVP
The Rubber Duck
The Unexpected Dependency
The Production Database
The Cache
The Code Review
The Rollback
```

The exact content belongs to a separate deck-content specification.

---

# 12. Deck Extensibility

The architecture should make replacing the active deck easy.

Adding another deck should primarily mean creating another:

```ts
const anotherDeck: DeckDefinition = { ... };
```

The following should not need to change:

- reading engine;
- card-selection flow;
- spread rendering;
- reveal flow;
- summary generation;
- share codec.

However, MVP does not require:

- plugin architecture;
- dynamic deck loading;
- runtime registry;
- deck marketplace;
- deck editor;
- user-created decks;
- deck-selection UI.

The goal is replaceable configuration, not a framework.

---

# 13. Deterministic Interpretation Engine

No LLM is used in MVP.

A finalized reading must always produce the same result.

There are two interpretation layers.

## 13.1 Card Meaning

Card meaning depends on:

```text
card + spread position
```

Example:

```ts
getCardMeaning(cardId, positionId);
```

Each meaning contains:

- `text` — readable standalone explanation;
- `summaryFragment` — short composable text written specifically for final verdict generation.

---

## 13.2 Final Verdict

The final verdict is built from deterministic templates.

Example:

```text
{context}.
Right now, {problem}.
The cards recommend that you {advice}.
```

Templates must be written around known grammatical contracts for their placeholders.

The goal is not arbitrary text mixing.

The goal is a predictable, coherent, reusable punchline system.

---

# 14. Illusion of Personalization

The manual question is not semantically interpreted.

The app creates personalization through:

- displaying the question throughout the reading;
- user-selected hidden cards;
- position-specific meanings;
- deterministic variation in summary phrasing.

A deterministic seed may be generated from:

```text
normalized question
+ deck id
+ selected card ids
+ selected positions
```

Example:

```ts
const seed = hash(
  normalizedQuestion +
  deckId +
  selectedCards.map(card => card.cardId).join(":")
);
```

The seed can select among compatible summary templates or punchline variants.

The same completed reading must always produce the same result.

---

# 15. Randomness

Randomness is allowed before the reading becomes final.

It may be used for:

- shuffling the 16-card deck;
- selecting the visible 9-card subset;
- `Surprise me` prompt selection.

Once hidden card identities are assigned to the 9 visible choices, they are stable for the reading.

Once the user places a card, that selection is immutable.

No runtime randomness should influence an already completed reading.

Cryptographically secure randomness is not required.

---

# 16. Sharing

Sharing is part of MVP.

No database should be introduced only for sharing.

A completed reading is encoded into a compact versioned payload.

Conceptually:

```ts
type SharedReading = {
  v: 1;
  d: string;
  q: string;
  s: string;
  c: [string, string, string];
};
```

Example route:

```text
/r/:payload
```

The shared route reconstructs the completed reading from:

```text
version
deck
question
spread
cards
```

Interpretations are recalculated from application data.

---

## 16.1 Share Warning

Before a share link is copied or exposed, the application must show a privacy warning.

Example:

```text
Your question will be included in the shared link.
Anyone with the link can read it.

[ Cancel ] [ Share anyway ]
```

The warning appears at share time, not while the user is entering a question.

The MVP accepts that a shared question is public to anyone who has the URL.

No additional encryption or privacy layer is required.

---

## 16.2 Share Requirements

- the same URL recreates the same completed reading;
- no server-side persistence is required;
- malformed payload returns a controlled error state;
- unknown deck/card IDs return a controlled error state;
- question length is validated;
- user-provided text is escaped when rendered;
- duplicate or impossible card combinations are rejected.

Long-term backward compatibility of old deck content is outside MVP scope.

---

# 17. Ask Again

After a completed reading:

```text
[ Ask again ]
```

returns to the initial state.

Behavior:

- clear selected cards;
- clear reveal state;
- clear generated reading;
- reshuffle for the next session;
- preserve active deck;
- clear question.

No reading history is stored.

---

# 18. Incomplete Reading Lifetime

Incomplete readings are intentionally ephemeral.

If the user:

- reloads the page;
- closes the tab;
- navigates away;
- returns via browser navigation;

the unfinished reading may be lost and the app may return to the initial state.

No localStorage, sessionStorage, cookie, or server persistence is required.

The product may communicate this using thematic copy such as:

```text
The cards forget unfinished readings.
```

or:

```text
Leave the table and fate resets.
```

A completed shared reading is the only durable reading representation in MVP.

---

# 19. Client State Model

Use an explicit state model rather than multiple unrelated booleans.

Example:

```ts
type ReadingState =
  | {
      status: "idle";
    }
  | {
      status: "choosing";
      question: string;
      availableCards: HiddenCard[];
      selectedCards: SelectedCard[];
    }
  | {
      status: "ready";
      question: string;
      selectedCards: SelectedCard[];
    }
  | {
      status: "revealing";
      question: string;
      selectedCards: SelectedCard[];
    }
  | {
      status: "complete";
      reading: Reading;
    };
```

Avoid independent state such as:

```text
isStarted
isComplete
isRevealed
hasCards
showResult
```

when combinations can create impossible states.

---

# 20. Routes

Minimal route contract:

```text
GET /
GET /r/:payload
```

Root:

```text
/
```

renders the interactive reading board.

Shared reading:

```text
/r/:payload
```

validates and renders a completed reading.

There is no REST API in MVP.

There is no RPC layer.

There are no client-side API requests required for the core reading flow.

---

# 21. Server and Browser Responsibilities

## Server

- render initial application;
- render shared readings;
- validate shared payload;
- provide metadata;
- return correct error responses.

## Browser

- question interaction;
- reading-session setup;
- card selection;
- pointer/touch/keyboard interaction;
- spread state;
- animations;
- reveal flow;
- deterministic result calculation where appropriate;
- share URL generation.

Domain logic should remain pure TypeScript and reusable across server and browser where practical.

---

# 22. Project Structure

Suggested responsibility-based structure:

```text
app/
  actions/
    controller.tsx
    reading/
      controller.tsx

  domain/
    tarot/
      decks/
        developer.ts
      reading.ts
      share.ts
      types.ts

  ui/
    Card.tsx
    Deck.tsx
    Spread.tsx
    ReadingResult.tsx

  routes.ts
  router.ts

public/
```

Exact file structure may evolve during implementation.

The important boundary is:

```text
Content
    deck
    prompts
    meanings
    summary fragments
    templates

Engine
    shuffle
    visible-card selection
    interpretation
    deterministic seed
    serialization

Experience
    board
    drag/drop
    reveal
    animation
    sharing
```

Domain logic must not depend on UI components.

---

# 23. Visual Direction

The visual direction should feel like:

```text
mystical card table
×
internet humour
×
modern interactive web toy
```

Avoid:

```text
SaaS dashboard
traditional form application
generic horoscope site
generic AI wrapper
```

Primary visual objects:

- background / table;
- question;
- 9-card hidden choice area;
- card backs;
- three spread slots;
- card fronts;
- reveal state;
- final verdict.

The cards should dominate the UI.

---

# 24. Card Design Requirements

Every card front contains:

```text
name
symbol or small illustration
short phrase
visual frame
```

Card back must clearly hide identity.

Required visual states:

```text
hidden
hover
selected
dragging
placed
revealable
revealing
revealed
```

The same card component should support the available-card area, spread, and shared reading.

---

# 25. Responsive Requirements

Desktop should resemble a physical card table.

Mobile should prioritize usability over preserving desktop composition.

The nine hidden cards may use:

- compact grid;
- fan;
- staggered layout;

depending on final design.

No horizontal scrolling should be required for the normal reading flow.

All three spread cards must remain understandable on common phone widths.

Drag-and-drop must have a reliable touch fallback.

---

# 26. Accessibility

Minimum requirements:

- every card can be selected without drag;
- semantic buttons/inputs are used;
- keyboard users can choose cards and spread positions;
- visible focus states;
- sufficient text contrast;
- card meanings are actual text;
- animations respect `prefers-reduced-motion`;
- reveal information does not depend only on animation;
- touch and pointer interactions have alternatives.

The visual metaphor must not make the core flow inaccessible.

---

# 27. Styling

Prefer application-owned CSS.

Recommended primitives:

```text
CSS variables
CSS layers
component classes
CSS transforms
CSS transitions
CSS keyframes
```

Avoid adding a component framework only for MVP.

Design tokens should cover at least:

```text
background
surface
text
muted text
accent
card dimensions
spacing
border radius
shadows
motion duration
```

pen.dev should define the visual system and important component states before implementation.

---

# 28. Animation

MVP animations:

```text
hidden-card hover / reaction
card pick-up
drag movement
card placement
card flip
meaning appearance
final verdict appearance
```

Animations should reinforce interaction rather than exist only as decoration.

Prefer transforms and opacity.

Core application state must not rely on animation completion where avoidable.

---

# 29. Validation

Question:

```text
optional before reading starts
trimmed, then Unicode-normalized (NFC)
max exactly 160 Unicode code points (counted after trim + NFC; supplementary-plane
characters count as one code point each)
non-string input or ill-formed Unicode is rejected, not silently coerced/truncated
```

Share payload must validate:

```text
schema version
deck id
spread id
exactly three selected cards
card ids
position ids
duplicate cards
duplicate positions
question length
```

Never trust URL payload even when it was originally generated by the application.

---

# 30. Error States

Invalid shared URL:

```text
The cards cannot read this timeline.
```

Unknown reading data:

```text
This prophecy has been lost.
```

Unexpected application error:

```text
Something disturbed the cards.
```

Unfinished-reading reset may use:

```text
The cards forget unfinished readings.
```

Product copy can stay thematic while HTTP and application behavior remain technically correct.

---

# 31. Testing

Prioritize domain and interaction behavior over snapshot-heavy UI testing.

## Unit tests

```text
deck validation
16-card deck constraint
9-card visible selection
card identity stability
card lookup
position-specific meaning
deterministic seed
deterministic verdict
share encode/decode
invalid payload handling
duplicate-card validation
```

## Route tests

```text
GET /
valid shared reading
invalid shared payload
unknown deck
unknown card
```

## Interaction tests

```text
ask question
use Surprise me
create 9 hidden cards
select card
place card
prevent replacement
fill all three slots
reveal cards individually
show verdict only after all reveals
reset reading
open share warning
open shared reading
```

Avoid testing animation implementation details.

---

# 32. Performance

The app should require almost no runtime data fetching.

Deck content ships with the application.

Targets:

- useful server-rendered page immediately;
- minimal browser JavaScript;
- no large UI libraries;
- no external API dependency;
- responsive drag interaction;
- optimized and cached static card assets.

Do not add optimization infrastructure without evidence that it is necessary.

---

# 33. Security and Privacy

No authentication or personal storage exists in MVP.

Main privacy risk:

```text
shared URL contains the user's question
```

Requirements:

- show explicit warning before sharing;
- treat the shared question as public to anyone with the URL;
- escape user-provided text;
- validate all decoded payload data;
- impose payload and question size limits;
- do not add secrets or sensitive metadata to share payload.

No cookies or sessions are required for MVP.

---

# 34. Technical Stack

Recommended MVP stack:

```text
TypeScript
Remix 3
remix/ui
Node.js 24.16.0+ (Remix 3 requires >=24.3.0)
HTML / Web APIs
application-owned CSS
pen.dev
```

Avoid adding without a concrete requirement:

```text
React
React component libraries
state-management libraries
drag-and-drop libraries
database
ORM
authentication
LLM SDK
analytics SDK
```

For drag-and-drop, prefer browser Pointer Events / DOM interaction rather than React-specific libraries.

---

# 35. pen.dev Scope

Use pen.dev for the parts where visual iteration matters:

```text
overall board composition
desktop layout
mobile layout
9-card hidden choice area
card front
card back
spread slots
hover / selected / dragging / placed states
manual reveal state
completed reading
share warning
shared reading
error states
```

Do not build a large design system upfront.

The `.pen` document should focus on actual MVP states and required reusable primitives.

---

# 36. MVP States

The application effectively contains one main experience with these states:

```text
1. Initial
2. Question submitted / Surprise me
3. Choosing from 9 hidden cards
4. One or two cards placed
5. Three cards placed / ready
6. Partial manual reveal
7. Reading complete
8. Share warning
9. Shared reading
10. Invalid shared reading
```

These should be designed as states of one product rather than unrelated pages.

---

# 37. Explicit Non-Goals

Not part of MVP:

```text
accounts
authentication
reading history
database
favorites
payments
subscriptions
AI-generated readings
real tarot accuracy
multiple spreads in UI
reverse cards
daily card
social feed
comments
analytics dashboard
admin panel
deck editor
user-created decks
deck marketplace
dynamic deck loading
internationalization
native mobile app
unfinished-reading persistence
long-term shared-content compatibility
```

---

# 38. Production Definition of Done

The MVP is ready to deploy when all of the following are true.

## Core Flow

A first-time visitor can:

1. open `/`;
2. understand the basic interaction without onboarding;
3. enter a question or use `Surprise me`;
4. see 9 face-down card choices;
5. manually choose and place three cards;
6. understand that each placed card is final;
7. reveal each card manually;
8. see position-specific meanings;
9. receive the final deterministic verdict only after all cards are revealed;
10. start another reading.

## Sharing

A completed reading can:

1. open the share action;
2. show the privacy warning;
3. generate/copy a share URL after confirmation;
4. open in another browser;
5. reproduce the same question, cards, meanings, and verdict.

## Reliability

- malformed shared URLs fail gracefully;
- invalid card/deck data fails gracefully;
- unfinished readings reset safely;
- there are no uncaught runtime errors in the normal flow;
- the production server starts and serves the app and its static/client assets successfully (Remix 3 serves TypeScript/JSX source directly — minified and cached in production — so there is no separate `build` step; "production build succeeds" means this startup and asset-serving path, verified in the container image).

## Interaction

- desktop drag-and-drop works reliably;
- touch fallback works;
- keyboard fallback works;
- cards cannot be replaced after selection;
- card identity does not change after session setup;
- verdict does not appear before all three reveals.

## Responsive and Accessibility

- normal flow works on common mobile and desktop viewports;
- no required horizontal scrolling;
- visible keyboard focus;
- reduced-motion behavior works;
- all essential content is available as text.

## Testing

At minimum:

- reading-engine unit coverage;
- share codec unit coverage;
- route smoke coverage;
- one end-to-end happy-path reading test;
- one invalid-share test.

---

# 39. Product Quality Acceptance Criteria

Technical completion alone is not enough.

The MVP should also satisfy:

### Understandability

A first-time user should understand what to do without onboarding.

### Time to Result

A normal reading should be completable in roughly one minute or less.

### Ritual

The sequence:

```text
choose
→ place
→ reveal
```

should feel deliberate rather than like a standard form.

### Coherence

The final verdict should read like one intentional observation or joke.

It should not feel like three unrelated card descriptions concatenated together.

### Shareability

The completed reading should contain at least one result or visual state that is understandable and amusing enough to screenshot or share without additional explanation.

---

# 40. Recommended Implementation Order

```text
DeckDefinition + 16-card developer deck skeleton
→ spread configuration
→ reading-session creation
→ 16 → 9 hidden-card selection
→ immutable card-selection logic
→ deterministic interpretation engine
→ summary fragments + verdict templates
→ share codec
→ routes
→ static board
→ drag-and-drop selection
→ touch/keyboard fallback
→ manual reveal
→ completed verdict
→ share warning + sharing
→ responsive polish
→ error states
→ accessibility
→ production tests
```

Do not invest heavily in animation before the complete reading flow works.

---

# 41. Architecture Rule

Keep the project centered around three explicit layers:

```text
Content
    deck
    prompts
    spread labels
    card meanings
    summary fragments
    verdict templates

Engine
    shuffle
    9-card selection
    immutable card selection
    interpretation
    deterministic seed
    serialization

Experience
    board
    drag/drop
    manual reveal
    animation
    warning
    sharing
```

A new domain should primarily require new content configuration.

It should not require rewriting the engine or the interaction model.
