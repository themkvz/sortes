import type { Deck } from '../../domain/tarot/deck.ts'
import type { PositionId, ReadingState } from '../../domain/tarot/reading.ts'
import * as reading from '../../domain/tarot/reading.ts'
import type { ReadingSnapshot } from '../../domain/tarot/snapshot.ts'

export interface BoardState {
  readonly reading: ReadingState
  readonly pending: number | null
  readonly error: string
  readonly status: string
  readonly ready: boolean
  /** The nine card IDs the reading started with; the reading state drops them once all are placed. */
  readonly choices: ReadonlyArray<string>
  /** Positions already revealed when the reading was restored; they render without effects. */
  readonly settled: ReadonlyArray<PositionId>
}

/** With a `restored` reading, the board starts from it on the server and in the browser alike. */
export function initialBoard(restored?: {
  snapshot: ReadingSnapshot
  reading: ReadingState
}): BoardState {
  return {
    reading: restored?.reading ?? reading.idle(),
    pending: null,
    error: '',
    status: 'Preparing the deck…',
    ready: false,
    choices: restored?.snapshot.choices ?? [],
    settled: restored
      ? Object.keys(restored.snapshot.placements).filter(
          (id) => restored.snapshot.placements[id].revealed,
        )
      : [],
  }
}

export function markReady(board: BoardState): BoardState {
  const status = board.reading.status === 'idle' ? 'The deck is ready.' : 'Reading restored.'
  return { ...board, ready: true, status }
}

export function start(board: BoardState, deck: Deck, draft: string): BoardState {
  if (!board.ready || board.reading.status !== 'idle') return board
  const result = reading.start(deck, board.reading, draft)
  if (!result.success) {
    return {
      ...board,
      error: `Enter a valid question of up to ${reading.QUESTION_MAX_CODE_POINTS} Unicode code points.`,
    }
  }
  return {
    ...board,
    reading: result.value,
    error: '',
    pending: null,
    status: 'Choose a hidden card, then place it in a position.',
    choices:
      result.value.status === 'choosing' ? result.value.choices.map(({ cardId }) => cardId) : [],
    settled: [],
  }
}

export function clearError(board: BoardState): BoardState {
  return board.error ? { ...board, error: '' } : board
}

export function choose(board: BoardState, index: number): BoardState {
  if (!reading.canPick(board.reading, index)) return board
  return { ...board, pending: index, status: `Hidden card ${index + 1} selected.` }
}

export function clearPending(board: BoardState): BoardState {
  return { ...board, pending: null, status: 'Selection cleared.' }
}

export function place(
  board: BoardState,
  deck: Deck,
  positionId: string,
  choiceIndex = board.pending,
): BoardState {
  if (choiceIndex === null) return board
  const next = reading.place(deck, board.reading, choiceIndex, positionId)
  if (next === board.reading) return board
  const status =
    next.status === 'ready'
      ? 'All cards placed. Reveal them one at a time.'
      : `${labelOf(deck, positionId)} card placed.`
  return { ...board, reading: next, pending: null, status }
}

/** The first unpicked choice after `from`, wrapping around, while cards are still being chosen. */
export function nextChoice(state: ReadingState, from: number): number | undefined {
  if (state.status !== 'choosing') return undefined
  const { choices } = state
  return Array.from(
    { length: choices.length },
    (_, offset) => (from + offset + 1) % choices.length,
  ).find((index) => !choices[index]?.picked)
}

export function reveal(board: BoardState, deck: Deck, positionId: string): BoardState {
  const next = reading.reveal(deck, board.reading, positionId)
  if (next === board.reading) return board
  const status =
    next.status === 'complete' ? 'Reading complete.' : `${labelOf(deck, positionId)} card revealed.`
  return { ...board, reading: next, status }
}

export function restart(board: BoardState): BoardState {
  return {
    ...board,
    reading: reading.idle(),
    pending: null,
    error: '',
    status: 'Ask a question to begin.',
    choices: [],
    settled: [],
  }
}

function labelOf(deck: Deck, positionId: string) {
  return deck.positions.find((position) => position.id === positionId)?.label
}
