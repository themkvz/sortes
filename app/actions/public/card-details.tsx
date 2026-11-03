import type { Handle } from 'remix/component'

import type { CardInterpretation } from '../../domain/tarot/reading.ts'
import { detailsStyle } from './reading-board.styles.ts'

export function CardDetails(
  handle: Handle<{ card: CardInterpretation; positionIndex: number; positionLabel: string }>,
) {
  return () => {
    const { card, positionIndex, positionLabel } = handle.props
    return (
      <article
        data-card-details
        data-card-position={card.positionId}
        data-card-id={card.cardId}
        data-card-column={positionIndex + 1}
        mix={detailsStyle}
      >
        <h2>
          {card.cardName} · {positionLabel}
        </h2>
        <p>{card.shortDescription}</p>
        <p>{card.meaning}</p>
      </article>
    )
  }
}
