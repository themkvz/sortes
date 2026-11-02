import type { Handle } from 'remix/component'
import { developerDeck } from '../domain/tarot/decks/developer.ts'
import type { SharedReading } from '../domain/tarot/share.ts'
import { Document } from './document.tsx'
import { PageShell } from './home-page.tsx'
import {
  buttonStyle,
  sharedPageLinkStyle,
  slotLabelStyle,
  slotWrapStyle,
  spreadRowStyle,
} from './public/reading-board.styles.ts'
import { ReadingResult } from './public/reading-result.tsx'
import { RevealedCard } from './public/revealed-card.tsx'

export function SharedReadingPage(handle: Handle<{ reading: SharedReading }>) {
  return () => (
    <Document title="Shared reading · Pseudo Tarot">
      <PageShell>
        <section aria-label="Your spread" mix={spreadRowStyle}>
          {handle.props.reading.interpretation.cards.map((card) => {
            const position = developerDeck.positions.find((item) => item.id === card.positionId)
            if (!position) return null
            return (
              <div key={position.id} data-position={position.id} mix={slotWrapStyle}>
                <span mix={slotLabelStyle}>{position.label.toUpperCase()}</span>
                <RevealedCard card={card} />
              </div>
            )
          })}
        </section>
        <ReadingResult
          question={handle.props.reading.question}
          interpretation={handle.props.reading.interpretation}
          actions={
            <a href="/" mix={[buttonStyle, sharedPageLinkStyle]}>
              Start a new reading
            </a>
          }
        />
      </PageShell>
    </Document>
  )
}

export function InvalidSharedReadingPage() {
  return () => (
    <Document title="Invalid shared reading · Pseudo Tarot">
      <PageShell>
        <section>
          <h1>The cards cannot read this timeline.</h1>
          <a href="/" mix={[buttonStyle, sharedPageLinkStyle]}>
            Start a new reading
          </a>
        </section>
      </PageShell>
    </Document>
  )
}
