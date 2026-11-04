import { css } from 'remix/component'

const visuallyHidden = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
} as const

export const boardShellStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  width: '100%',
  '@media (min-width: 720px)': { gap: '20px' },
})
export const boardStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
  width: '100%',
  maxWidth: '1000px',
  margin: '0 auto',
})
export const dragPreviewStyle = css({
  boxSizing: 'border-box',
  position: 'fixed',
  zIndex: 10,
  width: '82px',
  maxWidth: 'calc(100vw - 2px)',
  maxHeight: 'calc(100vh - 2px)',
  aspectRatio: '82 / 116',
  border: '1px solid var(--color-teal)',
  borderRadius: 'var(--radius-card)',
  background: 'var(--color-card-back) url(/cards/card-back.webp) center / contain no-repeat',
  boxShadow: '0 18px 32px #000000aa',
  pointerEvents: 'none',
  transform: 'translate(-50%, -50%) rotate(-4deg) scale(1.06)',
  '@media (prefers-reduced-motion: reduce)': { transform: 'translate(-50%, -50%)' },
})
export const askStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  width: '100%',
  maxWidth: '828px',
  alignSelf: 'center',
})
export const headingStyle = css({
  margin: 0,
  fontFamily: 'var(--font-display)',
  fontWeight: 400,
  fontSize: 'clamp(24px, 5vw, 36px)',
  lineHeight: 1.05,
  color: 'var(--color-text)',
  textAlign: 'center',
})
export const labelStyle = css({
  position: 'absolute',
  top: '12px',
  left: '14px',
  fontFamily: 'var(--font-mono)',
  fontSize: '11px',
  letterSpacing: '0.08em',
  color: 'var(--color-text-muted)',
})
export const fieldStyle = css({ position: 'relative', flex: '1 1 auto', minWidth: 0 })
export const formStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  '@media (max-width: 719px)': { gap: '8px' },
})
export const statusStyle = css({
  display: 'flex',
  alignItems: 'center',
  minHeight: '48px',
  margin: 0,
  fontSize: '13px',
  color: 'var(--color-text-muted)',
  '@media (max-width: 719px)': { minHeight: '24px' },
  // Once a reading starts only the hidden live status remains, so the row takes no space.
  '&[data-quiet]': { minHeight: 0 },
})
export const hintStyle = css({ fontFamily: 'var(--font-body)', fontSize: '12px' })
export const liveStatusStyle = css({ '&[data-quiet]': visuallyHidden })
export const formRowStyle = css({
  display: 'flex',
  alignItems: 'stretch',
  gap: '12px',
  flexWrap: 'nowrap',
})
export const submitButtonStyle = css({
  boxSizing: 'border-box',
  width: '180px',
  minWidth: '180px',
  padding: '8px 16px',
  fontSize: '16px',
  fontWeight: 600,
  transition:
    'background-color 160ms ease-out, transform 160ms ease-out, box-shadow 200ms ease-out',
  '@media (hover: hover) and (pointer: fine)': {
    '&:not(:disabled):hover': { background: '#F6B862', transform: 'translateY(-1px)' },
  },
  '&:not(:disabled):active': { transform: 'scale(0.98)' },
  // Once a reading starts the question is locked; show that plainly instead of a dimmed CTA.
  '&:disabled': {
    opacity: 1,
    cursor: 'default',
    background: 'transparent',
    color: 'var(--color-text-muted)',
    boxShadow: 'inset 0 0 0 1px var(--color-border)',
  },
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'none',
    '&:not(:disabled):hover, &:not(:disabled):active': { transform: 'none' },
  },
  whiteSpace: 'nowrap',
  '@media (max-width: 599px)': {
    width: '120px',
    minWidth: '104px',
    padding: '8px 10px',
    fontSize: '15px',
    '& svg': { display: 'none' },
  },
})
export const inputStyle = css({
  boxSizing: 'border-box',
  width: '100%',
  minWidth: 0,
  height: '70px',
  padding: '28px 14px 10px',
  fontFamily: 'inherit',
  fontSize: '16px',
  color: 'var(--color-text)',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-control-border)',
  borderRadius: 'var(--radius-control)',
  '&::placeholder': { color: 'var(--color-text-muted)' },
  '&:focus-visible': { outline: '2px solid var(--color-focus)', outlineOffset: '2px' },
})
export const errorStyle = css({ color: 'var(--color-amber)' })
