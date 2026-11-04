import type { Handle, RemixNode } from 'remix/component'

import type { Interpretation } from '../../domain/tarot/reading.ts'
import { Icon } from './icons.tsx'
import { sheenStyle } from './magic.styles.ts'
import { resultActionsStyle, resultPanelStyle, resultStyle } from './reading-board.styles.ts'
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
