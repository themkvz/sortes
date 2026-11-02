import * as assert from 'remix/assert'
import { expect } from 'remix/assert'
import { test } from 'remix/test'

import { developerDeck } from './decks/developer.ts'
import { idle, place, reset, reveal, start } from './reading.ts'

test('reset from idle returns an equivalent idle state', () => {
  const idleState = idle(developerDeck)
  expect(reset(idleState)).toEqual(idleState)
})

test('reset from an incomplete (choosing) session returns to idle with the same deck and empty question', () => {
  // reset() takes no RNG parameter, so it structurally cannot consume randomness.
  const started = start(developerDeck, idle(developerDeck), 'A question', () => 0.1)
  if (!started.success) throw new Error('Expected successful start')
  const choosing = started.value

  const afterReset = reset(choosing)
  expect(afterReset).toEqual({ status: 'idle', deckId: developerDeck.id, question: '' })

  const beforeStateSnapshot = JSON.stringify(choosing)
  reset(choosing)
  assert.equal(JSON.stringify(choosing), beforeStateSnapshot, 'reset must not mutate its input')
})

test('reset from a complete session discards the result and returns to idle', () => {
  const started = start(developerDeck, idle(developerDeck), 'A question', () => 0.2)
  if (!started.success) throw new Error('Expected successful start')
  let state = started.value
  if (state.status !== 'choosing') throw new Error('Expected choosing status')
  state = place(developerDeck, state, 0, 'context')
  state = place(developerDeck, state, 1, 'problem')
  state = place(developerDeck, state, 2, 'advice')
  state = reveal(developerDeck, state, 'context')
  state = reveal(developerDeck, state, 'problem')
  const complete = reveal(developerDeck, state, 'advice')
  expect(complete.status).toBe('complete')

  const afterReset = reset(complete)
  expect(afterReset).toEqual({ status: 'idle', deckId: developerDeck.id, question: '' })
})

test('the next start after reset independently prepares nine hidden choices', () => {
  const started = start(developerDeck, idle(developerDeck), 'First', () => 0.3)
  if (!started.success) throw new Error('Expected successful start')
  const afterReset = reset(started.value)

  const restarted = start(developerDeck, afterReset, 'Second', () => 0.7)
  if (!restarted.success) throw new Error('Expected successful start')
  const state = restarted.value
  if (state.status !== 'choosing') throw new Error('Expected choosing status')
  expect(state.choices.length).toBe(9)
  expect(new Set(state.choices.map((c) => c.cardId)).size).toBe(9)
})
