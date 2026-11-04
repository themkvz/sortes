import type { Handle, RemixNode } from 'remix/component'
import { css } from 'remix/component'

import { Icon } from './icons.tsx'

export function SiteHeader(handle: Handle<{ children?: RemixNode }>) {
  return () => (
    <header mix={headerStyle}>
      <div mix={brandStyle}>
        <span aria-hidden="true" mix={brandMarkStyle}>
          <Icon name="sparkles" size={16} />
        </span>
        <span mix={brandNameStyle}>PSEUDO TAROT</span>
      </div>
      {handle.props.children}
    </header>
  )
}

const headerStyle = css({
  display: 'flex',
  height: '32px',
  alignItems: 'center',
  justifyContent: 'space-between',
  '@media (min-width: 720px)': { height: '48px' },
})
const brandStyle = css({ display: 'flex', alignItems: 'center', gap: '10px' })
const brandMarkStyle = css({
  boxSizing: 'border-box',
  display: 'flex',
  width: '28px',
  height: '28px',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid var(--color-teal)',
  borderRadius: '14px',
  background: 'var(--color-card-back)',
  color: 'var(--color-teal)',
})
const brandNameStyle = css({
  fontFamily: 'var(--font-mono)',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '1.6px',
  color: 'var(--color-text)',
})
