import type { Handle } from 'remix/component'
import { css } from 'remix/component'

import { Icon } from './icons.tsx'

const badgeIcons = { selected: 'check', placed: 'lock', revealable: 'sparkles' } as const

export function CardBadge(handle: Handle<{ kind: keyof typeof badgeIcons }>) {
  return () => (
    <span aria-hidden="true" data-badge={handle.props.kind} mix={badgeStyle}>
      <Icon name={badgeIcons[handle.props.kind]} size={12} />
    </span>
  )
}

const badgeStyle = css({
  boxSizing: 'border-box',
  position: 'absolute',
  top: '4px',
  right: '4px',
  display: 'grid',
  placeItems: 'center',
  width: '26px',
  height: '26px',
  border: '3px solid var(--color-table)',
  borderRadius: '50%',
  background: 'var(--color-teal)',
  color: 'var(--color-card-ink)',
  pointerEvents: 'none',
  '&[data-badge="revealable"]': { background: 'var(--color-amber)' },
})
