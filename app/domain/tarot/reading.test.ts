import * as assert from 'remix/assert'
import { expect } from 'remix/assert'
import { describe, test } from 'remix/test'

import type { Deck } from './deck.ts'
import { developerDeck } from './decks/developer.ts'
import {
  type Interpretation,
  idle,
  normalizeQuestion,
  place,
  type ReadingState,
  reveal,
  start,
} from './reading.ts'

// Fisher-Yates keeps the original order when every draw selects the current index.
const keepOrder = () => 0.999

function countingRng(rng: () => number) {
  let calls = 0
  const wrapped = () => {
    calls++
    return rng()
  }
  return { wrapped, count: () => calls }
}

function started(deck: Deck, question: string, rng: () => number) {
  const result = start(deck, idle(), question, rng)
  if (!result.success) throw new Error('Expected successful start')
  return result.value
}

function choosingState(rng: () => number = () => 0.42) {
  return started(developerDeck, 'A question', rng)
}

function choicesOf(state: ReadingState) {
  if (state.status !== 'choosing') throw new Error('Expected choosing status')
  return state.choices
}

function readyState() {
  let state = choosingState(() => 0.1)
  state = place(developerDeck, state, 0, 'context')
  state = place(developerDeck, state, 1, 'problem')
  state = place(developerDeck, state, 2, 'advice')
  expect(state.status).toBe('ready')
  return state
}

function revealAll(state: ReadingState, order = ['context', 'problem', 'advice']) {
  return order.reduce((current, positionId) => reveal(developerDeck, current, positionId), state)
}

describe('normalizeQuestion', () => {
  test('trims and NFC-normalizes while preserving interior whitespace/case/punctuation', () => {
    const result = normalizeQuestion('  Should I  rewrite it?  ')
    if (!result.success) throw new Error('Expected successful normalization')
    expect(result.value).toBe('Should I  rewrite it?')
  })

  test('composed and decomposed Unicode spellings normalize identically', () => {
    const composedInput = 'é'
    const decomposedInput = 'é'
    expect(composedInput).not.toBe(decomposedInput)

    const composed = normalizeQuestion(composedInput)
    const decomposed = normalizeQuestion(decomposedInput)
    if (!composed.success) throw new Error('Expected composed input to normalize')
    if (!decomposed.success) throw new Error('Expected decomposed input to normalize')
    expect(composed.value).toBe(decomposed.value)
  })

  test('accepts exactly 160 normalized code points', () => {
    expect(normalizeQuestion('a'.repeat(160)).success).toBe(true)
  })

  test('rejects 161 normalized code points', () => {
    expect(normalizeQuestion('a'.repeat(161))).toEqual({
      success: false,
      error: 'invalid-question',
    })
  })

  test('counts supplementary-plane characters as one code point each', () => {
    const emoji = '\u{1F600}'
    const input = emoji.repeat(160)
    expect([...input].length).toBe(160)
    expect(normalizeQuestion(input).success).toBe(true)
    expect(normalizeQuestion(emoji.repeat(161))).toEqual({
      success: false,
      error: 'invalid-question',
    })
  })

  test('rejects non-string values', () => {
    for (const value of [42, null, undefined, {}, [], true]) {
      expect(normalizeQuestion(value)).toEqual({ success: false, error: 'invalid-question' })
    }
  })

  test('rejects ill-formed Unicode (unpaired surrogate)', () => {
    expect(normalizeQuestion('a\uD800b')).toEqual({ success: false, error: 'invalid-question' })
  })

  test('accepts empty and whitespace-only input as the empty string', () => {
    expect(normalizeQuestion('')).toEqual({ success: true, value: '' })
    expect(normalizeQuestion('   ')).toEqual({ success: true, value: '' })
  })
})

