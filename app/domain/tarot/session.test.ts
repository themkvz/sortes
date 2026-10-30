import { test } from 'bun:test'
import assert from 'node:assert/strict'

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
  const result = start(developerDeck, idle(developerDeck), 'Should I merge this PR?', () => 0.5)
  assert.equal(result.success, true)
  assert.ok(result.success)
  const state = result.value
  assert.equal(state.status, 'choosing')
  assert.ok(state.status === 'choosing')
  assert.equal(state.question, 'Should I merge this PR?')
  assert.equal(state.choices.length, 9)
  assert.equal(new Set(state.choices.map((c) => c.cardId)).size, 9)
  assert.ok(state.choices.every((c) => c.picked === false))
})

test('starting idle with empty/whitespace input chooses a configured prompt and prepares choices', () => {
  const result = start(developerDeck, idle(developerDeck), '   ', () => 0)
  assert.equal(result.success, true)
  assert.ok(result.success)
  const state = result.value
  assert.ok(state.status === 'choosing')
  assert.ok(developerDeck.prompts.includes(state.question))
  assert.equal(state.choices.length, 9)
})

test('the nine hidden choices are real, distinct card IDs from the deck', () => {
  const result = start(developerDeck, idle(developerDeck), 'A question', () => 0.9)
  assert.ok(result.success)
  const state = result.value
  assert.ok(state.status === 'choosing')
  const deckCardIds = new Set(developerDeck.cards.map((card) => card.id))
  for (const choice of state.choices) {
    assert.ok(deckCardIds.has(choice.cardId))
  }
})

test('setup does not mutate the authored deck', () => {
  const cardsBefore = JSON.stringify(developerDeck.cards)
  start(developerDeck, idle(developerDeck), 'A question', () => 0.3)
  assert.equal(JSON.stringify(developerDeck.cards), cardsBefore)
})

test('two sessions started independently do not share choice identity', () => {
  let counter = 0
  const rng = () => {
    counter += 1
    // deterministic but different sequences per session by using a shared mutable counter
    return (counter % 97) / 97
  }
  const sessionA = start(developerDeck, idle(developerDeck), 'Question A', rng)
  const sessionB = start(developerDeck, idle(developerDeck), 'Question B', rng)
  assert.ok(sessionA.success && sessionB.success)
  assert.ok(sessionA.success)
  assert.ok(sessionB.success)
  assert.notDeepEqual(sessionA.value, sessionB.value)
})

test('an invalid question consumes zero random draws and leaves idle', () => {
  const { wrapped, count } = countingRng(() => 0.5)
  const tooLong = 'a'.repeat(161)
  const result = start(developerDeck, idle(developerDeck), tooLong, wrapped)
  assert.deepEqual(result, { success: false, error: 'invalid-question' })
  assert.equal(count(), 0)
})

test('a repeated start outside idle consumes zero random draws and is a no-op', () => {
  const started = start(developerDeck, idle(developerDeck), 'First question', () => 0.5)
  assert.ok(started.success)
  const choosingState = started.value

  const { wrapped, count } = countingRng(() => 0.5)
  const second = start(developerDeck, choosingState, 'Second question', wrapped)
  assert.deepEqual(second, { success: true, value: choosingState })
  assert.equal(count(), 0)
})
