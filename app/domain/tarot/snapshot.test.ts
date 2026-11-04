import { expect } from 'remix/assert'
import { describe, test } from 'remix/test'

import { developerDeck } from './decks/developer.ts'
import { idle, place, type ReadingState, reveal, start } from './reading.ts'
import { fromSnapshot, type ReadingSnapshot, toSnapshot } from './snapshot.ts'

const [context, problem, advice] = developerDeck.positions.map(({ id }) => id)

function begin(question = 'Should I ship it?') {
  const result = start(developerDeck, idle(), question, () => 0.42)
  if (!result.success || result.value.status !== 'choosing') throw new Error('Expected a start')
  return { state: result.value, choices: result.value.choices.map(({ cardId }) => cardId) }
}

function sealed(state: ReadingState, choices: readonly string[]): ReadingSnapshot {
  const snapshot = toSnapshot(state, choices)
  if (!snapshot) throw new Error('Expected a snapshot')
  return snapshot
}

function stages() {
  const { state: choosing, choices } = begin()
  const onePlaced = place(developerDeck, choosing, 4, problem)
  let ready = place(developerDeck, onePlaced, 7, advice)
  ready = place(developerDeck, ready, 1, context)
  const revealing = reveal(developerDeck, ready, advice)
  const complete = reveal(developerDeck, reveal(developerDeck, revealing, context), problem)
  return { choices, choosing, onePlaced, ready, revealing, complete }
}

function restored(input: unknown) {
  const result = fromSnapshot(developerDeck, input)
  if (!result.success) throw new Error('Expected a valid snapshot')
  return result.value
}

describe('reading snapshot round trip', () => {
  test('restores choosing, ready, revealing and complete states exactly', () => {
    const { choices, ...states } = stages()
    for (const state of Object.values(states)) {
      const value = restored(sealed(state, choices))
      expect(value.reading).toEqual(state)
      expect(value.snapshot.choices).toEqual(choices)
    }
  })

  test('a restored reading finishes with the same verdict as without the reload', () => {
    const { choices, onePlaced, complete } = stages()
    let reading = restored(sealed(onePlaced, choices)).reading
    reading = place(developerDeck, reading, 7, advice)
    reading = place(developerDeck, reading, 1, context)
    for (const positionId of [advice, context, problem]) {
      reading = reveal(developerDeck, reading, positionId)
    }
    expect(reading).toEqual(complete)
  })

  test('records choices, picks and reveals without the internal state shape', () => {
    const { choices, revealing } = stages()
    expect(toSnapshot(revealing, choices)).toEqual({
      v: 1,
      q: 'Should I ship it?',
      choices,
      picked: [1, 4, 7],
      placements: {
        problem: { choice: 4, revealed: false },
        advice: { choice: 7, revealed: true },
        context: { choice: 1, revealed: false },
      },
    })
    expect(toSnapshot(idle(), choices)).toBe(undefined)
  })

  test('restoring never consumes randomness', () => {
    const { choices, choosing } = stages()
    const original = Math.random
    let calls = 0
    Math.random = () => {
      calls++
      return original()
    }
    try {
      restored(sealed(choosing, choices))
    } finally {
      Math.random = original
    }
    expect(calls).toBe(0)
  })
})

describe('reading snapshot rejection', () => {
  const { choices, onePlaced, ready, revealing } = stages()
  const base = sealed(revealing, choices)
  const rejected = (input: unknown) => {
    expect(fromSnapshot(developerDeck, input)).toEqual({
      success: false,
      error: 'invalid-snapshot',
    })
  }

  test('rejects repeated, unknown and miscounted choices', () => {
    rejected({ ...base, choices: [choices[1], ...choices.slice(1)] })
    rejected({ ...base, choices: ['not-a-card', ...choices.slice(1)] })
    rejected({ ...base, choices: choices.slice(0, 8) })
    rejected({ ...base, choices: [...choices, developerDeck.cards[15].id] })
  })

  test('rejects picks that do not match placements', () => {
    const one = sealed(onePlaced, choices)
    rejected({ ...one, picked: [4, 5] })
    rejected({ ...one, picked: [] })
    rejected({ ...one, placements: { problem: { choice: 99, revealed: false } } })
    rejected({
      ...one,
      picked: [4, 4],
      placements: {
        problem: { choice: 4, revealed: false },
        advice: { choice: 4, revealed: false },
      },
    })
  })

  test('rejects reveals before all three placements', () => {
    const one = sealed(onePlaced, choices)
    rejected({ ...one, placements: { problem: { choice: 4, revealed: true } } })
  })

  test('rejects unknown positions and extra fields', () => {
    const readySnapshot = sealed(ready, choices)
    rejected({
      ...readySnapshot,
      placements: { ...readySnapshot.placements, future: { choice: 0, revealed: false } },
    })
    rejected({ ...base, extra: true })
    rejected({
      ...base,
      placements: { ...base.placements, advice: { choice: 7, revealed: true, cardId: 'mvp' } },
    })
  })

  test('rejects non-canonical or empty questions', () => {
    rejected({ ...base, q: '  Should I ship it?  ' })
    rejected({ ...base, q: '' })
    rejected({ ...base, q: 'x'.repeat(161) })
    rejected({ ...base, q: 42 })
  })

  test('rejects unsupported versions, a stray seal time and non-objects', () => {
    rejected({ ...base, v: 2 })
    // The server keeps the seal time outside the snapshot, in its sealed envelope.
    rejected({ ...base, sealedAt: 1_767_225_600_000 })
    rejected(null)
    rejected([])
    rejected('snapshot')
  })
})
