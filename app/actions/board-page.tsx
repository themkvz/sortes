import { css, type Handle } from 'remix/ui'

import { Document } from './document.tsx'
import { QuestionForm } from './public/initial-board.tsx'

const POSITIONS = [
  { name: 'Context', hint: 'Choose a card first' },
  { name: 'Problem', hint: 'Choose a card first' },
  { name: 'Advice', hint: 'Choose a card first' },
]

export function BoardPage() {
  return () => (
    <Document>
      <main mix={mainStyle}>
        <div mix={containerStyle}>
          <Header />
          <section aria-label="Ask your question" mix={askAreaStyle}>
            <h1 mix={headingStyle}>Ask something you're overthinking.</h1>
            <QuestionForm />
          </section>
          <section aria-label="Your spread" mix={spreadSectionStyle}>
            <div mix={spreadHeaderStyle}>
              <span mix={mutedMonoStyle}>YOUR SPREAD</span>
              <span mix={mutedSmallStyle}>Ask first. Then choose and place three cards.</span>
            </div>
            <div mix={spreadRowStyle}>
              {POSITIONS.map((position) => (
                <SpreadSlot key={position.name} name={position.name} hint={position.hint} />
              ))}
            </div>
          </section>
          <DormantDeck />
        </div>
      </main>
    </Document>
  )
}

function Header() {
  return () => (
    <header mix={headerStyle}>
      <div mix={brandStyle}>
        <span aria-hidden="true" mix={brandMarkStyle}>
          <BrandSparkIcon />
        </span>
        <span mix={brandNameStyle}>PSEUDO TAROT</span>
      </div>
      <span mix={mutedMonoStyle}>PREVIEW</span>
    </header>
  )
}

function SpreadSlot(handle: Handle<{ name: string; hint: string }>) {
  return () => (
    <div mix={slotStyle}>
      <span aria-hidden="true" mix={slotIconStyle}>
        <SlotIcon />
      </span>
      <span mix={slotLabelStyle}>{handle.props.name.toUpperCase()}</span>
      <span mix={slotHintStyle}>{handle.props.hint}</span>
    </div>
  )
}

function DormantDeck() {
  const cards = Array.from({ length: 9 }, (_, index) => index)

  return () => (
    <section aria-label="Deck" mix={deckSectionStyle}>
      <div mix={deckLabelRowStyle}>
        <span mix={deckRuleStyle} />
        <span mix={deckCopyStyle}>9 CARDS WAITING FOR YOUR QUESTION</span>
        <span mix={deckRuleStyle} />
      </div>
      <div aria-hidden="true" mix={deckGridStyle}>
        {cards.map((index) => (
          <div key={index} mix={cardBackStyle}>
            <CardSymbolIcon />
          </div>
        ))}
      </div>
    </section>
  )
}

function BrandSparkIcon() {
  return () => (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
      <path
        d="M8 0v16M0 8h16M2.5 2.5l11 11M13.5 2.5l-11 11"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  )
}

function SlotIcon() {
  return () => (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

function CardSymbolIcon() {
  return () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path
        d="M12 2l3 7h7l-5.5 4.5L18.5 21 12 16.5 5.5 21 7.5 13.5 2 9h7z"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  )
}

const mainStyle = css({
  minHeight: '100vh',
  padding: '32px 16px 64px',
  '@media (min-width: 720px)': { padding: '48px 32px 96px' },
})

const containerStyle = css({
  maxWidth: '960px',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '40px',
})

const headerStyle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
})

const brandStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
})

const brandMarkStyle = css({
  display: 'flex',
  width: '24px',
  height: '24px',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 'var(--radius-control)',
  background: 'var(--color-card-back)',
  color: 'var(--color-teal)',
})

const brandNameStyle = css({
  fontFamily: 'var(--font-mono)',
  fontSize: '11px',
  letterSpacing: '0.08em',
  color: 'var(--color-text)',
})

const mutedMonoStyle = css({
  fontFamily: 'var(--font-mono)',
  fontSize: '10px',
  letterSpacing: '0.08em',
  color: 'var(--color-text-muted)',
})

const askAreaStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
})

const headingStyle = css({
  margin: 0,
  fontFamily: 'var(--font-display)',
  fontWeight: 400,
  fontSize: 'clamp(24px, 5vw, 36px)',
  lineHeight: 1.25,
  color: 'var(--color-text)',
})

const spreadSectionStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
})

const spreadHeaderStyle = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  alignItems: 'baseline',
  justifyContent: 'space-between',
})

const mutedSmallStyle = css({
  fontFamily: 'var(--font-body)',
  fontSize: '12px',
  color: 'var(--color-text-muted)',
})

const spreadRowStyle = css({
  display: 'flex',
  gap: '12px',
  '@media (min-width: 480px)': { gap: '16px' },
})

const slotStyle = css({
  flex: '1 1 0',
  minWidth: 0,
  aspectRatio: '200 / 132',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  padding: '12px 8px',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-card)',
  color: 'var(--color-text-muted)',
})

const slotIconStyle = css({ display: 'flex' })

const slotLabelStyle = css({
  fontFamily: 'var(--font-mono)',
  fontSize: '10px',
  letterSpacing: '0.08em',
  textAlign: 'center',
})

const slotHintStyle = css({
  fontFamily: 'var(--font-body)',
  fontSize: '11px',
  textAlign: 'center',
})

const deckSectionStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
})

const deckLabelRowStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
})

const deckRuleStyle = css({
  flex: '1 1 auto',
  height: '1px',
  background: 'var(--color-border)',
})

const deckCopyStyle = css({
  flex: '0 0 auto',
  fontFamily: 'var(--font-mono)',
  fontSize: '9px',
  letterSpacing: '0.08em',
  color: 'var(--color-text-muted)',
  whiteSpace: 'nowrap',
})

const deckGridStyle = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '10px',
  '@media (min-width: 640px)': { gridTemplateColumns: 'repeat(9, 1fr)' },
})

const cardBackStyle = css({
  aspectRatio: '82 / 116',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--color-card-back)',
  border: '1px solid var(--color-teal)',
  borderRadius: 'var(--radius-card)',
  color: 'var(--color-teal)',
})
