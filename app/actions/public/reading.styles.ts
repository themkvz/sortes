import { css } from 'remix/component'

export const buttonStyle = css({
  appearance: 'none',
  border: 'none',
  minWidth: '140px',
  minHeight: '48px',
  padding: '0 20px',
  fontFamily: 'var(--font-body)',
  fontSize: '15px',
  color: 'var(--color-card-ink)',
  background: 'var(--color-amber)',
  borderRadius: 'var(--radius-control)',
  cursor: 'pointer',
  '&:disabled': { opacity: 0.55 },
  '&:focus-visible': { outline: '2px solid var(--color-focus)', outlineOffset: '2px' },
})
export const iconButtonStyle = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
})
export const secondaryButtonStyle = css({
  background: 'transparent',
  color: 'var(--color-text)',
  boxShadow: 'inset 0 0 0 1px var(--color-border)',
  '@media (hover: hover) and (pointer: fine)': {
    '&:hover': { boxShadow: 'inset 0 0 0 1px var(--color-text-muted)' },
  },
})
export const spreadSectionStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  width: '100%',
  maxWidth: '828px',
  alignSelf: 'center',
})
export const spreadRowStyle = css({
  position: 'relative',
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  '@media (min-width: 768px)': { gap: '54px' },
  '@media (min-width: 1024px)': {
    '&::before, &::after': {
      content: '""',
      position: 'absolute',
      zIndex: -1,
      top: '50%',
      left: '50%',
      borderRadius: '50%',
      pointerEvents: 'none',
      transform: 'translate(-50%, -50%)',
    },
    '&::before': { width: '970px', height: '720px', border: '1px solid #68B5A20A' },
    '&::after': { width: '740px', height: '550px', border: '1px solid #F1A64B0D' },
  },
})
export const slotWrapStyle = css({
  position: 'relative',
  flex: '1 1 0',
  minWidth: 0,
  minHeight: 0,
  boxSizing: 'border-box',
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px',
  '& > button': { transition: 'transform 120ms ease-out, box-shadow 120ms ease-out' },
  '&[data-drop-target] > button': {
    background: 'var(--color-selected-surface)',
    borderColor: 'var(--color-focus)',
    boxShadow: '0 0 0 2px var(--color-focus)',
    transform: 'scale(1.03)',
  },
  '&[data-drop-target] [data-slot-hint]': { color: 'var(--color-text)' },
  '@media (prefers-reduced-motion: reduce)': {
    '& > button': { transition: 'none' },
    '&[data-drop-target] > button': { transform: 'none' },
  },
})
export const slotLabelStyle = css({
  position: 'absolute',
  bottom: 'calc(100% + 6px)',
  fontFamily: 'var(--font-mono)',
  fontSize: '11px',
  letterSpacing: '0.08em',
  color: 'var(--color-text-muted)',
})
export const detailsListStyle = css({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '24px',
  '&:empty': { display: 'none' },
  '@media (min-width: 768px)': {
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '54px',
    alignItems: 'stretch',
  },
})
