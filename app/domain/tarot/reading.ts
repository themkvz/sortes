import { assert } from 'remix/assert'
import type { Schema } from 'remix/data-schema'
import { array, createSchema, fail, literal, object, parseSafe, string } from 'remix/data-schema'

import type { Card, Deck } from './deck.ts'

const QUESTION_MAX_CODE_POINTS = 160

export const QuestionSchema: Schema<unknown, string> = createSchema((value, context) => {
  if (typeof value !== 'string' || !value.isWellFormed()) {
    return fail('Expected a well-formed Unicode string', context.path)
  }

  const normalized = value.trim().normalize('NFC')
  if ([...normalized].length > QUESTION_MAX_CODE_POINTS) {
    return fail(`Expected at most ${QUESTION_MAX_CODE_POINTS} Unicode code points`, context.path)
  }

  return { value: normalized }
})

export type QuestionResult =
  | { readonly success: true; readonly value: string }
  | { readonly success: false; readonly error: 'invalid-question' }

export function normalizeQuestion(input: unknown): QuestionResult {
  const result = parseSafe(QuestionSchema, input)
  return result.success
    ? { success: true, value: result.value }
    : { success: false, error: 'invalid-question' }
}

export type PositionId = string

export interface Placement {
  readonly cardId: string
  readonly revealed: boolean
}

export type PlacementMap = Readonly<Record<PositionId, Placement>>

export interface Choice {
  readonly cardId: string
  readonly picked: boolean
}

export interface CompletedReading {
  readonly version: 1
  readonly deckId: string
  readonly question: string
  readonly spreadId: string
  readonly pairs: ReadonlyArray<{ readonly positionId: string; readonly cardId: string }>
}

export interface CardInterpretation {
  readonly positionId: string
  readonly cardId: string
  readonly cardName: string
  readonly shortDescription: string
  readonly meaning: string
}

export interface Interpretation {
  readonly cards: ReadonlyArray<CardInterpretation>
  readonly verdict: string
}

export type ReadingState =
  | { readonly status: 'idle'; readonly deckId: string; readonly question: '' }
  | {
      readonly status: 'choosing'
      readonly deckId: string
      readonly question: string
      readonly choices: ReadonlyArray<Choice>
      readonly placements: PlacementMap
    }
  | {
      readonly status: 'ready' | 'revealing'
      readonly deckId: string
      readonly question: string
      readonly placements: PlacementMap
    }
  | {
      readonly status: 'complete'
      readonly deckId: string
      readonly question: string
      readonly reading: CompletedReading
      readonly interpretation: Interpretation
    }

export function idle(deck: Deck): ReadingState {
  return { status: 'idle', deckId: deck.id, question: '' }
}

function shuffle(items: readonly string[], rng: () => number): string[] {
  const result = items.slice()
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const temp = result[i]
    result[i] = result[j]
    result[j] = temp
  }
  return result
}

export type StartResult =
  | { readonly success: true; readonly value: ReadingState }
  | { readonly success: false; readonly error: 'invalid-question' }

export function start(
  deck: Deck,
  state: ReadingState,
  question: unknown,
  rng: () => number = Math.random,
): StartResult {
  if (state.status !== 'idle') {
    return { success: true, value: state }
  }

  const questionResult = normalizeQuestion(question)
  if (!questionResult.success) {
    return questionResult
  }

  let finalQuestion = questionResult.value
  if (finalQuestion === '') {
    const promptIndex = Math.min(deck.prompts.length - 1, Math.floor(rng() * deck.prompts.length))
    finalQuestion = deck.prompts[promptIndex]
  }

  const shuffled = shuffle(
    deck.cards.map((card) => card.id),
    rng,
  )
  const choices: Choice[] = shuffled.slice(0, 9).map((cardId) => ({ cardId, picked: false }))

  return {
    success: true,
    value: {
      status: 'choosing',
      deckId: deck.id,
      question: finalQuestion,
      choices,
      placements: {},
    },
  }
}

export function place(
  deck: Deck,
  state: ReadingState,
  choiceIndex: number,
  positionId: PositionId,
): ReadingState {
  if (state.status !== 'choosing') {
    return state
  }
  if (!Number.isInteger(choiceIndex) || choiceIndex < 0 || choiceIndex >= state.choices.length) {
    return state
  }

  const choice = state.choices[choiceIndex]
  if (!choice || choice.picked) {
    return state
  }
  if (!deck.positions.some((position) => position.id === positionId)) {
    return state
  }
  if (positionId in state.placements) {
    return state
  }

  const nextChoices = state.choices.map((existing, index) =>
    index === choiceIndex ? { ...existing, picked: true } : existing,
  )
  const nextPlacements: Record<PositionId, Placement> = {
    ...state.placements,
    [positionId]: { cardId: choice.cardId, revealed: false },
  }

  if (Object.keys(nextPlacements).length === deck.positions.length) {
    return {
      status: 'ready',
      deckId: state.deckId,
      question: state.question,
      placements: nextPlacements,
    }
  }

  return {
    status: 'choosing',
    deckId: state.deckId,
    question: state.question,
    choices: nextChoices,
    placements: nextPlacements,
  }
}

