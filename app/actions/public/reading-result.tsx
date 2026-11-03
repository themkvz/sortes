import type { Handle, RemixNode } from 'remix/component'

import type { Interpretation } from '../../domain/tarot/reading.ts'
import { Icon } from './icons.tsx'
import { resultActionsStyle, resultPanelStyle, resultStyle } from './reading-board.styles.ts'

export function ReadingResult(
  handle: Handle<{ question: string; interpretation: Interpretation; actions?: RemixNode }>,
) {
  return () => (
    <section aria-label="Reading result" mix={resultStyle}>
      <div mix={resultPanelStyle}>
        <p data-result-question>{handle.props.question}</p>
        <h2 tabIndex={-1} data-verdict>
          <Icon name="sparkles" size={16} />
          Verdict
        </h2>
        <p data-result-verdict>{handle.props.interpretation.verdict}</p>
      </div>
      {handle.props.actions && <div mix={resultActionsStyle}>{handle.props.actions}</div>}
    </section>
  )
}
