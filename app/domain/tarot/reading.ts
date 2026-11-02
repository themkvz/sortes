import { assert } from 'remix/assert'

import type { Deck } from './deck.ts'

export const QUESTION_MAX_CODE_POINTS = 160
export const CHOICE_COUNT = 9

export type QuestionResult =
  | { readonly success: true; readonly value: string }
  | { readonly success: false; readonly error: 'invalid-question' }

export function normalizeQuestion(input: unknown): QuestionResult {
  if (typeof input !== 'string' || !input.isWellFormed()) {
    return { success: false, error: 'invalid-question' }
  }
  const value = input.trim().normalize('NFC')
  if ([...value].length > QUESTION_MAX_CODE_POINTS) {
    return { success: false, error: 'invalid-question' }
  }
  return { success: true, value }
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
  readonly question: string
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
  | { readonly status: 'idle'; readonly question: '' }
  | {
      readonly status: 'choosing'
      readonly question: string
      readonly choices: ReadonlyArray<Choice>
      readonly placements: PlacementMap
    }
  | {
      readonly status: 'ready' | 'revealing'
      readonly question: string
      readonly placements: PlacementMap
    }
  | {
      readonly status: 'complete'
      readonly question: string
      readonly interpretation: Interpretation
    }

export function idle(): ReadingState {
  return { status: 'idle', question: '' }
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
  const choices: Choice[] = shuffled
    .slice(0, CHOICE_COUNT)
    .map((cardId) => ({ cardId, picked: false }))

  return {
    success: true,
    value: {
      status: 'choosing',
      question: finalQuestion,
      choices,
      placements: {},
    },
  }
}

export function canPick(state: ReadingState, choiceIndex: number): boolean {
  if (state.status !== 'choosing') return false
  const choice = state.choices[choiceIndex]
  return choice !== undefined && !choice.picked
}

export function canPlace(state: ReadingState, positionId: PositionId): boolean {
  return state.status === 'choosing' && !(positionId in state.placements)
}

export function place(
  deck: Deck,
  state: ReadingState,
  choiceIndex: number,
  positionId: PositionId,
): ReadingState {
  if (
    state.status !== 'choosing' ||
    !canPick(state, choiceIndex) ||
    !canPlace(state, positionId) ||
    !deck.positions.some((position) => position.id === positionId)
  ) {
    return state
  }
  const choice = state.choices[choiceIndex]

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
      question: state.question,
      placements: nextPlacements,
    }
  }

  return {
    status: 'choosing',
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
    return {
      status: 'complete',
      question: state.question,
      interpretation: interpret(deck, { question: state.question, pairs }),
    }
  }

  return {
    status: 'revealing',
    question: state.question,
    placements: nextPlacements,
  }
}

function fnv1aHash(input: string): number {
  const bytes = new TextEncoder().encode(input)
  let hash = 2166136261
  for (const byte of bytes) {
    hash = Math.imul(hash ^ byte, 16777619) >>> 0
  }
  return hash
}

function findMeaning(deck: Deck, positionId: PositionId, cardId: string) {
  const card = deck.cards.find((item) => item.id === cardId)
  assert(card !== undefined, `Missing card ${cardId}`)
  const meaning = card.meanings[positionId]
  assert(meaning !== undefined, `Missing meaning for position ${positionId}`)
  return { card, meaning }
}

export function interpretCard(
  deck: Deck,
  positionId: PositionId,
  cardId: string,
): CardInterpretation {
  const { card, meaning } = findMeaning(deck, positionId, cardId)
  return {
    positionId,
    cardId,
    cardName: card.name,
    shortDescription: card.shortDescription,
    meaning: meaning.text,
  }
}

export function interpret(deck: Deck, reading: CompletedReading): Interpretation {
  const cards = reading.pairs.map((pair) => interpretCard(deck, pair.positionId, pair.cardId))
  const fragmentsByPosition = new Map<string, string>(
    reading.pairs.map((pair) => [
      pair.positionId,
      findMeaning(deck, pair.positionId, pair.cardId).meaning.summaryFragment,
    ]),
  )

  const seed = JSON.stringify([
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
