import type { Handle, RemixNode } from 'remix/component'
import { css } from 'remix/component'

import type { Interpretation } from '../../domain/tarot/reading.ts'
import { Icon } from './icons.tsx'
import { sheenStyle } from './magic.styles.ts'
import { Sparkles } from './sparkles.tsx'

/** A `restored` result was already shown before a reload, so it skips its entrance effects. */
export function ReadingResult(
  handle: Handle<{
    question: string
    interpretation: Interpretation
    actions?: RemixNode
    restored?: boolean
  }>,
) {
  return () => (
    <section aria-label="Reading result" mix={resultStyle}>
      <div data-restored={handle.props.restored || undefined} mix={resultPanelStyle}>
        <p data-result-question>{handle.props.question}</p>
        <h2 tabIndex={-1} data-verdict>
          <Icon name="sparkles" size={16} />
          Verdict
        </h2>
        <p data-result-verdict>{handle.props.interpretation.verdict}</p>
        {!handle.props.restored && (
          <>
            <span mix={sheenStyle} style={{ '--sheen-delay': '600ms' }} />
            <Sparkles count={16} mode="burst" seed={9} reach={260} delayMs={350} />
          </>
        )}
      </div>
      {handle.props.actions && <div mix={resultActionsStyle}>{handle.props.actions}</div>}
    </section>
  )
}

const resultStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
  width: '100%',
  maxWidth: '828px',
  alignSelf: 'center',
  overflowWrap: 'anywhere',
  fontFamily: 'var(--font-body)',
  color: 'var(--color-text)',
})
// The verdict is printed on the card-face parchment, the one light surface on the table.
const resultPanelStyle = css({
  boxSizing: 'border-box',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '12px',
  padding: '40px 32px 44px',
  borderRadius: 'var(--radius-panel)',
  background: 'var(--color-card-face)',
  color: 'var(--color-card-ink)',
  textAlign: 'center',
  // The verdict rises into place; only opacity and transform move, so it stays smooth.
  transition:
    'opacity 900ms cubic-bezier(0.2, 0.7, 0.2, 1), transform 900ms cubic-bezier(0.2, 0.7, 0.2, 1)',
  '@starting-style': {
    opacity: 0,
    transform: 'translateY(20px) scale(0.96)',
  },
  '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
  '&[data-restored]': { transition: 'none' },
  '@media (max-width: 599px)': { padding: '28px 20px 32px' },
  '& [data-result-question]': {
    margin: 0,
    fontSize: '15px',
    lineHeight: 1.45,
    color: 'color-mix(in srgb, var(--color-card-ink) 72%, transparent)',
    '&::before': { content: '"You asked: "' },
  },
  '& [data-verdict]': {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: '8px 0 0',
    fontFamily: 'var(--font-body)',
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--color-card-ink)',
    '&:focus-visible': { outline: '2px solid var(--color-card-ink)', outlineOffset: '4px' },
    '& svg': { color: '#B0701F' },
  },
  '& [data-result-verdict]': {
    maxWidth: '34ch',
    margin: 0,
    fontFamily: 'var(--font-display)',
    fontSize: '28px',
    lineHeight: 1.35,
    textWrap: 'balance',
    '@media (max-width: 599px)': { fontSize: '22px' },
  },
})
const resultActionsStyle = css({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: '12px',
})
