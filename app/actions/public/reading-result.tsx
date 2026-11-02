import type { Handle, RemixNode } from 'remix/component'

import type { Interpretation } from '../../domain/tarot/reading.ts'
import { resultActionsStyle, resultStyle } from './reading-board.styles.ts'

export function ReadingResult(
  handle: Handle<{ question: string; interpretation: Interpretation; actions?: RemixNode }>,
) {
  return () => (
    <section aria-label="Reading result" mix={resultStyle}>
      <p>{handle.props.question}</p>
      <h2 tabIndex={-1} data-verdict>
        Verdict
      </h2>
      <p>{handle.props.interpretation.verdict}</p>
      {handle.props.actions && <div mix={resultActionsStyle}>{handle.props.actions}</div>}
    </section>
  )
}
