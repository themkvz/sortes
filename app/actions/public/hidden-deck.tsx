import type { Handle } from 'remix/component'
import { on } from 'remix/component'

import { CHOICE_COUNT } from '../../domain/tarot/reading.ts'
import { CardBadge } from './card-badge.tsx'
import * as styles from './hidden-deck.styles.ts'

// Depth of the deck's shallow arc: the outer cards sit this much lower than the centre one.
const DECK_ARC_DEPTH_CSS_PX = 24

export function HiddenDeck(
  handle: Handle<{
    active: boolean
    choices: ReadonlyArray<{ picked: boolean }>
    pending: number | null
    ready: boolean
    dragging: boolean
    draggedChoice: number | undefined
    onFocusInput: () => void
    onChoose: (index: number) => void
    onBeginGesture: (event: PointerEvent, index: number) => void
  }>,
) {
  return () => {
    const { active, choices, pending, ready, dragging, draggedChoice } = handle.props
    const cards = active ? choices : Array.from({ length: CHOICE_COUNT }, () => ({ picked: true }))
    const inDeck = cards.flatMap((card, index) => (active && card.picked ? [] : [index]))
    const offset = (index: number) => {
      const at = inDeck.indexOf(index)
      const middle = (inDeck.length - 1) / 2
      return at < 0 || middle === 0
        ? 0
        : Math.round(DECK_ARC_DEPTH_CSS_PX * ((at - middle) / middle) ** 2)
    }
    return (
      <section aria-label="Hidden cards" mix={styles.deckSectionStyle}>
        <div mix={styles.deckLabelRowStyle}>
          <span mix={styles.deckRuleStyle} />
          <span mix={styles.deckCopyStyle}>
            {active ? 'CHOOSE A HIDDEN CARD' : `${CHOICE_COUNT} CARDS WAITING FOR YOUR QUESTION`}
          </span>
          <span mix={styles.deckRuleStyle} />
        </div>
        <div
          data-idle={!active || undefined}
          mix={[
            styles.deckGridStyle,
            on('click', () => {
              if (!handle.props.active) handle.props.onFocusInput()
            }),
          ]}
        >
          {cards.map(({ picked }, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Choose hidden card ${index + 1}`}
              aria-pressed={pending === index}
              disabled={!ready || picked}
              data-selected={pending === index || undefined}
              data-picked={(active && picked) || undefined}
              data-dragging={(dragging && draggedChoice === index) || undefined}
              data-choice={index}
              style={{ '--deck-offset': `${offset(index)}px` }}
              mix={[
                styles.cardBackStyle,
                on('click', () => handle.props.onChoose(index)),
                on('pointerdown', (event) => handle.props.onBeginGesture(event, index)),
              ]}
            >
              {pending === index ? (
                <CardBadge kind="selected" />
              ) : active && picked ? (
                <CardBadge kind="placed" />
              ) : null}
            </button>
          ))}
        </div>
      </section>
    )
  }
}
