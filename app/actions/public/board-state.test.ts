import { expect } from 'remix/assert'
import { test } from 'remix/test'

import { developerDeck } from '../../domain/tarot/decks/developer.ts'
import {
  choose,
  clearError,
  clearPending,
  initialBoard,
  markReady,
  nextChoice,
  place,
  restart,
  reveal,
  start,
} from './board-state.ts'

function startedBoard() {
  return start(markReady(initialBoard()), developerDeck, 'Should I ship?')
}

function readyBoard() {
  let board = startedBoard()
  board = place(board, developerDeck, 'context', 0)
  board = place(board, developerDeck, 'problem', 1)
  return place(board, developerDeck, 'advice', 2)
}

test('ignores start until the deck is ready', () => {
  const board = initialBoard()
  expect(board.status).toBe('Preparing the deck…')
  expect(start(board, developerDeck, 'Too early')).toBe(board)

  const ready = markReady(board)
  expect(ready.ready).toBe(true)
  expect(ready.status).toBe('The deck is ready.')
})

test('an invalid question sets an error that input can clear', () => {
  const board = start(markReady(initialBoard()), developerDeck, 'x'.repeat(161))
  expect(board.reading.status).toBe('idle')
  expect(board.error).toBe('Enter a valid question of up to 160 Unicode code points.')

  const cleared = clearError(board)
  expect(cleared.error).toBe('')
  expect(clearError(cleared)).toBe(cleared)
})

test('a valid start clears the error and ignores repeated starts', () => {
  const invalid = start(markReady(initialBoard()), developerDeck, 'x'.repeat(161))
  const board = start(invalid, developerDeck, 'Should I ship?')
  expect(board.error).toBe('')
  expect(board.reading.question).toBe('Should I ship?')
  expect(board.status).toBe('Choose a hidden card, then place it in a position.')
  expect(start(board, developerDeck, 'Again?')).toBe(board)
})

test('choose sets the pending card and clearPending resets it', () => {
  const chosen = choose(startedBoard(), 3)
  expect(chosen.pending).toBe(3)
  expect(chosen.status).toBe('Hidden card 4 selected.')

  const cleared = clearPending(chosen)
  expect(cleared.pending).toBe(null)
  expect(cleared.status).toBe('Selection cleared.')
  expect(clearPending(cleared)).toEqual(cleared)
})

test('choose ignores picked cards and states outside choosing', () => {
  const idle = markReady(initialBoard())
  expect(choose(idle, 0)).toBe(idle)

  const placed = place(startedBoard(), developerDeck, 'context', 0)
  expect(choose(placed, 0)).toBe(placed)
})

test('place uses and clears the pending card, and the next choice wraps to an unpicked card', () => {
  let board = place(choose(startedBoard(), 8), developerDeck, 'problem')
  expect(board.pending).toBe(null)
  expect(board.status).toBe('Problem card placed.')
  expect(nextChoice(board.reading, 8)).toBe(0)

  expect(place(board, developerDeck, 'problem', 1)).toBe(board)
  expect(place(board, developerDeck, 'context')).toBe(board)
  board = place(board, developerDeck, 'context', 1)
  expect(nextChoice(board.reading, 1)).toBe(2)
  board = place(board, developerDeck, 'advice', 2)
  expect(board.reading.status).toBe('ready')
  expect(board.status).toBe('All cards placed. Reveal them one at a time.')
  expect(nextChoice(board.reading, 2)).toBe(undefined)
})

test('reveal completes the reading and restart resets everything', () => {
  let board = reveal(readyBoard(), developerDeck, 'context')
  expect(board.status).toBe('Context card revealed.')
  expect(reveal(board, developerDeck, 'context')).toBe(board)
  board = reveal(board, developerDeck, 'problem')
  board = reveal(board, developerDeck, 'advice')
  expect(board.reading.status).toBe('complete')
  expect(board.status).toBe('Reading complete.')

  board = restart(board)
  expect(board.reading.status).toBe('idle')
  expect(board.pending).toBe(null)
  expect(board.error).toBe('')
  expect(board.status).toBe('Ask a question to begin.')
})
