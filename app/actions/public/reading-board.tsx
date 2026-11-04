import { clientEntry, type Handle, on, type RemixNode, ref } from 'remix/component'

import { developerDeck } from '../../domain/tarot/decks/developer.ts'
import { CHOICE_COUNT, canPick, canPlace, interpretCard } from '../../domain/tarot/reading.ts'
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
import { CardDetails } from './card-details.tsx'
import { canStartDrag, startCardDrag } from './drag-gesture.ts'
import { Icon } from './icons.tsx'
import {
  breathingOrbStyle,
  ctaMagicStyle,
  floatStyle,
  tableRingsStyle,
  tableStarsStyle,
} from './magic.styles.ts'
import {
  askStyle,
  badgeStyle,
  boardShellStyle,
  boardStyle,
  brandMarkStyle,
  brandNameStyle,
  brandStyle,
  buttonStyle,
  cardBackStyle,
  commitmentStyle,
  deckCopyStyle,
  deckGridStyle,
  deckLabelRowStyle,
  deckRuleStyle,
  deckSectionStyle,
  detailsListStyle,
  dragPreviewStyle,
  emptySlotStyle,
  errorStyle,
  faceDownStyle,
  fieldStyle,
  formRowStyle,
  formStyle,
  guideProgressStyle,
  guideTextStyle,
  headerStyle,
  headingStyle,
  hintStyle,
  iconButtonStyle,
  inputStyle,
  labelStyle,
  liveStatusStyle,
  mobileOnlyStyle,
  revealAllStyle,
  secondaryButtonStyle,
  slotLabelStyle,
  slotWrapStyle,
  spreadGateCopyStyle,
  spreadGateStyle,
  spreadGateTitleStyle,
  spreadHeaderStyle,
  spreadInstructionStyle,
  spreadRowStyle,
  spreadSectionStyle,
  spreadTitleStyle,
  statusStyle,
  submitButtonStyle,
  wideOnlyStyle,
} from './reading-board.styles.ts'
import { ReadingResult } from './reading-result.tsx'
import { RevealedCard } from './revealed-card.tsx'
import { forgetReading, saveReading } from './saved-reading.ts'
import { ShareReading } from './share-reading.tsx'
import { Sparkles } from './sparkles.tsx'

const slotPrompts = {
  context: 'The situation around it',
  problem: 'What is getting in the way',
  advice: 'The move worth considering',
}
// Depth of the deck's shallow arc: the outer cards sit this much lower than the centre one.
const DECK_ARC_DEPTH_CSS_PX = 24
const positionNames = new Intl.ListFormat('en', { type: 'disjunction' })
const badgeIcons = { selected: 'check', placed: 'lock', revealable: 'sparkles' } as const

export function SiteHeader(handle: Handle<{ children?: RemixNode }>) {
  return () => (
    <header mix={headerStyle}>
      <div mix={brandStyle}>
        <span aria-hidden="true" mix={brandMarkStyle}>
          <Icon name="sparkles" size={16} />
        </span>
        <span mix={brandNameStyle}>PSEUDO TAROT</span>
      </div>
      {handle.props.children}
    </header>
  )
}

