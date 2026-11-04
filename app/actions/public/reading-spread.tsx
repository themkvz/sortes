import type { Handle } from 'remix/component'
import { on } from 'remix/component'

import { developerDeck } from '../../domain/tarot/decks/developer.ts'
import type { ReadingState } from '../../domain/tarot/reading.ts'
import { canPlace, interpretCard } from '../../domain/tarot/reading.ts'
import { CardBadge } from './card-badge.tsx'
import { CardDetails } from './card-details.tsx'
import { Icon } from './icons.tsx'
import { breathingOrbStyle, floatStyle, tableRingsStyle, tableStarsStyle } from './magic.styles.ts'
import * as sharedStyles from './reading.styles.ts'
import * as styles from './reading-spread.styles.ts'
import { RevealedCard } from './revealed-card.tsx'
import { Sparkles } from './sparkles.tsx'

export function ReadingSpread(
  handle: Handle<{
    state: ReadingState
    pending: number | null
    settled: ReadonlyArray<string>
    isDragging: boolean
    dropTarget?: string
    onPut: (positionId: string) => void
    onTurn: (positionId: string) => void
    onRevealAll: () => void
    onFocusInput: () => void
  }>,
) {
  return () => {
    const { state, pending, settled, isDragging, dropTarget } = handle.props
    const positions = developerDeck.positions
    const placements =
      state.status === 'choosing' || state.status === 'ready' || state.status === 'revealing'
        ? state.placements
        : {}
    const completedState = state.status === 'complete' ? state : null
    const revealedCards = positions.flatMap((position, positionIndex) => {
      const card =
        completedState?.interpretation.cards.find((item) => item.positionId === position.id) ??
        (placements[position.id]?.revealed
          ? interpretCard(developerDeck, position.id, placements[position.id].cardId)
          : undefined)
      return card ? [{ card, position, positionIndex }] : []
    })
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
      <section aria-label="Your spread" mix={sharedStyles.spreadSectionStyle}>
        <div mix={styles.spreadHeaderStyle}>
          <h2 mix={styles.spreadTitleStyle}>Your spread</h2>
          {state.status !== 'idle' && (
            <p mix={styles.spreadInstructionStyle}>
              <span mix={styles.guideTextStyle}>{guide}</span>
              {progress && <span mix={styles.guideProgressStyle}>{progress}</span>}
            </p>
          )}
        </div>
        <div mix={[sharedStyles.spreadRowStyle, tableRingsStyle]}>
          <span mix={tableStarsStyle}>
            <Sparkles count={18} mode="drift" seed={11} />
          </span>
          {state.status === 'idle' && (
            <div mix={[styles.spreadGateStyle, on('click', () => handle.props.onFocusInput())]}>
              <span aria-hidden="true" mix={breathingOrbStyle} />
              <Sparkles count={12} mode="drift" seed={5} />
              <p mix={[styles.spreadGateTitleStyle, floatStyle]}>Ask your question first</p>
              <p mix={styles.spreadGateCopyStyle}>
                Then choose three hidden cards and place them here.
              </p>
            </div>
          )}
          {positions.map((position, positionIndex) => {
            const placement = placements[position.id]
            const isDropTarget = isDragging && dropTarget === position.id
            const isEligible = (pending !== null || isDragging) && canPlace(state, position.id)
            const revealed = revealedCards.find((item) => item.position.id === position.id)
            return (
              <div
                key={position.id}
                data-position={position.id}
                data-drop-target={isDropTarget || undefined}
                mix={sharedStyles.slotWrapStyle}
              >
                {placement || revealed ? (
                  <span mix={sharedStyles.slotLabelStyle}>{position.label.toUpperCase()}</span>
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
                    mix={[
                      styles.faceDownStyle,
                      on('click', () => handle.props.onTurn(position.id)),
                    ]}
                  >
                    <CardBadge kind={state.status === 'choosing' ? 'placed' : 'revealable'} />
                  </button>
                ) : (
                  <button
                    type="button"
                    aria-label={`Place card in ${position.label}`}
                    disabled={!isEligible}
                    data-eligible={isEligible || undefined}
                    mix={[
                      styles.emptySlotStyle,
                      on('click', () => handle.props.onPut(position.id)),
                    ]}
                  >
                    <span aria-hidden="true" data-slot-number>
                      {String(positionIndex + 1).padStart(2, '0')}
                    </span>
                    {isEligible ? (
                      <>
                        <span data-slot-icon mix={styles.wideOnlyStyle}>
                          <Icon name="move-down" size={20} />
                        </span>
                        <span data-slot-icon mix={styles.mobileOnlyStyle}>
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
        <div mix={sharedStyles.detailsListStyle}>
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
            mix={[
              sharedStyles.buttonStyle,
              styles.revealAllStyle,
              on('click', () => handle.props.onRevealAll()),
            ]}
          >
            Reveal all
          </button>
        ) : !completedState ? (
          <p mix={styles.commitmentStyle}>
            <Icon name="lock" size={16} />
            Once placed, a card stays there.
          </p>
        ) : null}
      </section>
    )
  }
}

const positionNames = new Intl.ListFormat('en', { type: 'disjunction' })
const slotPrompts = {
  context: 'The situation around it',
  problem: 'What is getting in the way',
  advice: 'The move worth considering',
}
