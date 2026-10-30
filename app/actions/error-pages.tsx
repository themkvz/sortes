import { css } from 'remix/component'

import { Document } from './document.tsx'

export function NotFoundPage() {
  return () => (
    <Document title="Not found — Pseudo Tarot">
      <main
        mix={css({
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '24px',
          textAlign: 'center',
        })}
      >
        <h1 mix={css({ margin: 0, fontFamily: 'var(--font-display)', fontSize: '32px' })}>
          Page not found
        </h1>
        <p mix={css({ margin: 0, color: 'var(--color-text-muted)' })}>
          There is nothing at this address.
        </p>
        <a
          href="/"
          mix={css({
            color: 'var(--color-amber)',
            fontFamily: 'var(--font-mono)',
            fontSize: '14px',
            '&:focus-visible': { outline: '2px solid var(--color-focus)', outlineOffset: '4px' },
          })}
        >
          Return to the board
        </a>
      </main>
    </Document>
  )
}
