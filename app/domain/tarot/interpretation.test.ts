import { expect } from 'remix/assert'
import { test } from 'remix/test'

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
  if (!result.success) throw new Error('Expected successful interpretation')
  expect(result.value.cards.map((c) => c.positionId)).toEqual(['context', 'problem', 'advice'])
})

test('pairs supplied out of spread order are still canonicalized', () => {
  const shuffledPairs = [
    { positionId: 'advice', cardId: 'mvp' },
    { positionId: 'context', cardId: 'legacy-system' },
    { positionId: 'problem', cardId: 'infinite-refactor' },
  ]
  const result = interpret(developerDeck, validRecord({ pairs: shuffledPairs }))
  if (!result.success) throw new Error('Expected successful interpretation')
  expect(result.value.cards.map((c) => c.positionId)).toEqual(['context', 'problem', 'advice'])
})

test('rejects an unsupported version', () => {
  const result = interpret(developerDeck, validRecord({ version: 2 }))
  expect(result).toEqual({ success: false, error: 'invalid-reading' })
})

test('rejects a mismatched deck ID', () => {
  const result = interpret(developerDeck, validRecord({ deckId: 'other-deck' }))
  expect(result).toEqual({ success: false, error: 'invalid-reading' })
})

test('rejects a mismatched spread ID', () => {
  const result = interpret(developerDeck, validRecord({ spreadId: 'other-spread' }))
  expect(result).toEqual({ success: false, error: 'invalid-reading' })
})

test('rejects the wrong pair count', () => {
  const result = interpret(developerDeck, validRecord({ pairs: validRecord().pairs.slice(0, 2) }))
  expect(result).toEqual({ success: false, error: 'invalid-reading' })
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
  expect(unknownPosition).toEqual({ success: false, error: 'invalid-reading' })

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
  expect(unknownCard).toEqual({ success: false, error: 'invalid-reading' })
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
  expect(duplicateCard).toEqual({ success: false, error: 'invalid-reading' })

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
  expect(duplicatePosition).toEqual({ success: false, error: 'invalid-reading' })
})

test('rejects an empty normalized question', () => {
  const result = interpret(developerDeck, validRecord({ question: '   ' }))
  expect(result).toEqual({ success: false, error: 'invalid-reading' })
})

test('rejects a non-string or malformed question', () => {
  expect(interpret(developerDeck, validRecord({ question: 42 }))).toEqual({
    success: false,
    error: 'invalid-reading',
  })
})
