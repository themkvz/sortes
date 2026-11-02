import { clientEntry, type Handle, on, ref } from 'remix/component'

import { developerDeck } from '../../domain/tarot/decks/developer.ts'
import { CHOICE_COUNT, canPick, canPlace, interpretCard } from '../../domain/tarot/reading.ts'
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
import {
  askStyle,
  boardStyle,
  buttonStyle,
  cardBackStyle,
  deckCopyStyle,
  deckGridStyle,
  deckLabelRowStyle,
  deckRuleStyle,
  deckSectionStyle,
  dragPreviewStyle,
  emptySlotStyle,
  errorStyle,
  faceDownStyle,
  formRowStyle,
  frontFrameStyle,
  frontImageStyle,
  headingStyle,
  inputStyle,
  labelStyle,
  mutedMonoStyle,
  mutedSmallStyle,
  resultStyle,
  revealedStyle,
  selectedStyle,
  slotLabelStyle,
  slotWrapStyle,
  spreadHeaderStyle,
  spreadRowStyle,
  spreadSectionStyle,
} from './reading-board.styles.ts'

export const ReadingBoard = clientEntry(import.meta.url, function ReadingBoard(handle: Handle) {
  let board = initialBoard()
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

  handle.queueTask(() => {
    board = markReady(board)
    handle.update()
  })

  const focus = (selector: string) => {
    handle.queueTask(() => boardRoot?.querySelector<HTMLElement>(selector)?.focus())
    handle.update()
  }

  const startReading = () => {
    const next = start(board, developerDeck, draft)
    if (next === board) return
    board = next
    if (board.reading.status === 'idle') handle.update()
    else focus('[data-choice="0"]')
  }

  const put = (positionId: string, choiceIndex = board.pending) => {
    if (choiceIndex === null) return
    const next = place(board, developerDeck, positionId, choiceIndex)
    if (next === board) return
    board = next
    const index = nextChoice(board.reading, choiceIndex)
    if (board.reading.status === 'ready') focus('[data-reveal]')
    else if (index === undefined) handle.update()
    else focus(`[data-choice="${index}"]`)
  }

  const turn = (positionId: string) => {
    const next = reveal(board, developerDeck, positionId)
    if (next === board) return
    board = next
    focus(board.reading.status === 'complete' ? '[data-verdict]' : '[data-reveal]:not(:disabled)')
  }

  const askAgain = () => {
    draft = ''
    board = restart(board)
    focus('input')
  }

  return () => {
    const { reading: state, pending, error, ready, status } = board
    const active = state.status !== 'idle'
    const positions = developerDeck.positions
    const placements =
      state.status === 'choosing' || state.status === 'ready' || state.status === 'revealing'
        ? state.placements
        : {}
    const choices = state.status === 'choosing' ? state.choices : []
    const completedState = state.status === 'complete' ? state : null
    return (
      <section
        mix={[
          boardStyle,
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
            signal.addEventListener('abort', () => gesture?.cancel(false))
          }),
          on('keydown', (event) => {
            if (event.key !== 'Escape' || (!gesture && board.pending === null)) return
            if (gesture) suppressDragClick = true
            board = clearPending(board)
            gesture ? gesture.cancel(true) : handle.update()
          }),
        ]}
      >
        <section aria-label="Ask your question" mix={askStyle}>
          <h1 mix={headingStyle}>Ask something you're overthinking.</h1>
          <form
            mix={on('submit', (event) => {
              event.preventDefault()
              startReading()
            })}
          >
            <label htmlFor={handle.id} mix={labelStyle}>
              YOUR QUESTION
            </label>
            <div mix={formRowStyle}>
              <input
                id={handle.id}
                type="text"
                value={active ? state.question : draft}
                readOnly={active}
                aria-invalid={!!error}
                aria-describedby={error ? `${handle.id}-error` : undefined}
                placeholder="What should I ask?"
                mix={[
                  inputStyle,
                  on('input', (event) => {
                    draft = event.currentTarget.value
                    board = clearError(board)
                    handle.update()
                  }),
                ]}
              />
              <button type="submit" disabled={!ready || active} mix={buttonStyle}>
                {draft.trim() ? 'Ask' : 'Surprise me'}
              </button>
            </div>
            {error && (
              <p id={`${handle.id}-error`} role="alert" mix={errorStyle}>
                {error}
              </p>
            )}
            <p>
              <span aria-live="polite">{status}</span>
            </p>
            <noscript>This reading experience requires JavaScript.</noscript>
          </form>
        </section>
        <section aria-label="Your spread" mix={spreadSectionStyle}>
          <div mix={spreadHeaderStyle}>
            <span mix={mutedMonoStyle}>YOUR SPREAD</span>
            <span mix={mutedSmallStyle}>Choose and place three cards.</span>
          </div>
          <div mix={spreadRowStyle}>
            {positions.map((position) => {
              const placement = placements[position.id]
              const completedCard = completedState?.interpretation.cards.find(
                (item) => item.positionId === position.id,
              )
              const card =
                completedCard ??
                (placement?.revealed
                  ? interpretCard(developerDeck, position.id, placement.cardId)
                  : undefined)
              return (
                <div
                  key={position.id}
                  data-position={position.id}
                  data-drop-target={
                    (gesture?.state.active && gesture.state.target === position.id) || undefined
                  }
                  mix={slotWrapStyle}
                >
                  <span mix={slotLabelStyle}>{position.label.toUpperCase()}</span>
                  {card ? (
                    <article mix={revealedStyle}>
                      <div data-front-frame mix={frontFrameStyle}>
                        <img
                          src={`/cards/developer/fronts/${card.cardId}.webp`}
                          alt=""
                          aria-hidden="true"
                          data-front-art
                          width="492"
                          height="700"
                          mix={[
                            frontImageStyle,
                            on('error', (event) => {
                              event.currentTarget.hidden = true
                            }),
                          ]}
                        />
                      </div>
                      <strong>{card.cardName}</strong>
                      <span>{card.shortDescription}</span>
                      <p>{card.meaning}</p>
                    </article>
                  ) : placement ? (
                    <button
                      type="button"
                      aria-label={`${state.status === 'choosing' ? 'Hidden card in' : 'Reveal'} ${position.label} card`}
                      data-reveal
                      disabled={state.status === 'choosing'}
                      mix={[faceDownStyle, on('click', () => turn(position.id))]}
                    >
                      <span aria-hidden="true" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      aria-label={`Place card in ${position.label}`}
                      disabled={pending === null || !canPlace(state, position.id)}
                      mix={[emptySlotStyle, on('click', () => put(position.id))]}
                    >
                      Place card
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </section>
        {(choices.length > 0 || state.status === 'idle') && (
          <section aria-label="Hidden cards" mix={deckSectionStyle}>
            <div mix={deckLabelRowStyle}>
              <span mix={deckRuleStyle} />
              <span mix={deckCopyStyle}>CHOOSE A HIDDEN CARD</span>
              <span mix={deckRuleStyle} />
            </div>
            <div mix={deckGridStyle}>
              {(state.status === 'idle'
                ? Array.from({ length: CHOICE_COUNT }, () => ({ picked: true }))
                : choices
              ).map(({ picked }, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Choose hidden card ${index + 1}`}
                  aria-pressed={pending === index}
                  disabled={!ready || picked}
                  data-choice={index}
                  mix={[
                    cardBackStyle,
                    pending === index ? selectedStyle : null,
                    on('click', () => {
                      board = choose(board, index)
                      handle.update()
                    }),
                    on('pointerdown', (event) => beginGesture(event, index)),
                  ]}
                >
                  <span aria-hidden="true" />
                </button>
              ))}
            </div>
          </section>
        )}
        {completedState && (
          <section aria-label="Reading result" mix={resultStyle}>
            <p>{state.question}</p>
            <h2 tabIndex={-1} data-verdict>
              Verdict
            </h2>
            <p>{completedState.interpretation.verdict}</p>
            <button type="button" mix={[buttonStyle, on('click', askAgain)]}>
              Ask again
            </button>
          </section>
        )}
        {gesture?.state.active && (
          <div
            aria-hidden="true"
            data-drag-preview
            mix={dragPreviewStyle}
            style={{ left: `${gesture.state.x}px`, top: `${gesture.state.y}px` }}
          />
        )}
      </section>
    )
  }
})
