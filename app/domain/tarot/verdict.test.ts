import * as assert from 'remix/assert'
import { expect } from 'remix/assert'
import { test } from 'remix/test'

import { developerDeck } from './decks/developer.ts'
import { type Interpretation, place, type ReadingState, reveal } from './reading.ts'

const GOLDEN_QUESTION = 'Should I rewrite it?'
const GOLDEN_PAIRS = {
  context: 'legacy-system',
  problem: 'infinite-refactor',
  advice: 'mvp',
}

const EXPECTED_VERDICT =
  'The setup: old decisions are still doing useful work. The snag: the architecture keeps improving while the finish line moves. Your next move: cut one requirement and finish the remaining loop.'

function interpretationFor(
  question: string,
  pairs: Record<string, string>,
  revealOrder = Object.keys(pairs),
): Interpretation {
  const positionIds = Object.keys(pairs)
  let state: ReadingState = {
    status: 'choosing',
    question,
    choices: positionIds.map((positionId) => ({ cardId: pairs[positionId], picked: false })),
    placements: {},
  }
  positionIds.forEach((positionId, index) => {
    state = place(developerDeck, state, index, positionId)
  })
  for (const positionId of revealOrder) state = reveal(developerDeck, state, positionId)
  if (state.status !== 'complete') throw new Error('Expected complete state')
  return state.interpretation
}

test('the golden vector produces the exact expected verdict', () => {
  expect(interpretationFor(GOLDEN_QUESTION, GOLDEN_PAIRS).verdict).toBe(EXPECTED_VERDICT)
})

test('placement and reveal order do not change the result', () => {
  const original = interpretationFor(GOLDEN_QUESTION, GOLDEN_PAIRS)
  const reordered = interpretationFor(
    GOLDEN_QUESTION,
    { advice: 'mvp', context: 'legacy-system', problem: 'infinite-refactor' },
    ['problem', 'advice', 'context'],
  )
  expect(reordered).toEqual(original)
})

test('changing which position a card is assigned to uses that position meaning', () => {
  const result = interpretationFor(GOLDEN_QUESTION, {
    context: 'mvp',
    problem: 'infinite-refactor',
    advice: 'legacy-system',
  })
  const mvpCard = result.cards.find((c) => c.cardId === 'mvp')
  if (!mvpCard) throw new Error('Expected matching card')
  expect(mvpCard.positionId).toBe('context')
  expect(mvpCard.meaning).toBe('A small working thing has survived contact with reality.')
})

test('both templates compose without leftover placeholders or doubled punctuation', () => {
  for (const prefix of ['The setup:', 'The cards remember that']) {
    let found = false
    for (let i = 0; i < 200 && !found; i++) {
      const { verdict } = interpretationFor(`${GOLDEN_QUESTION} ${i}`, GOLDEN_PAIRS)
      if (verdict.startsWith(prefix)) {
        expect(verdict).not.toMatch(/\{[^}]*\}/)
        expect(verdict).not.toMatch(/\.\./)
        found = true
      }
    }
    assert.ok(found, `expected to find a question selecting the "${prefix}" template`)
  }
})

test('two different questions can select different templates, demonstrating question-based variation', () => {
  const first = interpretationFor('Should I rewrite it?', GOLDEN_PAIRS)
  const second = interpretationFor('Should I deploy today?', GOLDEN_PAIRS)
  expect(first.verdict).not.toBe(second.verdict)
})

test('interpretation does not consume randomness and is deterministic across repeats', () => {
  const originalRandom = Math.random
  Math.random = () => {
    throw new Error('interpretation must not use randomness')
  }
  try {
    expect(interpretationFor(GOLDEN_QUESTION, GOLDEN_PAIRS)).toEqual(
      interpretationFor(GOLDEN_QUESTION, GOLDEN_PAIRS),
    )
  } finally {
    Math.random = originalRandom
  }
})
