import { clientEntry, type Handle, on, type RemixNode, ref } from 'remix/component'

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
import { CardDetails } from './card-details.tsx'
import { canStartDrag, startCardDrag } from './drag-gesture.ts'
import { Icon } from './icons.tsx'
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
  headerStyle,
  headingStyle,
  hintStyle,
  inputStyle,
  labelStyle,
  liveStatusStyle,
  mobileOnlyStyle,
  mutedMonoStyle,
  mutedSmallStyle,
  slotLabelStyle,
  slotWrapStyle,
  spreadHeaderStyle,
  spreadRowStyle,
  spreadSectionStyle,
  stageMetaStyle,
  stageNameStyle,
  stageNumberStyle,
  stageRuleStyle,
  statusStyle,
  submitButtonStyle,
  wideOnlyStyle,
} from './reading-board.styles.ts'
import { ReadingResult } from './reading-result.tsx'
import { RevealedCard } from './revealed-card.tsx'
import { ShareReading } from './share-reading.tsx'

const slotPrompts = {
  context: 'The situation around it',
  problem: 'What is getting in the way',
  advice: 'The move worth considering',
}
const STAGE_COUNT = 5
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
    const spreadInstruction =
      state.status === 'idle'
        ? 'Ask first. Then choose three cards.'
        : state.status === 'choosing'
          ? 'Choose and place three cards.'
          : state.status === 'complete'
            ? 'Your reading is complete.'
            : 'Reveal your three cards.'
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
    const [stageNumber, stageName] =
      state.status === 'idle'
        ? [1, 'ASK']
        : state.status === 'choosing'
          ? pending === null
            ? [2, 'CHOOSE']
            : [3, 'PLACE']
          : state.status === 'complete'
            ? [5, 'VERDICT']
            : [4, 'REVEAL']
    const placedCount =
      state.status === 'complete' ? positions.length : Object.keys(placements).length
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
        <SiteHeader>
          <div aria-hidden="true" mix={stageMetaStyle}>
            <span mix={[wideOnlyStyle, stageNumberStyle]}>
              {String(stageNumber).padStart(2, '0')} / {String(STAGE_COUNT).padStart(2, '0')}
            </span>
            <span mix={[wideOnlyStyle, stageRuleStyle]} />
            <span mix={[wideOnlyStyle, stageNameStyle]}>{stageName}</span>
            <span mix={[mobileOnlyStyle, stageNumberStyle]}>
              {placedCount} / {positions.length} PLACED
            </span>
          </div>
        </SiteHeader>
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
                  mix={[buttonStyle, submitButtonStyle]}
                >
                  {draft.trim() ? 'Ask' : 'Surprise me'}
                </button>
              </div>
              {error && (
                <p id={`${handle.id}-error`} role="alert" mix={errorStyle}>
                  {error}
                </p>
              )}
              <p mix={statusStyle}>
                {!active && (
                  <span mix={hintStyle}>Keep it specific. The deck is dramatic, not psychic.</span>
                )}
                <span aria-live="polite" data-quiet={!active || undefined} mix={liveStatusStyle}>
                  {status}
                </span>
              </p>
              <noscript>This reading experience requires JavaScript.</noscript>
            </form>
          </section>
          <section aria-label="Your spread" mix={spreadSectionStyle}>
            <div mix={spreadHeaderStyle}>
              <span mix={mutedMonoStyle}>YOUR SPREAD</span>
              <span mix={mutedSmallStyle}>{spreadInstruction}</span>
            </div>
            <div mix={spreadRowStyle}>
              {positions.map((position, positionIndex) => {
                const placement = placements[position.id]
                const isEligible = pending !== null && canPlace(state, position.id)
                const revealed = revealedCards.find((item) => item.position.id === position.id)
                return (
                  <div
                    key={position.id}
                    data-position={position.id}
                    data-drop-target={
                      (gesture?.state.active && gesture.state.target === position.id) || undefined
                    }
                    mix={slotWrapStyle}
                  >
                    {placement || revealed ? (
                      <span mix={slotLabelStyle}>{position.label.toUpperCase()}</span>
                    ) : null}
                    {revealed ? (
                      <RevealedCard key={position.id} card={revealed.card} />
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
                        {isEligible && <span data-slot-hint>Place in {position.label}</span>}
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
            {!completedState && (
              <p mix={commitmentStyle}>
                <Icon name="lock" size={16} />
                Once placed, a card stays there.
              </p>
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
                    data-selected={pending === index || undefined}
                    data-picked={(active && picked) || undefined}
                    data-choice={index}
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
              actions={
                <>
                  <ShareReading reading={completedState} />
                  <button type="button" mix={[buttonStyle, on('click', askAgain)]}>
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
})
