import type { Handle } from 'remix/component'
import { css } from 'remix/component'

import type { CardInterpretation } from '../../domain/tarot/reading.ts'

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

const detailsStyle = css({
  gridColumn: '1',
  minWidth: 0,
  boxSizing: 'border-box',
  padding: '20px',
  overflowWrap: 'anywhere',
  borderRadius: 'var(--radius-card)',
  background: 'var(--color-surface)',
  '& h2': {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    margin: 0,
    fontWeight: 400,
  },
  '& [data-detail-position]': {
    fontSize: '14px',
    lineHeight: 1.3,
    color: 'var(--color-teal)',
  },
  '& [data-detail-name]': {
    fontFamily: 'var(--font-display)',
    fontSize: '24px',
    lineHeight: 1.15,
    color: 'var(--color-text)',
  },
  // The position meaning is the reading itself, so it leads; the card's tagline follows quietly.
  '& [data-detail-meaning]': {
    margin: '14px 0 0',
    fontSize: '17px',
    lineHeight: 1.5,
    color: 'var(--color-text)',
  },
  '& [data-detail-summary]': {
    margin: '10px 0 0',
    fontSize: '15px',
    lineHeight: 1.45,
    fontStyle: 'italic',
    color: 'var(--color-text-muted)',
  },
  '@media (min-width: 768px)': {
    '&[data-card-column="2"]': { gridColumn: '2' },
    '&[data-card-column="3"]': { gridColumn: '3' },
  },
})
