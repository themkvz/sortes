import { expect } from 'remix/assert'
import { test } from 'remix/test'

import { developerDeck } from './decks/developer.ts'
import { idle, start } from './reading.ts'

function countingRng(rng: () => number) {
  let calls = 0
  const wrapped = () => {
    calls++
    return rng()
  }
  return { wrapped, count: () => calls }
}

test('starting idle with a manual question stores it and prepares nine hidden choices', () => {
  const result = start(developerDeck, idle(), 'Should I merge this PR?', () => 0.5)
  if (!result.success) throw new Error('Expected successful start')
  const state = result.value
  expect(state.status).toBe('choosing')
  if (state.status !== 'choosing') throw new Error('Expected choosing status')
  expect(state.question).toBe('Should I merge this PR?')
  expect(state.choices.length).toBe(9)
  expect(new Set(state.choices.map((c) => c.cardId)).size).toBe(9)
  expect(state.choices.every((c) => c.picked === false)).toBeTruthy()
})

test('starting idle with empty/whitespace input chooses a configured prompt and prepares choices', () => {
  const result = start(developerDeck, idle(), '   ', () => 0)
  if (!result.success) throw new Error('Expected successful start')
  const state = result.value
  if (state.status !== 'choosing') throw new Error('Expected choosing status')
  expect(developerDeck.prompts.includes(state.question)).toBeTruthy()
  expect(state.choices.length).toBe(9)
})

test('the nine hidden choices are real, distinct card IDs from the deck', () => {
  const result = start(developerDeck, idle(), 'A question', () => 0.9)
  if (!result.success) throw new Error('Expected successful start')
  const state = result.value
  if (state.status !== 'choosing') throw new Error('Expected choosing status')
  const deckCardIds = new Set(developerDeck.cards.map((card) => card.id))
  for (const choice of state.choices) {
    expect(deckCardIds.has(choice.cardId)).toBeTruthy()
  }
})

test('setup does not mutate the authored deck', () => {
  const cardsBefore = JSON.stringify(developerDeck.cards)
  start(developerDeck, idle(), 'A question', () => 0.3)
  expect(JSON.stringify(developerDeck.cards)).toBe(cardsBefore)
})

test('independent sessions have different choices with a shared counting RNG', () => {
  let counter = 0
  const rng = () => {
    counter += 1
    // deterministic but different sequences per session by using a shared mutable counter
    return (counter % 97) / 97
  }
  const sessionA = start(developerDeck, idle(), 'Same question', rng)
  const sessionB = start(developerDeck, idle(), 'Same question', rng)
  if (!sessionA.success || !sessionB.success) throw new Error('Expected successful starts')
  if (sessionA.value.status !== 'choosing' || sessionB.value.status !== 'choosing') {
    throw new Error('Expected choosing status')
  }
  expect(sessionA.value.choices).not.toEqual(sessionB.value.choices)
})

test('an invalid question consumes zero random draws and leaves idle', () => {
  const { wrapped, count } = countingRng(() => 0.5)
  const tooLong = 'a'.repeat(161)
  const result = start(developerDeck, idle(), tooLong, wrapped)
  expect(result).toEqual({ success: false, error: 'invalid-question' })
  expect(count()).toBe(0)
})

test('a repeated start outside idle consumes zero random draws and is a no-op', () => {
  const started = start(developerDeck, idle(), 'First question', () => 0.5)
  if (!started.success) throw new Error('Expected successful start')
  const choosingState = started.value

  const { wrapped, count } = countingRng(() => 0.5)
  const second = start(developerDeck, choosingState, 'Second question', wrapped)
  expect(second).toEqual({ success: true, value: choosingState })
  expect(count()).toBe(0)
})