function Badge(handle: Handle<{ kind: keyof typeof badgeIcons }>) {
  return () => (
    <span aria-hidden="true" data-badge={handle.props.kind} mix={badgeStyle}>
      <Icon name={badgeIcons[handle.props.kind]} size={12} />
    </span>
  )
}

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
      const placements =
        state.status === 'choosing' || state.status === 'ready' || state.status === 'revealing'
          ? state.placements
          : {}
      const choices = state.status === 'choosing' ? state.choices : []
      const completedState = state.status === 'complete' ? state : null
      const revealedCards = positions.flatMap((position, positionIndex) => {
        const card =
          completedState?.interpretation.cards.find((item) => item.positionId === position.id) ??
          (placements[position.id]?.revealed
            ? interpretCard(developerDeck, position.id, placements[position.id].cardId)
            : undefined)
        return card ? [{ card, position, positionIndex }] : []
      })
      const isDragging = !!gesture?.state.active
      const deckCards =
        state.status === 'idle'
          ? Array.from({ length: CHOICE_COUNT }, () => ({ picked: true }))
          : choices
      const inDeck = deckCards.flatMap((card, index) => (active && card.picked ? [] : [index]))
      const deckOffset = (index: number) => {
        const at = inDeck.indexOf(index)
        const middle = (inDeck.length - 1) / 2
        if (at < 0 || middle === 0) return 0
        return Math.round(DECK_ARC_DEPTH_CSS_PX * ((at - middle) / middle) ** 2)
      }
      const placed = `${Object.keys(placements).length} of ${positions.length} placed`
      const positionList = positionNames.format(positions.map((position) => position.label))
      const [guide, progress] =
        state.status === 'choosing'
          ? pending === null && !isDragging
            ? ['Choose one of the hidden cards below.', placed]
            : [`${isDragging ? 'Drop it on' : 'Now place it in'} ${positionList}.`, placed]
          : state.status === 'complete'
            ? ['Your reading is complete.', '']
            : [
                'Reveal each card in any order, or all at once.',
                `${revealedCards.length} of ${positions.length} revealed`,
              ]
      return (
        <div
          mix={[
            boardShellStyle,
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
          <section mix={boardStyle}>
            <section aria-label="Ask your question" mix={askStyle}>
              <h1 mix={headingStyle}>Ask something you're overthinking.</h1>
              <form
                mix={[
                  formStyle,
                  on('submit', (event) => {
                    event.preventDefault()
                    startReading()
                  }),
                ]}
              >
                <div mix={formRowStyle}>
                  <div mix={fieldStyle}>
                    <label htmlFor={handle.id} mix={labelStyle}>
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
                        inputStyle,
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
                    mix={[buttonStyle, iconButtonStyle, submitButtonStyle, ctaMagicStyle]}
                  >
                    {draft.trim() ? 'Ask' : 'Surprise me'}
                    <Icon name={draft.trim() ? 'arrow-right' : 'sparkles'} size={18} />
                  </button>
                </div>
                {error && (
                  <p id={`${handle.id}-error`} role="alert" mix={errorStyle}>
                    {error}
                  </p>
                )}
                <p data-quiet={active || undefined} mix={statusStyle}>
                  {!active && (
                    <span mix={hintStyle}>
                      Keep it specific. The deck is dramatic, not psychic.
                    </span>
                  )}
                  <span aria-live="polite" data-quiet mix={liveStatusStyle}>
                    {status}
                  </span>
                </p>
                <noscript>This reading experience requires JavaScript.</noscript>
              </form>
            </section>
            <section aria-label="Your spread" mix={spreadSectionStyle}>
              <div mix={spreadHeaderStyle}>
                <h2 mix={spreadTitleStyle}>Your spread</h2>
                {active && (
                  <p mix={spreadInstructionStyle}>
                    <span mix={guideTextStyle}>{guide}</span>
                    {progress && <span mix={guideProgressStyle}>{progress}</span>}
                  </p>
                )}
              </div>
              <div mix={[spreadRowStyle, tableRingsStyle]}>
                <span mix={tableStarsStyle}>
                  <Sparkles count={18} mode="drift" seed={11} />
                </span>
                {!active && (
                  <div mix={[spreadGateStyle, on('click', () => focus('input'))]}>
                    <span aria-hidden="true" mix={breathingOrbStyle} />
                    <Sparkles count={12} mode="drift" seed={5} />
                    <p mix={[spreadGateTitleStyle, floatStyle]}>Ask your question first</p>
                    <p mix={spreadGateCopyStyle}>
                      Then choose three hidden cards and place them here.
                    </p>
                  </div>
                )}
                {positions.map((position, positionIndex) => {
                  const placement = placements[position.id]
                  const isDropTarget = isDragging && gesture?.state.target === position.id
                  const isEligible =
                    (pending !== null || isDragging) && canPlace(state, position.id)
                  const revealed = revealedCards.find((item) => item.position.id === position.id)
                  return (
                    <div
                      key={position.id}
                      data-position={position.id}
                      data-drop-target={isDropTarget || undefined}
                      mix={slotWrapStyle}
                    >
                      {placement || revealed ? (
                        <span mix={slotLabelStyle}>{position.label.toUpperCase()}</span>
                      ) : null}
                      {revealed ? (
                        <RevealedCard
                          key={position.id}
                          card={revealed.card}
                          settled={settled.includes(position.id)}
                        />
                      ) : placement ? (
                        <button
                          type="button"
                          aria-label={`${state.status === 'choosing' ? 'Hidden card in' : 'Reveal'} ${position.label} card`}
                          data-reveal
                          disabled={state.status === 'choosing'}
                          mix={[faceDownStyle, on('click', () => turn(position.id))]}
                        >
                          <Badge kind={state.status === 'choosing' ? 'placed' : 'revealable'} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          aria-label={`Place card in ${position.label}`}
                          disabled={!isEligible}
                          data-eligible={isEligible || undefined}
                          mix={[emptySlotStyle, on('click', () => put(position.id))]}
                        >
                          <span aria-hidden="true" data-slot-number>
                            {String(positionIndex + 1).padStart(2, '0')}
                          </span>
                          {isEligible ? (
                            <>
                              <span data-slot-icon mix={wideOnlyStyle}>
                                <Icon name="move-down" size={20} />
                              </span>
                              <span data-slot-icon mix={mobileOnlyStyle}>
                                <Icon name="plus" size={14} />
                              </span>
                            </>
                          ) : (
                            <span data-slot-icon>
                              <Icon name="circle-dashed" size={20} />
                            </span>
                          )}
                          <span data-slot-name>{position.label.toUpperCase()}</span>
                          {isEligible && (
                            <span data-slot-hint>
                              {isDropTarget ? 'Release to place' : `Place in ${position.label}`}
                            </span>
                          )}
                          <span data-slot-prompt>
                            {slotPrompts[position.id as keyof typeof slotPrompts]}
                          </span>
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
              <div mix={detailsListStyle}>
                {revealedCards.map(({ card, position, positionIndex }) => (
                  <CardDetails
                    key={position.id}
                    card={card}
                    positionIndex={positionIndex}
                    positionLabel={position.label}
                  />
                ))}
              </div>
              {state.status === 'ready' || state.status === 'revealing' ? (
                <button
                  type="button"
                  data-reveal-all
                  mix={[buttonStyle, revealAllStyle, on('click', revealAll)]}
                >
                  Reveal all
                </button>
              ) : (
                !completedState && (
                  <p mix={commitmentStyle}>
                    <Icon name="lock" size={16} />
                    Once placed, a card stays there.
                  </p>
                )
              )}
            </section>
            {(choices.length > 0 || state.status === 'idle') && (
              <section aria-label="Hidden cards" mix={deckSectionStyle}>
                <div mix={deckLabelRowStyle}>
                  <span mix={deckRuleStyle} />
                  <span mix={deckCopyStyle}>
                    {active
                      ? 'CHOOSE A HIDDEN CARD'
                      : `${CHOICE_COUNT} CARDS WAITING FOR YOUR QUESTION`}
                  </span>
                  <span mix={deckRuleStyle} />
                </div>
                <div
                  data-idle={!active || undefined}
                  mix={[
                    deckGridStyle,
                    on('click', () => {
                      if (!active) focus('input')
                    }),
                  ]}
                >
                  {deckCards.map(({ picked }, index) => (
                    <button
                      key={index}
                      type="button"
                      aria-label={`Choose hidden card ${index + 1}`}
                      aria-pressed={pending === index}
                      disabled={!ready || picked}
                      data-selected={pending === index || undefined}
                      data-picked={(active && picked) || undefined}
                      data-dragging={(isDragging && gesture?.choiceIndex === index) || undefined}
                      data-choice={index}
                      style={{ '--deck-offset': `${deckOffset(index)}px` }}
                      mix={[
                        cardBackStyle,
                        on('click', () => {
                          board = choose(board, index)
                          handle.update()
                        }),
                        on('pointerdown', (event) => beginGesture(event, index)),
                      ]}
                    >
                      {pending === index ? (
                        <Badge kind="selected" />
                      ) : active && picked ? (
                        <Badge kind="placed" />
                      ) : null}
                    </button>
                  ))}
                </div>
              </section>
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
                        buttonStyle,
                        secondaryButtonStyle,
                        iconButtonStyle,
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
                mix={dragPreviewStyle}
                style={{ left: `${gesture.state.x}px`, top: `${gesture.state.y}px` }}
              />
            )}
          </section>
        </div>
      )
    }
  },
)
