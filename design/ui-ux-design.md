# Pseudo Tarot — UI/UX Design Context

## Product idea

Pseudo Tarot is an interactive web toy built around a simple ritual:

`ask → choose → place → reveal → get verdict`

The product should feel playful, slightly mysterious, and intentionally dramatic, but not like a serious tarot or horoscope service.

The first version uses a developer-themed pseudo-tarot deck, but the UI should not depend on developer-specific visuals. Cards, labels, and text can change later for other domains.

There is no marketing landing page. The main screen is the product.

## Main UI concept

The page should feel like a digital card table.

The cards are the main visual element. Navigation, buttons, input fields, and branding should stay secondary and visually quiet.

The initial screen contains:

- small product name / branding;
- one question input;
- primary `Ask` or `Surprise me` action;
- three empty spread positions;
- space where hidden cards appear after the reading starts.

The composition should feel focused and immersive rather than like a standard application form.

Avoid dashboard patterns, panels, navigation bars, large marketing sections, or excessive explanatory text.

## Card selection

After the user asks a question, 9 face-down cards appear.

They should look like real individual choices, not nine identical buttons in a grid. The layout can use a loose grid, fan, or slightly irregular composition to make the table feel physical.

The user chooses three cards and drags each card into one of three spread positions.

Example spread:

`Context → Problem → Advice`

Once a card is placed, the choice is final.

The interaction should communicate this visually. A placed card becomes stable and cannot return to the deck.

Drag-and-drop is the main desktop interaction. Mobile and keyboard users should also be able to select a card and then select a target position.

## Reveal experience

Cards remain face-down after placement.

When all three positions are filled, each card becomes revealable.

The user opens cards manually, one at a time, in any order.

A reveal should be one of the strongest moments in the interface:

- short card flip;
- card artwork / symbol appears;
- card name appears;
- short interpretation becomes visible.

Do not provide `Reveal all`.

After all three cards are open, the final verdict appears below or near the spread.

The verdict should feel like the conclusion of the ritual, not another generic content block.

## Visual direction

Target feeling:

`mystical card table × internet humour × modern web toy`

Prefer:

- dark or muted background;
- strong contrast around cards;
- subtle texture or depth;
- distinctive card backs;
- simple symbolic illustrations;
- controlled shadows;
- short, polished motion;
- clear typography.

Avoid overly realistic occult imagery, traditional horoscope aesthetics, or overly complex fantasy decoration.

The product should still feel modern and slightly ironic.

## Mobile

Mobile should preserve the same ritual, not simply shrink the desktop board.

The 9 hidden cards can use a compact grid or staggered layout.

The three spread cards must remain readable and easy to interact with.

Touch targets should be generous.

No horizontal scrolling should be required for the normal flow.

## Completed reading and share

The completed state contains:

- original question;
- three revealed cards;
- their meanings;
- final verdict;
- `Share`;
- `Ask again`.

Before creating a share link, show a small warning:

> Your question will be included in the shared link. Anyone with the link can read it.

The shared reading should visually resemble the completed reading rather than a separate page type.

## Design priority

The most important part of the product is not the input or the final text.

It is the feeling of physically choosing, placing, and revealing cards.

The UI should make this short interaction feel deliberate, satisfying, and worth repeating.