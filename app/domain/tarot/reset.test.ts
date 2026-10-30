import { test } from 'bun:test'
import assert from 'node:assert/strict'

import { developerDeck } from './decks/developer.ts'
import { idle, place, reset, reveal, start } from './reading.ts'

test('reset from idle returns an equivalent idle state', () => {
  const idleState = idle(developerDeck)
  assert.deepEqual(reset(idleState), idleState)
})

test('reset from an incomplete (choosing) session returns to idle with the same deck and empty question', () => {
  // reset() takes no RNG parameter, so it structurally cannot consume randomness.
  const started = start(developerDeck, idle(developerDeck), 'A question', () => 0.1)
  assert.ok(started.success)
  const choosing = started.value

  const afterReset = reset(choosing)
  assert.deepEqual(afterReset, { status: 'idle', deckId: developerDeck.id, question: '' })

  const beforeStateSnapshot = JSON.stringify(choosing)
  reset(choosing)
  assert.equal(JSON.stringify(choosing), beforeStateSnapshot, 'reset must not mutate its input')
})

test('reset from a complete session discards the result and returns to idle', () => {
  const started = start(developerDeck, idle(developerDeck), 'A question', () => 0.2)
  assert.ok(started.success)
  let state = started.value
  assert.ok(state.status === 'choosing')
  state = place(developerDeck, state, 0, 'context')
  state = place(developerDeck, state, 1, 'problem')
  state = place(developerDeck, state, 2, 'advice')
  state = reveal(developerDeck, state, 'context')
  state = reveal(developerDeck, state, 'problem')
  const complete = reveal(developerDeck, state, 'advice')
  assert.equal(complete.status, 'complete')

  const afterReset = reset(complete)
  assert.deepEqual(afterReset, { status: 'idle', deckId: developerDeck.id, question: '' })
})

test('the next start after reset independently prepares nine hidden choices', () => {
  const started = start(developerDeck, idle(developerDeck), 'First', () => 0.3)
  assert.ok(started.success)
  const afterReset = reset(started.value)

  const restarted = start(developerDeck, afterReset, 'Second', () => 0.7)
  assert.ok(restarted.success)
  const state = restarted.value
  assert.ok(state.status === 'choosing')
  assert.equal(state.choices.length, 9)
  assert.equal(new Set(state.choices.map((c) => c.cardId)).size, 9)
})
