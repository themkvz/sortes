import { test } from 'bun:test'
import assert from 'node:assert/strict'

import { developerDeck } from './developer.ts'

test('the developer deck matches the deck-content spec catalog', () => {
  assert.equal(developerDeck.id, 'developer')
  assert.equal(developerDeck.name, 'Developer Tarot')
  assert.equal(developerDeck.spreadId, 'context-problem-advice')
  assert.deepEqual(
    developerDeck.positions.map((position) => position.id),
    ['context', 'problem', 'advice'],
  )
  assert.equal(developerDeck.cards.length, 16)
  assert.equal(new Set(developerDeck.cards.map((card) => card.id)).size, 16)
  assert.equal(developerDeck.prompts.length, 5)
  assert.equal(developerDeck.templates.length, 2)

  for (const card of developerDeck.cards) {
    for (const position of developerDeck.positions) {
      const meaning = card.meanings[position.id]
      assert.ok(meaning, `${card.id} is missing a meaning for ${position.id}`)
      assert.match(meaning.text, /^[A-Z].*\.$/)
      assert.doesNotMatch(meaning.summaryFragment, /[.!?]$/)
    }
  }

  const mvp = developerDeck.cards.find((card) => card.id === 'mvp')
  assert.ok(mvp)
  const advice = mvp.meanings.advice
  assert.ok(advice)
  assert.equal(advice.text, 'Cut one requirement and finish the remaining loop.')
  assert.equal(advice.summaryFragment, 'cut one requirement and finish the remaining loop')
})
