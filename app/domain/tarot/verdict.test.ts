import { test } from 'bun:test'
import assert from 'node:assert/strict'

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
  assert.ok(result.success)
  assert.equal(result.value.verdict, EXPECTED_VERDICT)
  assert.ok(result.value.verdict.startsWith('The cards remember that'))
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
  assert.ok(original.success && reordered.success)
  assert.deepEqual(original.value, reordered.value)
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
  assert.ok(result.success)
  const mvpCard = result.value.cards.find((c) => c.cardId === 'mvp')
  assert.ok(mvpCard)
  assert.equal(mvpCard.positionId, 'context')
  assert.equal(mvpCard.meaning, 'A small working thing has survived contact with reality.')
})

test('both templates compose without leftover placeholders or doubled punctuation', () => {
  for (const templateIndex of [0, 1]) {
    // Find a question that selects this template index for the golden pairs.
    let found = false
    for (let i = 0; i < 200 && !found; i++) {
      const candidate = { ...GOLDEN_RECORD, question: `${GOLDEN_RECORD.question} ${i}` }
      const result = interpret(developerDeck, candidate)
      assert.ok(result.success)
      const usesTemplate =
        templateIndex === 1
          ? result.value.verdict.startsWith('The cards remember that')
          : result.value.verdict.startsWith('The setup:')
      if (usesTemplate) {
        assert.doesNotMatch(result.value.verdict, /\{[^}]*\}/)
        assert.doesNotMatch(result.value.verdict, /\.\./)
        found = true
      }
    }
    assert.ok(found, `expected to find a question selecting template index ${templateIndex}`)
  }
})

test('two different questions can select different templates, demonstrating question-based variation', () => {
  const first = interpret(developerDeck, { ...GOLDEN_RECORD, question: 'Should I rewrite it?' })
  const second = interpret(developerDeck, { ...GOLDEN_RECORD, question: 'Should I deploy today?' })
  assert.ok(first.success && second.success)
  assert.notEqual(first.value.verdict, second.value.verdict)
})

test('interpretation does not consume randomness and is deterministic across repeats', () => {
  const originalRandom = Math.random
  Math.random = () => {
    throw new Error('interpretation must not use randomness')
  }
  try {
    const first = interpret(developerDeck, GOLDEN_RECORD)
    const second = interpret(developerDeck, GOLDEN_RECORD)
    assert.ok(first.success && second.success)
    assert.deepEqual(first.value, second.value)
  } finally {
    Math.random = originalRandom
  }
})
