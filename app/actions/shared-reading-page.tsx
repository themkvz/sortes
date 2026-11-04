import type { Handle } from 'remix/component'
import { css } from 'remix/component'
import { developerDeck } from '../domain/tarot/decks/developer.ts'
import type { SharedReading } from '../domain/tarot/share.ts'
import { Document } from './document.tsx'
import { PageShell } from './home-page.tsx'
import { CardDetails } from './public/card-details.tsx'
import * as readingStyles from './public/reading.styles.ts'
import { ReadingResult } from './public/reading-result.tsx'
import { RevealedCard } from './public/revealed-card.tsx'
import { SiteHeader } from './public/site-header.tsx'

export function SharedReadingPage(handle: Handle<{ reading: SharedReading }>) {
  return () => (
    <Document title="Shared reading · Pseudo Tarot">
      <PageShell>
        <SiteHeader />
        <section aria-label="Your spread" mix={readingStyles.spreadSectionStyle}>
          <div mix={readingStyles.spreadRowStyle}>
            {developerDeck.positions.map((position) => {
              const card = handle.props.reading.interpretation.cards.find(
                (item) => item.positionId === position.id,
              )
              if (!card) return null
              return (
                <div
                  key={position.id}
                  data-position={position.id}
                  mix={readingStyles.slotWrapStyle}
                >
                  <span mix={readingStyles.slotLabelStyle}>{position.label.toUpperCase()}</span>
                  <RevealedCard key={position.id} card={card} />
                </div>
              )
            })}
          </div>
          <div mix={readingStyles.detailsListStyle}>
            {developerDeck.positions.map((position, positionIndex) => {
              const card = handle.props.reading.interpretation.cards.find(
                (item) => item.positionId === position.id,
              )
              if (!card) return null
              return (
                <CardDetails
                  key={position.id}
                  card={card}
                  positionIndex={positionIndex}
                  positionLabel={position.label}
                />
              )
            })}
          </div>
        </section>
        <ReadingResult
          question={handle.props.reading.question}
          interpretation={handle.props.reading.interpretation}
          actions={
            <a href="/" mix={[readingStyles.buttonStyle, sharedPageLinkStyle]}>
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
          <a href="/" mix={[readingStyles.buttonStyle, sharedPageLinkStyle]}>
            Start a new reading
          </a>
        </section>
      </PageShell>
    </Document>
  )
}

const sharedPageLinkStyle = css({
  display: 'inline-flex',
  alignItems: 'center',
  textDecoration: 'none',
})