describe('start', () => {
  test('a new reading is idle', () => {
    expect(idle()).toEqual({ status: 'idle', question: '' })
  })

  test('starting with a manual question stores it and prepares nine hidden choices', () => {
    const result = start(developerDeck, idle(), 'Should I merge this PR?', () => 0.5)
    if (!result.success) throw new Error('Expected successful start')
    const state = result.value
    if (state.status !== 'choosing') throw new Error('Expected choosing status')
    expect(state.question).toBe('Should I merge this PR?')
    expect(state.choices.length).toBe(9)
    expect(new Set(state.choices.map((c) => c.cardId)).size).toBe(9)
    expect(state.choices.every((c) => c.picked === false)).toBeTruthy()
  })

  test('starting with empty/whitespace input chooses a configured prompt and prepares choices', () => {
    const state = started(developerDeck, '   ', () => 0)
    if (state.status !== 'choosing') throw new Error('Expected choosing status')
    expect(developerDeck.prompts.includes(state.question)).toBeTruthy()
    expect(state.choices.length).toBe(9)
  })

  test('the nine hidden choices are real, distinct card IDs from the deck', () => {
    const deckCardIds = new Set(developerDeck.cards.map((card) => card.id))
    for (const choice of choicesOf(choosingState(() => 0.9))) {
      expect(deckCardIds.has(choice.cardId)).toBeTruthy()
    }
  })

  test('setup does not mutate the authored deck', () => {
    const cardsBefore = JSON.stringify(developerDeck.cards)
    choosingState(() => 0.3)
    expect(JSON.stringify(developerDeck.cards)).toBe(cardsBefore)
  })

  test('independent readings have different choices with a shared counting RNG', () => {
    let counter = 0
    const rng = () => {
      counter += 1
      return (counter % 97) / 97
    }
    const readingA = choosingState(rng)
    const readingB = choosingState(rng)
    expect(choicesOf(readingA)).not.toEqual(choicesOf(readingB))
  })

  test('an invalid question consumes zero random draws and leaves idle', () => {
    const { wrapped, count } = countingRng(() => 0.5)
    expect(start(developerDeck, idle(), 'a'.repeat(161), wrapped)).toEqual({
      success: false,
      error: 'invalid-question',
    })
    expect(count()).toBe(0)
  })

  test('a repeated start outside idle consumes zero random draws and is a no-op', () => {
    const { wrapped, count } = countingRng(() => 0.5)
    const choosing = started(developerDeck, 'First question', wrapped)
    const drawsAfterFirstStart = count()

    const result = start(developerDeck, choosing, 'Second question', wrapped)
    expect(count()).toBe(drawsAfterFirstStart)
    if (!result.success) throw new Error('Expected successful start')
    expect(result.value).toBe(choosing)
  })
})

describe('place', () => {
  test('cards can be placed into positions in arbitrary order', () => {
    const initial = choosingState()
    const choices = choicesOf(initial)

    let state = place(developerDeck, initial, 0, 'advice')
    if (state.status !== 'choosing') throw new Error('Expected choosing status')
    expect(state.placements.advice?.cardId).toBe(choices[0].cardId)

    state = place(developerDeck, state, 1, 'context')
    if (state.status !== 'choosing') throw new Error('Expected choosing status')
    expect(state.placements.context?.cardId).toBe(choices[1].cardId)
  })

  test('placed cards remain face-down', () => {
    const state = place(developerDeck, choosingState(), 0, 'context')
    if (state.status !== 'choosing') throw new Error('Expected choosing status')
    expect(state.placements.context?.revealed).toBe(false)
  })

  test('an occupied position cannot be overwritten', () => {
    const placedOnce = place(developerDeck, choosingState(), 0, 'context')
    expect(place(developerDeck, placedOnce, 1, 'context')).toBe(placedOnce)
  })

  test('an already-picked card cannot be picked again', () => {
    const placedOnce = place(developerDeck, choosingState(), 0, 'context')
    expect(place(developerDeck, placedOnce, 0, 'problem')).toBe(placedOnce)
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
    const state = idle()
    expect(place(developerDeck, state, 0, 'context')).toBe(state)
  })

  test('exactly three successful placements enter ready with face-down cards', () => {
    const state = readyState()
    if (state.status !== 'ready') throw new Error('Expected ready status')
    expect(Object.keys(state.placements).length).toBe(3)
    expect(Object.values(state.placements).every((p) => p.revealed === false)).toBeTruthy()

    expect(place(developerDeck, state, 3, 'context')).toBe(state)
  })
})

describe('reveal', () => {
  test('a premature reveal before all positions are filled is a no-op', () => {
    let choosing = choosingState(() => 0.1)
    choosing = place(developerDeck, choosing, 0, 'context')
    choosing = place(developerDeck, choosing, 1, 'problem')
    expect(reveal(developerDeck, choosing, 'context')).toBe(choosing)
  })

  test('reveal before ready (idle) is a no-op', () => {
    const state = idle()
    expect(reveal(developerDeck, state, 'context')).toBe(state)
  })

  test('an unknown position reveal is a no-op', () => {
    const ready = readyState()
    expect(reveal(developerDeck, ready, 'unknown-position')).toBe(ready)
  })

  test('one reveal marks only that card revealed and keeps the verdict unavailable', () => {
    const state = reveal(developerDeck, readyState(), 'context')
    if (state.status !== 'revealing') throw new Error('Expected revealing status')
    expect(state.placements.context?.revealed).toBe(true)
    expect(state.placements.problem?.revealed).toBe(false)
    expect(state.placements.advice?.revealed).toBe(false)
    expect(!('interpretation' in state)).toBeTruthy()
  })

  test('a repeated reveal of the same position is a no-op', () => {
    const revealing = reveal(developerDeck, readyState(), 'context')
    expect(reveal(developerDeck, revealing, 'context')).toBe(revealing)
  })

  test('the third reveal produces the completed reading and interpretation immediately', () => {
    const state = revealAll(readyState())
    if (state.status !== 'complete') throw new Error('Expected complete status')
    expect(state.interpretation.cards.length).toBe(3)
    expect(state.interpretation.verdict.length > 0).toBeTruthy()
  })

  test('reveal after completion is a no-op', () => {
    const complete = revealAll(readyState())
    expect(reveal(developerDeck, complete, 'advice')).toBe(complete)
  })

  test('all reveal orders produce the same final reading and interpretation', () => {
    const orders = [
      ['context', 'problem', 'advice'],
      ['advice', 'problem', 'context'],
      ['problem', 'advice', 'context'],
    ]

    const results = orders.map((order) => {
      const state = revealAll(readyState(), order)
      expect(state.status).toBe('complete')
      return state
    })

    for (const result of results.slice(1)) {
      expect(result).toEqual(results[0])
    }
  })
})

