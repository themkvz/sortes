import { expect } from 'remix/assert'
import { test } from 'remix/test'

import { developerDeck } from './decks/developer.ts'
import { idle, place, start } from './reading.ts'

function choosingState() {
  const result = start(developerDeck, idle(), 'A question', () => 0.42)
  if (!result.success) throw new Error('Expected successful start')
  return result.value
}

test('cards can be placed into positions in arbitrary order', () => {
  const state = choosingState()
  if (state.status !== 'choosing') throw new Error('Expected choosing status')

  const afterAdvice = place(developerDeck, state, 0, 'advice')
  if (afterAdvice.status !== 'choosing') throw new Error('Expected choosing status')
  expect(afterAdvice.placements.advice?.cardId).toBe(state.choices[0].cardId)

  const afterContext = place(developerDeck, afterAdvice, 1, 'context')
  if (afterContext.status !== 'choosing') throw new Error('Expected choosing status')
  expect(afterContext.placements.context?.cardId).toBe(state.choices[1].cardId)
})

test('placed cards remain face-down', () => {
  const state = choosingState()
  const next = place(developerDeck, state, 0, 'context')
  if (next.status !== 'choosing') throw new Error('Expected choosing status')
  expect(next.placements.context?.revealed).toBe(false)
})

test('an occupied position cannot be overwritten', () => {
  const state = choosingState()
  const placedOnce = place(developerDeck, state, 0, 'context')
  const placedAgain = place(developerDeck, placedOnce, 1, 'context')
  expect(placedAgain).toBe(placedOnce)
})

test('an already-picked card cannot be picked again', () => {
  const state = choosingState()
  const placedOnce = place(developerDeck, state, 0, 'context')
  const placedAgain = place(developerDeck, placedOnce, 0, 'problem')
  expect(placedAgain).toBe(placedOnce)
})

test('an out-of-range or noninteger choice index is a no-op', () => {
  const state = choosingState()
  expect(place(developerDeck, state, -1, 'context')).toBe(state)
  expect(place(developerDeck, state, 9, 'context')).toBe(state)
  expect(place(developerDeck, state, 1.5, 'context')).toBe(state)
})

test('an unknown position ID is a no-op', () => {
  const state = choosingState()
  expect(place(developerDeck, state, 0, 'unknown-position')).toBe(state)
})

test('placement outside choosing is a no-op', () => {
  const idleState = idle()
  expect(place(developerDeck, idleState, 0, 'context')).toBe(idleState)
})

test('exactly three successful placements enter ready with face-down cards', () => {
  let state = choosingState()
  if (state.status !== 'choosing') throw new Error('Expected choosing status')
  state = place(developerDeck, state, 0, 'context') as typeof state
  state = place(developerDeck, state, 1, 'problem') as typeof state
  const finalState = place(developerDeck, state, 2, 'advice')
  expect(finalState.status).toBe('ready')
  if (finalState.status !== 'ready') throw new Error('Expected ready status')
  expect(Object.keys(finalState.placements).length).toBe(3)
  expect(Object.values(finalState.placements).every((p) => p.revealed === false)).toBeTruthy()

  const furtherPlacement = place(developerDeck, finalState, 3, 'context')
  expect(furtherPlacement).toBe(finalState)
})