export function reveal(deck: Deck, state: ReadingState, positionId: PositionId): ReadingState {
  if (state.status !== 'ready' && state.status !== 'revealing') {
    return state
  }

  const placement = state.placements[positionId]
  if (!placement || placement.revealed) {
    return state
  }

  const nextPlacements: Record<PositionId, Placement> = {
    ...state.placements,
    [positionId]: { ...placement, revealed: true },
  }

  const revealedCount = Object.values(nextPlacements).filter((entry) => entry.revealed).length

  if (revealedCount === deck.positions.length) {
    const pairs = deck.positions.map((position) => ({
      positionId: position.id,
      cardId: nextPlacements[position.id].cardId,
    }))
    const reading: CompletedReading = {
      version: 1,
      deckId: deck.id,
      question: state.question,
      spreadId: deck.spreadId,
      pairs,
    }

    return {
      status: 'complete',
      deckId: state.deckId,
      question: state.question,
      reading,
      interpretation: computeInterpretation(deck, reading),
    }
  }

  return {
    status: 'revealing',
    deckId: state.deckId,
    question: state.question,
    placements: nextPlacements,
  }
}

export function reset(state: ReadingState): ReadingState {
  return { status: 'idle', deckId: state.deckId, question: '' }
}

const CompletedReadingShape = object({
  version: literal(1),
  deckId: string(),
  question: string(),
  spreadId: string(),
  pairs: array(object({ positionId: string(), cardId: string() })),
})

export type InterpretResult =
  | { readonly success: true; readonly value: Interpretation }
  | { readonly success: false; readonly error: 'invalid-reading' }

export function interpret(deck: Deck, input: unknown): InterpretResult {
  const parsed = parseSafe(CompletedReadingShape, input)
  if (!parsed.success) {
    return { success: false, error: 'invalid-reading' }
  }

  const record = parsed.value

  if (record.deckId !== deck.id || record.spreadId !== deck.spreadId) {
    return { success: false, error: 'invalid-reading' }
  }
  if (record.pairs.length !== deck.positions.length) {
    return { success: false, error: 'invalid-reading' }
  }

  const questionResult = normalizeQuestion(record.question)
  if (!questionResult.success || questionResult.value === '') {
    return { success: false, error: 'invalid-reading' }
  }

  const positionIds = new Set(deck.positions.map((position) => position.id))
  const cardIds = new Set(deck.cards.map((card) => card.id))
  const seenPositions = new Set<string>()
  const seenCards = new Set<string>()
  const cardByPosition = new Map<string, string>()

  for (const pair of record.pairs) {
    if (!positionIds.has(pair.positionId) || !cardIds.has(pair.cardId)) {
      return { success: false, error: 'invalid-reading' }
    }
    if (seenPositions.has(pair.positionId) || seenCards.has(pair.cardId)) {
      return { success: false, error: 'invalid-reading' }
    }
    seenPositions.add(pair.positionId)
    seenCards.add(pair.cardId)
    cardByPosition.set(pair.positionId, pair.cardId)
  }

  const pairs = deck.positions.map((position) => {
    const cardId = cardByPosition.get(position.id)
    assert(cardId !== undefined, `Missing card for position ${position.id}`)
    return { positionId: position.id, cardId }
  })
  const reading: CompletedReading = {
    version: 1,
    deckId: deck.id,
    question: questionResult.value,
    spreadId: deck.spreadId,
    pairs,
  }

  return { success: true, value: computeInterpretation(deck, reading) }
}

function fnv1aHash(input: string): number {
  const bytes = new TextEncoder().encode(input)
  let hash = 2166136261
  for (const byte of bytes) {
    hash = Math.imul(hash ^ byte, 16777619) >>> 0
  }
  return hash
}

function computeInterpretation(deck: Deck, reading: CompletedReading): Interpretation {
  const cardsById = new Map<string, Card>(deck.cards.map((card) => [card.id, card]))
  const fragmentsByPosition = new Map<string, string>()

  const cards: CardInterpretation[] = reading.pairs.map((pair) => {
    const card = cardsById.get(pair.cardId)
    assert(card !== undefined, `Missing card ${pair.cardId}`)
    const meaning = card.meanings[pair.positionId]
    assert(meaning !== undefined, `Missing meaning for position ${pair.positionId}`)
    fragmentsByPosition.set(pair.positionId, meaning.summaryFragment)
    return {
      positionId: pair.positionId,
      cardId: pair.cardId,
      cardName: card.name,
      shortDescription: card.shortDescription,
      meaning: meaning.text,
    }
  })

  const seed = JSON.stringify([
    reading.version,
    reading.deckId,
    reading.spreadId,
    reading.question,
    reading.pairs.map((pair) => [pair.positionId, pair.cardId]),
  ])

  const templateIndex = fnv1aHash(seed) % deck.templates.length
  const template = deck.templates[templateIndex]
  const verdict = template.replace(
    /\{([^{}]*)\}/g,
    (_match, token: string) => fragmentsByPosition.get(token) ?? '',
  )

  return { cards, verdict }
}
