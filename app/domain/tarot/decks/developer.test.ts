import { expect } from 'remix/assert'
import { test } from 'remix/test'

import { developerDeck } from './developer.ts'

test('the developer deck matches the deck-content spec catalog', () => {
  expect(developerDeck.id).toBe('developer')
  expect(developerDeck.name).toBe('Developer Tarot')
  expect(developerDeck.spreadId).toBe('context-problem-advice')
  expect(developerDeck.positions.map((position) => position.id)).toEqual([
    'context',
    'problem',
    'advice',
  ])
  expect(developerDeck.cards.length).toBe(16)
  expect(new Set(developerDeck.cards.map((card) => card.id)).size).toBe(16)
  expect(developerDeck.prompts.length).toBe(5)
  expect(developerDeck.templates.length).toBe(2)

  for (const card of developerDeck.cards) {
    for (const position of developerDeck.positions) {
      const meaning = card.meanings[position.id]
      if (!meaning) throw new Error(`${card.id} is missing a meaning for ${position.id}`)
      expect(meaning.text).toMatch(/^[A-Z].*\.$/)
      expect(meaning.summaryFragment).not.toMatch(/[.!?]$/)
    }
  }

  const mvp = developerDeck.cards.find((card) => card.id === 'mvp')
  if (!mvp) throw new Error('Expected mvp card')
  const advice = mvp.meanings.advice
  if (!advice) throw new Error('Expected advice meaning')
  expect(advice.text).toBe('Cut one requirement and finish the remaining loop.')
  expect(advice.summaryFragment).toBe('cut one requirement and finish the remaining loop')
})
