import assert from 'node:assert/strict'
import test from 'node:test'

import { developerDeck } from './decks/developer.ts'
import { idle, place, reveal, start } from './reading.ts'

function readyState() {
  const started = start(developerDeck, idle(developerDeck), 'A question', () => 0.1)
  assert.ok(started.success)
  let state = started.value
  assert.ok(state.status === 'choosing')
  state = place(developerDeck, state, 0, 'context')
  state = place(developerDeck, state, 1, 'problem')
  state = place(developerDeck, state, 2, 'advice')
  assert.equal(state.status, 'ready')
  return state
}

test('a premature reveal before all positions are filled is a no-op', () => {
  const started = start(developerDeck, idle(developerDeck), 'A question', () => 0.1)
  assert.ok(started.success)
  let choosing = started.value
  assert.ok(choosing.status === 'choosing')
  choosing = place(developerDeck, choosing, 0, 'context')
  choosing = place(developerDeck, choosing, 1, 'problem')

  const attempt = reveal(developerDeck, choosing, 'context')
  assert.equal(attempt, choosing)
})

test('reveal before ready (idle) is a no-op', () => {
  const idleState = idle(developerDeck)
  assert.equal(reveal(developerDeck, idleState, 'context'), idleState)
})

test('an unknown position reveal is a no-op', () => {
  const ready = readyState()
  assert.equal(reveal(developerDeck, ready, 'unknown-position'), ready)
})

test('one reveal marks only that card revealed and keeps the verdict unavailable', () => {
  const ready = readyState()
  const revealing = reveal(developerDeck, ready, 'context')
  assert.equal(revealing.status, 'revealing')
  assert.ok(revealing.status === 'revealing')
  assert.equal(revealing.placements.context?.revealed, true)
  assert.equal(revealing.placements.problem?.revealed, false)
  assert.equal(revealing.placements.advice?.revealed, false)
  assert.ok(!('reading' in revealing))
  assert.ok(!('interpretation' in revealing))
})

test('a repeated reveal of the same position is a no-op', () => {
  const ready = readyState()
  const revealing = reveal(developerDeck, ready, 'context')
  const again = reveal(developerDeck, revealing, 'context')
  assert.equal(again, revealing)
})

test('the third reveal produces the completed reading and interpretation immediately', () => {
  const ready = readyState()
  let state = reveal(developerDeck, ready, 'context')
  state = reveal(developerDeck, state, 'problem')
  const complete = reveal(developerDeck, state, 'advice')
  assert.equal(complete.status, 'complete')
  assert.ok(complete.status === 'complete')
  assert.equal(complete.reading.pairs.length, 3)
  assert.ok(complete.interpretation.verdict.length > 0)
})

test('reveal after completion is a no-op', () => {
  const ready = readyState()
  let state = reveal(developerDeck, ready, 'context')
  state = reveal(developerDeck, state, 'problem')
  const complete = reveal(developerDeck, state, 'advice')
  const again = reveal(developerDeck, complete, 'advice')
  assert.equal(again, complete)
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
    assert.equal(state.status, 'complete')
    return state
  })

  for (const result of results.slice(1)) {
    assert.deepEqual(result, results[0])
  }
})
