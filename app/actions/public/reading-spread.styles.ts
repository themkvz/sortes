import { css } from 'remix/component'

const MOBILE = '@media (max-width: 767px)'
export const spreadHeaderStyle = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '6px',
  textAlign: 'center',
  // Room for the position labels that sit above placed cards.
  marginBottom: '24px',
})
export const spreadTitleStyle = css({
  margin: 0,
  fontFamily: 'var(--font-display)',
  fontSize: '28px',
  fontWeight: 400,
  lineHeight: 1.1,
  color: 'var(--color-text)',
})
export const spreadInstructionStyle = css({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  alignItems: 'baseline',
  columnGap: '12px',
  rowGap: '4px',
  margin: 0,
})
export const guideTextStyle = css({ fontSize: '17px', color: 'var(--color-text)' })
export const guideProgressStyle = css({ fontSize: '14px', color: 'var(--color-teal)' })
export const spreadGateStyle = css({
  position: 'absolute',
  inset: 0,
  zIndex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '24px',
  textAlign: 'center',
  background: 'color-mix(in srgb, var(--color-table) 84%, transparent)',
  borderRadius: 'var(--radius-card)',
  cursor: 'pointer',
})
export const spreadGateTitleStyle = css({
  margin: 0,
  fontFamily: 'var(--font-display)',
  fontSize: '32px',
  lineHeight: 1.1,
  color: 'var(--color-amber)',
  '@media (max-width: 599px)': { fontSize: '24px' },
})
export const spreadGateCopyStyle = css({
  margin: 0,
  maxWidth: '32ch',
  fontSize: '16px',
  lineHeight: 1.45,
  color: 'var(--color-text)',
})
export const revealAllStyle = css({ alignSelf: 'center', marginTop: '8px' })
export const commitmentStyle = css({
  margin: 0,
  minHeight: '36px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  '& svg': { color: 'var(--color-amber)' },
  fontSize: '12px',
  lineHeight: 1.5,
  color: 'var(--color-text-muted)',
})

export const wideOnlyStyle = css({ [MOBILE]: { display: 'none' } })
export const mobileOnlyStyle = css({ '@media (min-width: 768px)': { display: 'none' } })

export const emptySlotStyle = css({
  position: 'relative',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  minWidth: '48px',
  minHeight: '116px',
  aspectRatio: '240 / 330',
  border: '1px solid var(--color-control-border)',
  borderRadius: 'var(--radius-card)',
  background: 'var(--color-surface)',
  gap: '8px',
  color: 'var(--color-text-muted)',
  fontFamily: 'inherit',
  fontSize: '11px',
  cursor: 'pointer',
  '& [data-slot-number], & [data-slot-name]': {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
  },
  '& [data-slot-name]': { fontWeight: 600, letterSpacing: '1px' },
  '& [data-slot-icon]': { lineHeight: 0, color: 'var(--color-border)' },
  '& [data-slot-hint]': { fontFamily: 'var(--font-body)', fontSize: '12px' },
  '& [data-slot-prompt]': {
    position: 'absolute',
    bottom: '24px',
    maxWidth: '90%',
    textAlign: 'center',
    fontFamily: 'var(--font-body)',
    fontSize: '13px',
  },
  '&[data-eligible]': {
    borderColor: 'var(--color-teal)',
    background: 'var(--color-selected-surface)',
  },
  '&[data-eligible] [data-slot-icon], &[data-eligible] [data-slot-name], &[data-eligible] [data-slot-hint]':
    { color: 'var(--color-teal)' },
  '&:disabled': { cursor: 'default', borderColor: 'var(--color-border)' },
  [MOBILE]: {
    '& [data-slot-prompt], & [data-slot-hint]': { display: 'none' },
    '&[data-eligible]': { borderRadius: 'var(--radius-control)' },
    '&[data-eligible] [data-slot-name]': { fontSize: '8px' },
  },
  '&:focus-visible': { outline: '2px solid var(--color-focus)', outlineOffset: '2px' },
})
export const faceDownStyle = css({
  boxSizing: 'border-box',
  position: 'relative',
  display: 'grid',
  placeItems: 'center',
  width: '100%',
  maxWidth: '100%',
  minWidth: '48px',
  minHeight: '48px',
  aspectRatio: '240 / 330',
  padding: 0,
  border: '1px solid var(--color-teal)',
  borderRadius: '12px',
  background: 'var(--color-card-back) url(/cards/card-back.webp) center / contain no-repeat',
  cursor: 'pointer',
  '&:not(:disabled)': { borderColor: 'var(--color-amber)' },
  '&:focus-visible': { outline: '2px solid var(--color-focus)', outlineOffset: '2px' },
})
