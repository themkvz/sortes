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
        <h2 aria-label={`${positionLabel}: ${card.cardName}`}>
          <span data-detail-position>{positionLabel}</span>
          <span data-detail-name>{card.cardName}</span>
        </h2>
        <p data-detail-meaning>{card.meaning}</p>
        <p data-detail-summary>{card.shortDescription}</p>
      </article>
    )
  }
}
