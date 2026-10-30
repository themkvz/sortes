import { test } from 'bun:test'
import assert from 'node:assert/strict'

import { developerDeck } from './decks/developer.ts'
import { interpret } from './reading.ts'

function validRecord(overrides: Record<string, unknown> = {}) {
  return {
    version: 1,
    deckId: developerDeck.id,
    question: 'Should I rewrite it?',
    spreadId: developerDeck.spreadId,
    pairs: [
      { positionId: 'context', cardId: 'legacy-system' },
      { positionId: 'problem', cardId: 'infinite-refactor' },
      { positionId: 'advice', cardId: 'mvp' },
    ],
    ...overrides,
  }
}

test('a valid canonical record interprets successfully, ordered by spread position', () => {
  const result = interpret(developerDeck, validRecord())
  assert.ok(result.success)
  assert.deepEqual(
    result.value.cards.map((c) => c.positionId),
    ['context', 'problem', 'advice'],
  )
})

test('pairs supplied out of spread order are still canonicalized', () => {
  const shuffledPairs = [
    { positionId: 'advice', cardId: 'mvp' },
    { positionId: 'context', cardId: 'legacy-system' },
    { positionId: 'problem', cardId: 'infinite-refactor' },
  ]
  const result = interpret(developerDeck, validRecord({ pairs: shuffledPairs }))
  assert.ok(result.success)
  assert.deepEqual(
    result.value.cards.map((c) => c.positionId),
    ['context', 'problem', 'advice'],
  )
})

test('rejects an unsupported version', () => {
  const result = interpret(developerDeck, validRecord({ version: 2 }))
  assert.deepEqual(result, { success: false, error: 'invalid-reading' })
})

test('rejects a mismatched deck ID', () => {
  const result = interpret(developerDeck, validRecord({ deckId: 'other-deck' }))
  assert.deepEqual(result, { success: false, error: 'invalid-reading' })
})

test('rejects a mismatched spread ID', () => {
  const result = interpret(developerDeck, validRecord({ spreadId: 'other-spread' }))
  assert.deepEqual(result, { success: false, error: 'invalid-reading' })
})

test('rejects the wrong pair count', () => {
  const result = interpret(developerDeck, validRecord({ pairs: validRecord().pairs.slice(0, 2) }))
  assert.deepEqual(result, { success: false, error: 'invalid-reading' })
})

test('rejects an unknown position or card ID', () => {
  const unknownPosition = interpret(
    developerDeck,
    validRecord({
      pairs: [
        { positionId: 'unknown', cardId: 'legacy-system' },
        { positionId: 'problem', cardId: 'infinite-refactor' },
        { positionId: 'advice', cardId: 'mvp' },
      ],
    }),
  )
  assert.deepEqual(unknownPosition, { success: false, error: 'invalid-reading' })

  const unknownCard = interpret(
    developerDeck,
    validRecord({
      pairs: [
        { positionId: 'context', cardId: 'unknown-card' },
        { positionId: 'problem', cardId: 'infinite-refactor' },
        { positionId: 'advice', cardId: 'mvp' },
      ],
    }),
  )
  assert.deepEqual(unknownCard, { success: false, error: 'invalid-reading' })
})

test('rejects duplicate cards or duplicate positions', () => {
  const duplicateCard = interpret(
    developerDeck,
    validRecord({
      pairs: [
        { positionId: 'context', cardId: 'legacy-system' },
        { positionId: 'problem', cardId: 'legacy-system' },
        { positionId: 'advice', cardId: 'mvp' },
      ],
    }),
  )
  assert.deepEqual(duplicateCard, { success: false, error: 'invalid-reading' })

  const duplicatePosition = interpret(
    developerDeck,
    validRecord({
      pairs: [
        { positionId: 'context', cardId: 'legacy-system' },
        { positionId: 'context', cardId: 'infinite-refactor' },
        { positionId: 'advice', cardId: 'mvp' },
      ],
    }),
  )
  assert.deepEqual(duplicatePosition, { success: false, error: 'invalid-reading' })
})

test('rejects a missing pair', () => {
  const result = interpret(
    developerDeck,
    validRecord({
      pairs: [
        { positionId: 'context', cardId: 'legacy-system' },
        { positionId: 'problem', cardId: 'infinite-refactor' },
      ],
    }),
  )
  assert.deepEqual(result, { success: false, error: 'invalid-reading' })
})

test('rejects an empty normalized question', () => {
  const result = interpret(developerDeck, validRecord({ question: '   ' }))
  assert.deepEqual(result, { success: false, error: 'invalid-reading' })
})

test('rejects a non-string or malformed question', () => {
  assert.deepEqual(interpret(developerDeck, validRecord({ question: 42 })), {
    success: false,
    error: 'invalid-reading',
  })
})
