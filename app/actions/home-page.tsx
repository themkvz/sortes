import { css } from 'remix/component'

import { Document } from './document.tsx'
import { ReadingBoard } from './public/reading-board.tsx'

export function HomePage() {
  return () => (
    <Document>
      <main mix={mainStyle}>
        <div mix={containerStyle}>
          <header mix={headerStyle}>
            <div mix={brandStyle}>
              <span aria-hidden="true" mix={brandMarkStyle}>
                <BrandSparkIcon />
              </span>
              <span mix={brandNameStyle}>PSEUDO TAROT</span>
            </div>
          </header>
          <ReadingBoard />
        </div>
      </main>
    </Document>
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
const headerStyle = css({ display: 'flex', alignItems: 'center', justifyContent: 'space-between' })
const brandStyle = css({ display: 'flex', alignItems: 'center', gap: '10px' })
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
