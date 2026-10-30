import { test } from 'bun:test'
import assert from 'node:assert/strict'

import { developerDeck } from './decks/developer.ts'
import { idle, place, start } from './reading.ts'

function choosingState() {
  const result = start(developerDeck, idle(developerDeck), 'A question', () => 0.42)
  assert.ok(result.success)
  return result.value
}

test('cards can be placed into positions in arbitrary order', () => {
  const state = choosingState()
  assert.ok(state.status === 'choosing')

  const afterAdvice = place(developerDeck, state, 0, 'advice')
  assert.ok(afterAdvice.status === 'choosing')
  assert.equal(afterAdvice.placements.advice?.cardId, state.choices[0].cardId)

  const afterContext = place(developerDeck, afterAdvice, 1, 'context')
  assert.ok(afterContext.status === 'choosing')
  assert.equal(afterContext.placements.context?.cardId, state.choices[1].cardId)
})

test('placed cards remain face-down', () => {
  const state = choosingState()
  const next = place(developerDeck, state, 0, 'context')
  assert.ok(next.status === 'choosing')
  assert.equal(next.placements.context?.revealed, false)
})

test('an occupied position cannot be overwritten', () => {
  const state = choosingState()
  const placedOnce = place(developerDeck, state, 0, 'context')
  const placedAgain = place(developerDeck, placedOnce, 1, 'context')
  assert.equal(placedAgain, placedOnce)
})

test('an already-picked card cannot be picked again', () => {
  const state = choosingState()
  const placedOnce = place(developerDeck, state, 0, 'context')
  const placedAgain = place(developerDeck, placedOnce, 0, 'problem')
  assert.equal(placedAgain, placedOnce)
})

test('an out-of-range or noninteger choice index is a no-op', () => {
  const state = choosingState()
  assert.equal(place(developerDeck, state, -1, 'context'), state)
  assert.equal(place(developerDeck, state, 9, 'context'), state)
  assert.equal(place(developerDeck, state, 1.5, 'context'), state)
})

test('an unknown position ID is a no-op', () => {
  const state = choosingState()
  assert.equal(place(developerDeck, state, 0, 'unknown-position'), state)
})

test('placement outside choosing is a no-op', () => {
  const idleState = idle(developerDeck)
  assert.equal(place(developerDeck, idleState, 0, 'context'), idleState)
})

test('exactly three successful placements enter ready with face-down cards', () => {
  let state = choosingState()
  assert.ok(state.status === 'choosing')
  state = place(developerDeck, state, 0, 'context') as typeof state
  state = place(developerDeck, state, 1, 'problem') as typeof state
  const finalState = place(developerDeck, state, 2, 'advice')
  assert.equal(finalState.status, 'ready')
  assert.ok(finalState.status === 'ready')
  assert.equal(Object.keys(finalState.placements).length, 3)
  assert.ok(Object.values(finalState.placements).every((p) => p.revealed === false))

  const furtherPlacement = place(developerDeck, finalState, 3, 'context')
  assert.equal(furtherPlacement, finalState)
})
