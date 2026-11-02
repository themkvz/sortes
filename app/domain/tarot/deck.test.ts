import { expect } from 'remix/assert'
import { test } from 'remix/test'

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
  expect(deck.cards.length).toBe(16)
  expect(deck.positions.length).toBe(3)
})

test('rejects duplicate card IDs', () => {
  const definition = validDefinition()
  const cards = definition.cards.slice()
  cards[1] = { ...cards[1], id: cards[0].id }
  expect(() => defineDeck({ ...definition, cards })).toThrow(/duplicate cards/)
})

test('rejects the wrong card count', () => {
  const definition = validDefinition()
  expect(() => defineDeck({ ...definition, cards: definition.cards.slice(0, 15) })).toThrow(
    /exactly 16 cards/,
  )
})

test('rejects the wrong position count', () => {
  const definition = validDefinition()
  expect(() => defineDeck({ ...definition, positions: definition.positions.slice(0, 2) })).toThrow(
    /exactly 3 positions/,
  )
})

test('rejects a card missing a position meaning', () => {
  const definition = validDefinition()
  const cards = definition.cards.slice()
  const { advice: _omit, ...remainingMeanings } = cards[0].meanings
  cards[0] = { ...cards[0], meanings: remainingMeanings }
  expect(() => defineDeck({ ...definition, cards })).toThrow(
    /missing a meaning for position "advice"/,
  )
})

test('rejects an invalid prompt', () => {
  const definition = validDefinition()
  expect(() => defineDeck({ ...definition, prompts: ['a'.repeat(161)] })).toThrow(/invalid prompt/)
})

test('rejects a template missing a required placeholder', () => {
  const definition = validDefinition()
  expect(() => defineDeck({ ...definition, templates: ['{context} {problem}'] })).toThrow(
    /missing the "\{advice\}" placeholder/,
  )
})

test('rejects a template with an unknown placeholder', () => {
  const definition = validDefinition()
  expect(() =>
    defineDeck({ ...definition, templates: ['{context} {problem} {advice} {mystery}'] }),
  ).toThrow(/unknown placeholder "\{mystery\}"/)
})

test('rejects a template with a malformed placeholder', () => {
  const definition = validDefinition()
  expect(() =>
    defineDeck({ ...definition, templates: ['{context} {problem} {advice} {'] }),
  ).toThrow(/malformed placeholder/)
})
