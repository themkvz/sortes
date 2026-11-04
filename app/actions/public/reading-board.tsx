import { clientEntry, type Handle, on, ref } from 'remix/component'

import { developerDeck } from '../../domain/tarot/decks/developer.ts'
import { canPick, canPlace } from '../../domain/tarot/reading.ts'
import { fromSnapshot, type ReadingSnapshot, toSnapshot } from '../../domain/tarot/snapshot.ts'
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
import { canStartDrag, startCardDrag } from './drag-gesture.ts'
import { HiddenDeck } from './hidden-deck.tsx'
import { Icon } from './icons.tsx'
import { ctaMagicStyle } from './magic.styles.ts'
import * as readingStyles from './reading.styles.ts'
import * as boardStyles from './reading-board.styles.ts'
import { ReadingResult } from './reading-result.tsx'
import { ReadingSpread } from './reading-spread.tsx'
import { forgetReading, saveReading } from './saved-reading.ts'
import { ShareReading } from './share-reading.tsx'
import { SiteHeader } from './site-header.tsx'

/** `restored` is a saved reading the server opened; the board rebuilds it through the rules. */
export const ReadingBoard = clientEntry(
  import.meta.url,
  function ReadingBoard(handle: Handle<{ restored?: ReadingSnapshot }>) {
    const restored = handle.props.restored && fromSnapshot(developerDeck, handle.props.restored)
    let board = initialBoard(restored?.success ? restored.value : undefined)
    let draft = ''
    let boardRoot: HTMLElement | undefined
    let gesture: ReturnType<typeof startCardDrag> | null = null
    let suppressDragClick = false

    const beginGesture = (event: PointerEvent, choiceIndex: number) => {
      if (!canStartDrag(event) || !canPick(board.reading, choiceIndex) || gesture || !boardRoot)
        return
      suppressDragClick = false
      gesture = startCardDrag(event, choiceIndex, boardRoot, {
        isTarget: (positionId) => canPlace(board.reading, positionId),
        onChange: () => {
          suppressDragClick = true
          handle.update()
        },
        onDrop: put,
        onEnd: () => {
          gesture = null
          handle.update()
        },
      })
    }

    // Seal after every committed step; saved-reading.ts sends them one at a time, newest last.
    const save = () => {
      const snapshot = toSnapshot(board.reading, board.choices)
      if (snapshot) saveReading(snapshot)
    }

    handle.queueTask(() => {
      board = markReady(board)
      const { status } = board.reading
      if (status === 'idle') {
        // The server accepted a reading this build rejects: leave a tombstone, so the next load
        // agrees with this idle board. The first seal of a new reading supersedes it.
        if (restored && !restored.success) forgetReading()
        handle.update()
        return
      }
      focus(
        status === 'choosing'
          ? '[data-choice]:not(:disabled)'
          : status === 'complete'
            ? '[data-verdict]'
            : '[data-reveal]:not(:disabled)',
      )
    })

    const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const focus = (selector: string) => {
      handle.queueTask(() => {
        const target = boardRoot?.querySelector<HTMLElement>(selector)
        if (!target) return
        // Focus without the browser's instant jump; scroll only as far as needed to show it.
        target.focus({ preventScroll: true })
        target.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' })
      })
      handle.update()
    }

    const startReading = () => {
      const next = start(board, developerDeck, draft)
      if (next === board) return
      board = next
      if (board.reading.status === 'idle') {
        handle.update()
        return
      }
      save()
      focus('[data-choice="0"]')
    }

    const put = (positionId: string, choiceIndex = board.pending) => {
      if (choiceIndex === null) return
      const next = place(board, developerDeck, positionId, choiceIndex)
      if (next === board) return
      board = next
      save()
      const index = nextChoice(board.reading, choiceIndex)
      if (board.reading.status === 'ready') focus('[data-reveal]')
      else if (index === undefined) handle.update()
      else focus(`[data-choice="${index}"]`)
    }

    const turn = (positionId: string) => {
      const next = reveal(board, developerDeck, positionId)
      if (next === board) return
      board = next
      save()
      focus(board.reading.status === 'complete' ? '[data-verdict]' : '[data-reveal]:not(:disabled)')
    }

    const REVEAL_ALL_STAGGER_MS = 150
    let revealTimers: ReturnType<typeof setTimeout>[] = []
    const clearRevealTimers = () => {
      for (const timer of revealTimers) clearTimeout(timer)
      revealTimers = []
    }

    const revealAll = () => {
      const state = board.reading
      if (state.status !== 'ready' && state.status !== 'revealing') return
      clearRevealTimers()
      const hidden = developerDeck.positions.filter(
        (position) => !state.placements[position.id]?.revealed,
      )
      const stagger = reducedMotion() ? 0 : REVEAL_ALL_STAGGER_MS
      hidden.forEach((position, index) => {
        revealTimers.push(setTimeout(() => turn(position.id), index * stagger))
      })
    }

    const askAgain = () => {
      clearRevealTimers()
      forgetReading()
      draft = ''
      board = restart(board)
      focus('input')
    }

    return () => {
      const { reading: state, pending, error, ready, status, settled } = board
      const active = state.status !== 'idle'
      const positions = developerDeck.positions
      const choices = state.status === 'choosing' ? state.choices : []
      const completedState = state.status === 'complete' ? state : null
      const isDragging = !!gesture?.state.active
      return (
        <div
          mix={[
            boardStyles.boardShellStyle,
            ref((node, signal) => {
              boardRoot = node
              window.addEventListener(
                'pointerdown',
                () => {
                  if (!gesture) suppressDragClick = false
                },
                { capture: true, signal },
              )
              window.addEventListener(
                'click',
                (event) => {
                  if (!suppressDragClick || event.detail === 0) return
                  event.preventDefault()
                  event.stopImmediatePropagation()
                  suppressDragClick = false
                },
                { capture: true, signal },
              )
              signal.addEventListener('abort', () => {
                gesture?.cancel(false)
                clearRevealTimers()
              })
            }),
            on('keydown', (event) => {
              if (event.key !== 'Escape' || (!gesture && board.pending === null)) return
              if (gesture) suppressDragClick = true
              board = clearPending(board)
              gesture ? gesture.cancel(true) : handle.update()
            }),
          ]}
        >
          <SiteHeader />
          <section mix={boardStyles.boardStyle}>
            <section aria-label="Ask your question" mix={boardStyles.askStyle}>
              <h1 mix={boardStyles.headingStyle}>Ask something you're overthinking.</h1>
              <form
                mix={[
                  boardStyles.formStyle,
                  on('submit', (event) => {
                    event.preventDefault()
                    startReading()
                  }),
                ]}
              >
                <div mix={boardStyles.formRowStyle}>
                  <div mix={boardStyles.fieldStyle}>
                    <label htmlFor={handle.id} mix={boardStyles.labelStyle}>
                      YOUR QUESTION
                    </label>
                    <input
                      id={handle.id}
                      type="text"
                      value={active ? state.question : draft}
                      readOnly={active}
                      aria-invalid={!!error}
                      aria-describedby={error ? `${handle.id}-error` : undefined}
                      placeholder="What should I ask?"
                      mix={[
                        boardStyles.inputStyle,
                        on('input', (event) => {
                          draft = event.currentTarget.value
                          board = clearError(board)
                          handle.update()
                        }),
                      ]}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!ready || active}
                    mix={[
                      readingStyles.buttonStyle,
                      readingStyles.iconButtonStyle,
                      boardStyles.submitButtonStyle,
                      ctaMagicStyle,
                    ]}
                  >
                    {draft.trim() ? 'Ask' : 'Surprise me'}
                    <Icon name={draft.trim() ? 'arrow-right' : 'sparkles'} size={18} />
                  </button>
                </div>
                {error && (
                  <p id={`${handle.id}-error`} role="alert" mix={boardStyles.errorStyle}>
                    {error}
                  </p>
                )}
                <p data-quiet={active || undefined} mix={boardStyles.statusStyle}>
                  {!active && (
                    <span mix={boardStyles.hintStyle}>
                      Keep it specific. The deck is dramatic, not psychic.
                    </span>
                  )}
                  <span aria-live="polite" data-quiet mix={boardStyles.liveStatusStyle}>
                    {status}
                  </span>
                </p>
                <noscript>This reading experience requires JavaScript.</noscript>
              </form>
            </section>
            <ReadingSpread
              state={state}
              pending={pending}
              settled={settled}
              isDragging={isDragging}
              dropTarget={gesture?.state.target ?? undefined}
              onPut={put}
              onTurn={turn}
              onRevealAll={revealAll}
              onFocusInput={() => focus('input')}
            />
            {(choices.length > 0 || state.status === 'idle') && (
              <HiddenDeck
                active={active}
                choices={choices}
                pending={pending}
                ready={ready}
                dragging={isDragging}
                draggedChoice={gesture?.choiceIndex}
                onFocusInput={() => focus('input')}
                onChoose={(index) => {
                  board = choose(board, index)
                  handle.update()
                }}
                onBeginGesture={beginGesture}
              />
            )}
            {completedState && (
              <ReadingResult
                question={state.question}
                interpretation={completedState.interpretation}
                // Only a reading restored as complete has every position settled.
                restored={settled.length === positions.length}
                actions={
                  <>
                    <ShareReading reading={completedState} />
                    <button
                      type="button"
                      mix={[
                        readingStyles.buttonStyle,
                        readingStyles.secondaryButtonStyle,
                        readingStyles.iconButtonStyle,
                        on('click', askAgain),
                      ]}
                    >
                      <Icon name="rotate-ccw" size={18} />
                      Ask again
                    </button>
                  </>
                }
              />
            )}
            {gesture?.state.active && (
              <div
                aria-hidden="true"
                data-drag-preview
                mix={boardStyles.dragPreviewStyle}
                style={{ left: `${gesture.state.x}px`, top: `${gesture.state.y}px` }}
              />
            )}
          </section>
        </div>
      )
    }
  },
)
