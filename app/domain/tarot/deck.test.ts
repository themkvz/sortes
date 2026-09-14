import assert from 'node:assert/strict'
import test from 'node:test'

import { defineDeck } from './deck.ts'

function validDefinition(overrides: Record<string, unknown> = {}) {
  const positions = [
    { id: 'context', label: 'Context' },
    { id: 'problem', label: 'Problem' },
    { id: 'advice', label: 'Advice' },
  ]
  const cards: Array<{
    id: string
    name: string
    shortDescription: string
    meanings: Record<string, { text: string; summaryFragment: string }>
  }> = Array.from({ length: 16 }, (_, index) => ({
    id: `card-${index}`,
    name: `Card ${index}`,
    shortDescription: `Description ${index}`,
    meanings: {
      context: { text: `Context ${index}.`, summaryFragment: `context ${index}` },
      problem: { text: `Problem ${index}.`, summaryFragment: `problem ${index}` },
      advice: { text: `Advice ${index}.`, summaryFragment: `advice ${index}` },
    },
  }))

  return {
    id: 'test-deck',
    name: 'Test Deck',
    spreadId: 'context-problem-advice',
    positions,
    cards,
    prompts: ['A valid prompt?'],
    templates: ['{context} {problem} {advice}'],
    ...overrides,
  }
}

test('a valid deck shape passes', () => {
  const deck = defineDeck(validDefinition())
  assert.equal(deck.cards.length, 16)
  assert.equal(deck.positions.length, 3)
})

test('rejects duplicate card IDs', () => {
  const definition = validDefinition()
  const cards = definition.cards.slice()
  cards[1] = { ...cards[1]!, id: cards[0]!.id }
  assert.throws(() => defineDeck({ ...definition, cards }), /duplicate cards/)
})

test('rejects the wrong card count', () => {
  const definition = validDefinition()
  assert.throws(
    () => defineDeck({ ...definition, cards: definition.cards.slice(0, 15) }),
    /exactly 16 cards/,
  )
})

test('rejects the wrong position count', () => {
  const definition = validDefinition()
  assert.throws(
    () => defineDeck({ ...definition, positions: definition.positions.slice(0, 2) }),
    /exactly 3 positions/,
  )
})

test('rejects a card missing a position meaning', () => {
  const definition = validDefinition()
  const cards = definition.cards.slice()
  const { advice: _omit, ...remainingMeanings } = cards[0]!.meanings
  cards[0] = { ...cards[0]!, meanings: remainingMeanings }
  assert.throws(
    () => defineDeck({ ...definition, cards }),
    /missing a meaning for position "advice"/,
  )
})

test('rejects an invalid prompt', () => {
  const definition = validDefinition()
  assert.throws(() => defineDeck({ ...definition, prompts: ['a'.repeat(161)] }), /invalid prompt/)
})

test('rejects a template missing a required placeholder', () => {
  const definition = validDefinition()
  assert.throws(
    () => defineDeck({ ...definition, templates: ['{context} {problem}'] }),
    /missing the "\{advice\}" placeholder/,
  )
})

test('rejects a template with an unknown placeholder', () => {
  const definition = validDefinition()
  assert.throws(
    () => defineDeck({ ...definition, templates: ['{context} {problem} {advice} {mystery}'] }),
    /unknown placeholder "\{mystery\}"/,
  )
})

test('rejects a template with a malformed placeholder', () => {
  const definition = validDefinition()
  assert.throws(
    () => defineDeck({ ...definition, templates: ['{context} {problem} {advice} {'] }),
    /malformed placeholder/,
  )
})
