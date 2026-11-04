import type { Handle, RemixNode } from 'remix/component'
import { css } from 'remix/component'

import type { ReadingSnapshot } from '../domain/tarot/snapshot.ts'
import { Document } from './document.tsx'
import { ReadingBoard } from './public/reading-board.tsx'

/** `restored` is the reading saved in this browser session, already opened and validated. */
export function HomePage(handle: Handle<{ restored?: ReadingSnapshot }>) {
  return () => (
    <Document>
      <PageShell>
        <ReadingBoard restored={handle.props.restored} />
      </PageShell>
    </Document>
  )
}

export function PageShell(handle: Handle<{ children?: RemixNode }>) {
  return () => (
    <main mix={mainStyle}>
      <div mix={containerStyle}>{handle.props.children}</div>
    </main>
  )
}

const mainStyle = css({
  // Sparkle bursts may fly past the screen edge; clip them without creating a scroll container.
  overflowX: 'clip',
  boxSizing: 'border-box',
  minHeight: '100svh',
  padding: '16px 16px 40px',
  '@media (min-width: 720px)': { padding: '42px 56px 44px' },
})
const containerStyle = css({
  maxWidth: '1328px',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  '@media (min-width: 720px)': { gap: '20px' },
})
