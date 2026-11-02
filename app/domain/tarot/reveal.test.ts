import { expect } from 'remix/assert'
import { test } from 'remix/test'

import { developerDeck } from './decks/developer.ts'
import { idle, place, reveal, start } from './reading.ts'

function readyState() {
  const started = start(developerDeck, idle(developerDeck), 'A question', () => 0.1)
  if (!started.success) throw new Error('Expected successful start')
  let state = started.value
  if (state.status !== 'choosing') throw new Error('Expected choosing status')
  state = place(developerDeck, state, 0, 'context')
  state = place(developerDeck, state, 1, 'problem')
  state = place(developerDeck, state, 2, 'advice')
  expect(state.status).toBe('ready')
  return state
}

test('a premature reveal before all positions are filled is a no-op', () => {
  const started = start(developerDeck, idle(developerDeck), 'A question', () => 0.1)
  if (!started.success) throw new Error('Expected successful start')
  let choosing = started.value
  if (choosing.status !== 'choosing') throw new Error('Expected choosing status')
  choosing = place(developerDeck, choosing, 0, 'context')
  choosing = place(developerDeck, choosing, 1, 'problem')

  const attempt = reveal(developerDeck, choosing, 'context')
  expect(attempt).toBe(choosing)
})

test('reveal before ready (idle) is a no-op', () => {
  const idleState = idle(developerDeck)
  expect(reveal(developerDeck, idleState, 'context')).toBe(idleState)
})

test('an unknown position reveal is a no-op', () => {
  const ready = readyState()
  expect(reveal(developerDeck, ready, 'unknown-position')).toBe(ready)
})

test('one reveal marks only that card revealed and keeps the verdict unavailable', () => {
  const ready = readyState()
  const revealing = reveal(developerDeck, ready, 'context')
  expect(revealing.status).toBe('revealing')
  if (revealing.status !== 'revealing') throw new Error('Expected revealing status')
  expect(revealing.placements.context?.revealed).toBe(true)
  expect(revealing.placements.problem?.revealed).toBe(false)
  expect(revealing.placements.advice?.revealed).toBe(false)
  expect(!('reading' in revealing)).toBeTruthy()
  expect(!('interpretation' in revealing)).toBeTruthy()
})

test('a repeated reveal of the same position is a no-op', () => {
  const ready = readyState()
  const revealing = reveal(developerDeck, ready, 'context')
  const again = reveal(developerDeck, revealing, 'context')
  expect(again).toBe(revealing)
})

test('the third reveal produces the completed reading and interpretation immediately', () => {
  const ready = readyState()
  let state = reveal(developerDeck, ready, 'context')
  state = reveal(developerDeck, state, 'problem')
  const complete = reveal(developerDeck, state, 'advice')
  expect(complete.status).toBe('complete')
  if (complete.status !== 'complete') throw new Error('Expected complete status')
  expect(complete.reading.pairs.length).toBe(3)
  expect(complete.interpretation.verdict.length > 0).toBeTruthy()
})

test('reveal after completion is a no-op', () => {
  const ready = readyState()
  let state = reveal(developerDeck, ready, 'context')
  state = reveal(developerDeck, state, 'problem')
  const complete = reveal(developerDeck, state, 'advice')
  const again = reveal(developerDeck, complete, 'advice')
  expect(again).toBe(complete)
})

test('all reveal orders produce the same final reading and interpretation', () => {
  const orders = [
    ['context', 'problem', 'advice'],
    ['advice', 'problem', 'context'],
    ['problem', 'advice', 'context'],
  ]

  const results = orders.map((order) => {
    let state = readyState()
    for (const positionId of order) {
      state = reveal(developerDeck, state, positionId) as typeof state
    }
    expect(state.status).toBe('complete')
    return state
  })

  for (const result of results.slice(1)) {
    expect(result).toEqual(results[0])
  }
})
