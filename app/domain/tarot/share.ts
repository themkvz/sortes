import type { InferOutput } from 'remix/data-schema'
import { enum_, literal, object, parseSafe, string, tuple } from 'remix/data-schema'

import { developerDeck } from './decks/developer.ts'
import { interpret, normalizeQuestion, type ReadingState } from './reading.ts'

export type SharedReading = Pick<
  Extract<ReadingState, { status: 'complete' }>,
  'question' | 'interpretation'
>

const TOKEN_MAX_LENGTH = 2048
const cardId = enum_(developerDeck.cards.map(({ id }) => id) as [string, ...string[]])
const question = string().refine((value) => {
  const result = normalizeQuestion(value)
  return result.success && result.value !== '' && result.value === value
}, 'Expected a canonical question')

const payloadSchema = object(
  {
    v: literal(1),
    d: literal('developer'),
    s: literal('three-card'),
    q: question,
    c: tuple([cardId, cardId, cardId]).refine(
      (value) => new Set(value).size === 3,
      'Expected distinct cards',
    ),
  },
  { unknownKeys: 'error' },
)

type Payload = InferOutput<typeof payloadSchema>
type DecodeResult =
  | { readonly success: true; readonly value: SharedReading }
  | { readonly success: false; readonly error: 'invalid-reading' }

const invalidReading: DecodeResult = { success: false, error: 'invalid-reading' }

export function encodeSharedReading(reading: SharedReading): string {
  const cardsByPosition = new Map(
    reading.interpretation.cards.map(({ positionId, cardId }) => [positionId, cardId]),
  )
  const contextCard = cardsByPosition.get('context')
  const problemCard = cardsByPosition.get('problem')
  const adviceCard = cardsByPosition.get('advice')
  if (contextCard === undefined || problemCard === undefined || adviceCard === undefined) {
    throw new Error('Completed reading is missing a position')
  }
  const payload: Payload = {
    v: 1,
    d: 'developer',
    s: 'three-card',
    q: reading.question,
    c: [contextCard, problemCard, adviceCard],
  }
  const bytes = new TextEncoder().encode(JSON.stringify(payload))
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeSharedReading(token: string): DecodeResult {
  if (
    token.length === 0 ||
    token.length > TOKEN_MAX_LENGTH ||
    !/^[A-Za-z0-9_-]+$/.test(token) ||
    token.length % 4 === 1
  ) {
    return invalidReading
  }

  let binary: string
  try {
    const base64 = token.replace(/-/g, '+').replace(/_/g, '/')
    binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4))
  } catch (error) {
    if (error instanceof DOMException && error.name === 'InvalidCharacterError')
      return invalidReading
    throw error
  }
  const canonicalToken = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  if (canonicalToken !== token) return invalidReading

  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  let json: string
  try {
    json = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch (error) {
    if (error instanceof TypeError) return invalidReading
    throw error
  }

  let input: unknown
  try {
    input = JSON.parse(json)
  } catch (error) {
    if (error instanceof SyntaxError) return invalidReading
    throw error
  }

  const parsed = parseSafe(payloadSchema, input)
  if (!parsed.success) return invalidReading

  const pairs = [
    { positionId: 'context', cardId: parsed.value.c[0] },
    { positionId: 'problem', cardId: parsed.value.c[1] },
    { positionId: 'advice', cardId: parsed.value.c[2] },
  ]
  return {
    success: true,
    value: {
      question: parsed.value.q,
      interpretation: interpret(developerDeck, { question: parsed.value.q, pairs }),
    },
  }
}
