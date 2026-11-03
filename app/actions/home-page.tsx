import type { Handle, RemixNode } from 'remix/component'
import { css } from 'remix/component'

import { Document } from './document.tsx'
import { ReadingBoard } from './public/reading-board.tsx'

export function HomePage() {
  return () => (
    <Document>
      <PageShell>
        <ReadingBoard />
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
