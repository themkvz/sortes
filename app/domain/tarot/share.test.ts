import { expect } from 'remix/assert'
import { describe, test } from 'remix/test'

import { developerDeck } from './decks/developer.ts'
import { interpret } from './reading.ts'
import { decodeSharedReading, encodeSharedReading } from './share.ts'

const GOLDEN_TOKEN =
  'eyJ2IjoxLCJkIjoiZGV2ZWxvcGVyIiwicyI6InRocmVlLWNhcmQiLCJxIjoiU2hvdWxkIEkgcmV3cml0ZSBpdD8iLCJjIjpbImxlZ2FjeS1zeXN0ZW0iLCJpbmZpbml0ZS1yZWZhY3RvciIsIm12cCJdfQ'

function encodeJson(value: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(value))
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

describe('shared reading codec', () => {
  test('decodes the pinned V1 vector in fixed position order and preserves the live verdict', () => {
    const result = decodeSharedReading(GOLDEN_TOKEN)
    expect(result.success).toBe(true)
    if (!result.success) throw new Error('Expected valid shared reading')
    expect(result.value.question).toBe('Should I rewrite it?')
    expect(
      result.value.interpretation.cards.map(({ positionId, cardId }) => [positionId, cardId]),
    ).toEqual([
      ['context', 'legacy-system'],
      ['problem', 'infinite-refactor'],
      ['advice', 'mvp'],
    ])
    expect(result.value.interpretation.verdict).toBe(
      'The setup: old decisions are still doing useful work. The snag: the architecture keeps improving while the finish line moves. Your next move: cut one requirement and finish the remaining loop.',
    )
    expect(result.value.interpretation).toEqual(
      interpret(developerDeck, {
        question: 'Should I rewrite it?',
        pairs: [
          { positionId: 'context', cardId: 'legacy-system' },
          { positionId: 'problem', cardId: 'infinite-refactor' },
          { positionId: 'advice', cardId: 'mvp' },
        ],
      }),
    )
    expect(encodeSharedReading(result.value)).toBe(GOLDEN_TOKEN)
  })

  test('round-trips canonical Unicode and escaped text at the question limit', () => {
    const initial = decodeSharedReading(GOLDEN_TOKEN)
    if (!initial.success) throw new Error('Expected valid shared reading')
    const question = `${'🪄'.repeat(150)}"\\${'e\u0301'.repeat(8)}`
    const canonicalQuestion = question.normalize('NFC')
    expect([...canonicalQuestion].length).toBe(160)
    const token = encodeSharedReading({ ...initial.value, question: canonicalQuestion })
    const result = decodeSharedReading(token)
    expect(result.success).toBe(true)
    if (!result.success) throw new Error('Expected valid shared reading')
    expect(result.value.question).toBe(canonicalQuestion)
    expect([...result.value.question].length).toBe(160)
    expect(token.length <= 2048).toBe(true)
  })

  test('rejects malformed encodings, invalid UTF-8/JSON, and oversized tokens', () => {
    for (const token of ['', 'a', 'a+b', 'abc=', '***', 'x'.repeat(2049), 'wA']) {
      expect(decodeSharedReading(token)).toEqual({ success: false, error: 'invalid-reading' })
    }
    expect(decodeSharedReading(encodeJson('{'))).toEqual({
      success: false,
      error: 'invalid-reading',
    })
    expect(decodeSharedReading('eyJ2Ijox')).toEqual({ success: false, error: 'invalid-reading' })
  })

  test('rejects wrong fields, versions, questions, card IDs, and duplicate cards', () => {
    const payload = {
      v: 1,
      d: 'developer',
      s: 'three-card',
      q: 'A valid question',
      c: ['legacy-system', 'infinite-refactor', 'mvp'],
    }
    const invalid = [
      { ...payload, v: 2 },
      { ...payload, d: 'other' },
      { ...payload, s: 'single-card' },
      { ...payload, q: '  A valid question' },
      { ...payload, q: null },
      { ...payload, q: '\ud800' },
      { ...payload, q: '' },
      { ...payload, q: 'e\u0301' },
      { ...payload, q: 'x'.repeat(161) },
      { v: 1, d: 'developer', s: 'three-card', c: payload.c },
      { ...payload, c: ['legacy-system', 'infinite-refactor', 'unknown'] },
      { ...payload, c: ['legacy-system', 'legacy-system', 'mvp'] },
      { ...payload, c: ['legacy-system', 'mvp'] },
      { ...payload, c: ['legacy-system', 'infinite-refactor', 'mvp', 'merge-conflict'] },
      { ...payload, extra: true },
    ]
    for (const value of invalid) {
      expect(decodeSharedReading(encodeJson(value))).toEqual({
        success: false,
        error: 'invalid-reading',
      })
    }
  })
})