describe('restart', () => {
  test('a completed reading ignores start, and a fresh idle state starts a new reading', () => {
    const complete = revealAll(readyState())
    const repeated = start(developerDeck, complete, 'Again?')
    if (!repeated.success) throw new Error('Expected successful start')
    expect(repeated.value).toBe(complete)

    expect(started(developerDeck, 'Again?', () => 0.5).status).toBe('choosing')
  })
})

describe('verdict', () => {
  const GOLDEN_QUESTION = 'Should I rewrite it?'
  const GOLDEN_PAIRS = {
    context: 'legacy-system',
    problem: 'infinite-refactor',
    advice: 'mvp',
  }

  const EXPECTED_VERDICT =
    'The setup: old decisions are still doing useful work. The snag: the code keeps getting cleaner while the release keeps slipping. Your next move: cut one requirement and finish the remaining loop.'

  // A deck holding only the paired cards, in placement order, makes the hidden choices known.
  function interpretationFor(
    question: string,
    pairs: Record<string, string>,
    revealOrder = Object.keys(pairs),
  ): Interpretation {
    const positionIds = Object.keys(pairs)
    const cards = positionIds.map((positionId) => {
      const card = developerDeck.cards.find((candidate) => candidate.id === pairs[positionId])
      if (!card) throw new Error(`Unknown card ${pairs[positionId]}`)
      return card
    })
    const deck = { ...developerDeck, cards }
    let state = started(deck, question, keepOrder)
    positionIds.forEach((positionId, index) => {
      state = place(deck, state, index, positionId)
    })
    for (const positionId of revealOrder) state = reveal(deck, state, positionId)
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
    expect(mvpCard.meaning).toBe('A small thing that works has met real users.')
  })

  test('both templates compose without leftover placeholders or doubled punctuation', () => {
    for (const prefix of ['The setup:', 'The cards show that']) {
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
})

describe('generic deck', () => {
  function meaning(fragment: string) {
    return {
      summaryFragment: fragment,
      text: `${fragment.charAt(0).toUpperCase()}${fragment.slice(1)}.`,
    }
  }

  // A deck with renamed positions, card IDs, and labels, proving the engine has no
  // branch depending on the developer deck's specific names or English labels.
  const renamedDeck: Deck = {
    id: 'astro-deck',
    name: 'Astro Deck',
    positions: [
      { id: 'yesterday', label: 'Hier' },
      { id: 'today', label: "Aujourd'hui" },
      { id: 'tomorrow', label: 'Demain' },
    ],
    cards: Array.from({ length: 16 }, (_, index) => ({
      id: `orb-${index}`,
      name: `Orb ${index}`,
      shortDescription: `A glowing orb numbered ${index}.`,
      meanings: {
        yesterday: meaning(`orb ${index} remembers yesterday`),
        today: meaning(`orb ${index} glows today`),
        tomorrow: meaning(`orb ${index} predicts tomorrow`),
      },
    })),
    prompts: ['What does the orb say?'],
    templates: ['Then: {yesterday}. Now: {today}. Next: {tomorrow}.'],
  }

  test('a full start/place/reveal sequence works generically on a renamed deck', () => {
    let state = started(renamedDeck, 'Will it glow?', () => 0.55)
    expect(choicesOf(state).length).toBe(9)

    state = place(renamedDeck, state, 0, 'tomorrow')
    state = place(renamedDeck, state, 1, 'yesterday')
    state = place(renamedDeck, state, 2, 'today')
    expect(state.status).toBe('ready')

    state = reveal(renamedDeck, state, 'yesterday')
    expect(state.status).toBe('revealing')
    state = reveal(renamedDeck, state, 'today')
    state = reveal(renamedDeck, state, 'tomorrow')
    if (state.status !== 'complete') throw new Error('Expected complete state')

    expect(state.interpretation.cards.map((card) => card.positionId)).toEqual([
      'yesterday',
      'today',
      'tomorrow',
    ])
    expect(state.interpretation.verdict).not.toMatch(/\{[^}]*\}/)
  })
})
