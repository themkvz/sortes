import assert from 'node:assert/strict'
import test from 'node:test'

import { defineDeck } from './deck.ts'
import { idle, interpret, place, reset, reveal, start } from './reading.ts'

function meaning(fragment: string) {
  return {
    summaryFragment: fragment,
    text: `${fragment.charAt(0).toUpperCase()}${fragment.slice(1)}.`,
  }
}

// A deck with renamed positions, card IDs, and labels, proving the engine has no
// branch depending on the developer deck's specific names or English labels.
const renamedDeck = defineDeck({
  id: 'astro-deck',
  name: 'Astro Deck',
  spreadId: 'past-present-future',
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
})

test('a full start/place/reveal/interpret/reset sequence works generically on a renamed deck', () => {
  let state = idle(renamedDeck)
  assert.equal(state.status, 'idle')

  const started = start(renamedDeck, state, 'Will it glow?', () => 0.55)
  assert.ok(started.success)
  state = started.value
  assert.ok(state.status === 'choosing')
  assert.equal(state.choices.length, 9)

  state = place(renamedDeck, state, 0, 'tomorrow')
  state = place(renamedDeck, state, 1, 'yesterday')
  state = place(renamedDeck, state, 2, 'today')
  assert.equal(state.status, 'ready')

  state = reveal(renamedDeck, state, 'yesterday')
  assert.equal(state.status, 'revealing')
  state = reveal(renamedDeck, state, 'today')
  state = reveal(renamedDeck, state, 'tomorrow')
  assert.equal(state.status, 'complete')
  assert.ok(state.status === 'complete')

  assert.equal(state.reading.deckId, 'astro-deck')
  assert.equal(state.reading.spreadId, 'past-present-future')
  assert.deepEqual(
    state.reading.pairs.map((pair) => pair.positionId),
    ['yesterday', 'today', 'tomorrow'],
  )
  assert.doesNotMatch(state.interpretation.verdict, /\{[^}]*\}/)

  const standalone = interpret(renamedDeck, state.reading)
  assert.ok(standalone.success)
  assert.deepEqual(standalone.value, state.interpretation)

  const afterReset = reset(state)
  assert.deepEqual(afterReset, { status: 'idle', deckId: 'astro-deck', question: '' })
})
