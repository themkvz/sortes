import type { InferOutput } from 'remix/data-schema'
import {
  array,
  boolean,
  enum_,
  literal,
  number,
  object,
  parseSafe,
  record,
  string,
} from 'remix/data-schema'

import type { Deck } from './deck.ts'
import {
  CHOICE_COUNT,
  idle,
  normalizeQuestion,
  type Placement,
  type PositionId,
  place,
  type ReadingState,
  reveal,
  start,
} from './reading.ts'

function snapshotSchema(deck: Deck) {
  const cardId = enum_(deck.cards.map(({ id }) => id) as [string, ...string[]])
  return object(
    {
      v: literal(1),
      q: string().refine((value) => {
        const result = normalizeQuestion(value)
        return result.success && result.value !== '' && result.value === value
      }, 'Expected a canonical question'),
      choices: array(cardId).refine(
        (ids) => ids.length === CHOICE_COUNT && new Set(ids).size === CHOICE_COUNT,
        'Expected distinct choices',
      ),
      picked: array(number()),
      placements: record(
        string(),
        object({ choice: number(), revealed: boolean() }, { unknownKeys: 'error' }),
      ),
    },
    { unknownKeys: 'error' },
  )
}

/** A saved reading: the nine choices by card ID, and placements by choice index. */
export type ReadingSnapshot = InferOutput<ReturnType<typeof snapshotSchema>>

export type SnapshotResult =
  | {
      readonly success: true
      readonly value: { readonly snapshot: ReadingSnapshot; readonly reading: ReadingState }
    }
  | { readonly success: false; readonly error: 'invalid-snapshot' }

const invalidSnapshot: SnapshotResult = { success: false, error: 'invalid-snapshot' }

/**
 * `choices` are the nine card IDs the reading started with; the reading state drops them once
 * all cards are placed, so the caller keeps them. Returns `undefined` before a reading starts.
 */
export function toSnapshot(
  state: ReadingState,
  choices: readonly string[],
): ReadingSnapshot | undefined {
  if (state.status === 'idle') return undefined
  const entries: ReadonlyArray<readonly [PositionId, Placement]> =
    state.status === 'complete'
      ? state.interpretation.cards.map(({ positionId, cardId }) => [
          positionId,
          { cardId, revealed: true },
        ])
      : Object.entries(state.placements)
  const placements = Object.fromEntries(
    entries.map(([positionId, { cardId, revealed }]) => [
      positionId,
      { choice: choices.indexOf(cardId), revealed },
    ]),
  )
  const picked = Object.values(placements)
    .map(({ choice }) => choice)
    .sort((a, b) => a - b)
  return { v: 1, q: state.question, choices: [...choices], picked, placements }
}

/**
 * Rebuilds a reading through the engine's own transitions, so a snapshot the rules could not
 * have produced is rejected rather than trusted.
 */
export function fromSnapshot(deck: Deck, input: unknown): SnapshotResult {
  const parsed = parseSafe(snapshotSchema(deck), input)
  if (!parsed.success) return invalidSnapshot
  const snapshot = parsed.value

  // The question is canonical and nonempty, so `start` draws no surprise prompt from the RNG.
  const started = start(deck, idle(), snapshot.q, Math.random, snapshot.choices)
  if (!started.success) return invalidSnapshot
  let reading = started.value

  for (const position of deck.positions) {
    const placement = snapshot.placements[position.id]
    if (!placement) continue
    const next = place(deck, reading, placement.choice, position.id)
    if (next === reading) return invalidSnapshot
    reading = next
  }
  for (const position of deck.positions) {
    if (!snapshot.placements[position.id]?.revealed) continue
    const next = reveal(deck, reading, position.id)
    if (next === reading) return invalidSnapshot
    reading = next
  }

  // Unknown positions are never placed, and stray picks never match, so both fail here.
  const rebuilt = toSnapshot(reading, snapshot.choices)
  if (
    !rebuilt ||
    Object.keys(rebuilt.placements).length !== Object.keys(snapshot.placements).length ||
    rebuilt.picked.join() !== snapshot.picked.join()
  ) {
    return invalidSnapshot
  }

  return { success: true, value: { snapshot, reading } }
}
