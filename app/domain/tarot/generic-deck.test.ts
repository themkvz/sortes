import { expect } from 'remix/assert'
import { test } from 'remix/test'

import type { Deck } from './deck.ts'
import { idle, place, reveal, start } from './reading.ts'

function meaning(fragment: string) {
  return {
    summaryFragment: fragment,
    text: `${fragment.charAt(0).toUpperCase()}${fragment.slice(1)}.`,
  }
}

// A deck with renamed positions, card IDs, and labels, proving the engine has no
// branch depending on the developer deck's specific names or English labels.
const renamedDeck: Deck = {
  id: 'astro-deck',
  name: 'Astro Deck',
  positions: [
    { id: 'yesterday', label: 'Hier' },
    { id: 'today', label: "Aujourd'hui" },
    { id: 'tomorrow', label: 'Demain' },
  ],
  cards: Array.from({ length: 16 }, (_, index) => ({
    id: `orb-${index}`,
    name: `Orb ${index}`,
    shortDescription: `A glowing orb numbered ${index}.`,
    meanings: {
      yesterday: meaning(`orb ${index} remembers yesterday`),
      today: meaning(`orb ${index} glows today`),
      tomorrow: meaning(`orb ${index} predicts tomorrow`),
    },
  })),
  prompts: ['What does the orb say?'],
  templates: ['Then: {yesterday}. Now: {today}. Next: {tomorrow}.'],
}

test('a full start/place/reveal sequence works generically on a renamed deck', () => {
  let state = idle()
  expect(state.status).toBe('idle')

  const started = start(renamedDeck, state, 'Will it glow?', () => 0.55)
  if (!started.success) throw new Error('Expected successful start')
  state = started.value
  if (state.status !== 'choosing') throw new Error('Expected choosing state')
  expect(state.choices.length).toBe(9)

  state = place(renamedDeck, state, 0, 'tomorrow')
  state = place(renamedDeck, state, 1, 'yesterday')
  state = place(renamedDeck, state, 2, 'today')
  if (state.status !== 'ready') throw new Error('Expected ready state')

  state = reveal(renamedDeck, state, 'yesterday')
  if (state.status !== 'revealing') throw new Error('Expected revealing state')
  state = reveal(renamedDeck, state, 'today')
  state = reveal(renamedDeck, state, 'tomorrow')
  if (state.status !== 'complete') throw new Error('Expected complete state')

  expect(state.interpretation.cards.map((card) => card.positionId)).toEqual([
    'yesterday',
    'today',
    'tomorrow',
  ])
  expect(state.interpretation.verdict).not.toMatch(/\{[^}]*\}/)
})
