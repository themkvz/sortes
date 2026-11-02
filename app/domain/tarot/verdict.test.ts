import * as assert from 'remix/assert'
import { expect } from 'remix/assert'
import { test } from 'remix/test'

import { developerDeck } from './decks/developer.ts'
import { interpret } from './reading.ts'

const GOLDEN_RECORD = {
  version: 1,
  deckId: 'developer',
  question: 'Should I rewrite it?',
  spreadId: 'context-problem-advice',
  pairs: [
    { positionId: 'context', cardId: 'legacy-system' },
    { positionId: 'problem', cardId: 'infinite-refactor' },
    { positionId: 'advice', cardId: 'mvp' },
  ],
}

const EXPECTED_VERDICT =
  'The cards remember that old decisions are still doing useful work. Right now, the architecture keeps improving while the finish line moves. Their advice: cut one requirement and finish the remaining loop.'

test('the golden vector selects template index 1 and produces the exact expected verdict', () => {
  const result = interpret(developerDeck, GOLDEN_RECORD)
  if (!result.success) throw new Error('Expected successful interpretation')
  expect(result.value.verdict).toBe(EXPECTED_VERDICT)
  expect(result.value.verdict.startsWith('The cards remember that')).toBeTruthy()
})

test('permuting pair order in the input does not change the result', () => {
  const permuted = {
    ...GOLDEN_RECORD,
    pairs: [
      { positionId: 'advice', cardId: 'mvp' },
      { positionId: 'context', cardId: 'legacy-system' },
      { positionId: 'problem', cardId: 'infinite-refactor' },
    ],
  }
  const original = interpret(developerDeck, GOLDEN_RECORD)
  const reordered = interpret(developerDeck, permuted)
  if (!original.success || !reordered.success)
    throw new Error('Expected successful interpretations')
  expect(original.value).toEqual(reordered.value)
})

test('changing which position a card is assigned to uses that position meaning', () => {
  const swapped = {
    ...GOLDEN_RECORD,
    pairs: [
      { positionId: 'context', cardId: 'mvp' },
      { positionId: 'problem', cardId: 'infinite-refactor' },
      { positionId: 'advice', cardId: 'legacy-system' },
    ],
  }
  const result = interpret(developerDeck, swapped)
  if (!result.success) throw new Error('Expected successful interpretation')
  const mvpCard = result.value.cards.find((c) => c.cardId === 'mvp')
  if (!mvpCard) throw new Error('Expected matching card')
  expect(mvpCard.positionId).toBe('context')
  expect(mvpCard.meaning).toBe('A small working thing has survived contact with reality.')
})

test('both templates compose without leftover placeholders or doubled punctuation', () => {
  for (const templateIndex of [0, 1]) {
    // Find a question that selects this template index for the golden pairs.
    let found = false
    for (let i = 0; i < 200 && !found; i++) {
      const candidate = { ...GOLDEN_RECORD, question: `${GOLDEN_RECORD.question} ${i}` }
      const result = interpret(developerDeck, candidate)
      if (!result.success) throw new Error('Expected successful interpretation')
      const usesTemplate =
        templateIndex === 1
          ? result.value.verdict.startsWith('The cards remember that')
          : result.value.verdict.startsWith('The setup:')
      if (usesTemplate) {
        expect(result.value.verdict).not.toMatch(/\{[^}]*\}/)
        expect(result.value.verdict).not.toMatch(/\.\./)
        found = true
      }
    }
    assert.ok(found, `expected to find a question selecting template index ${templateIndex}`)
  }
})

test('two different questions can select different templates, demonstrating question-based variation', () => {
  const first = interpret(developerDeck, { ...GOLDEN_RECORD, question: 'Should I rewrite it?' })
  const second = interpret(developerDeck, { ...GOLDEN_RECORD, question: 'Should I deploy today?' })
  if (!first.success || !second.success) throw new Error('Expected successful interpretations')
  expect(first.value.verdict).not.toBe(second.value.verdict)
})

test('interpretation does not consume randomness and is deterministic across repeats', () => {
  const originalRandom = Math.random
  Math.random = () => {
    throw new Error('interpretation must not use randomness')
  }
  try {
    const first = interpret(developerDeck, GOLDEN_RECORD)
    const second = interpret(developerDeck, GOLDEN_RECORD)
    if (!first.success || !second.success) throw new Error('Expected successful interpretations')
    expect(first.value).toEqual(second.value)
  } finally {
    Math.random = originalRandom
  }
})
