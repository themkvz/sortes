import { css } from 'remix/component'

export const boardStyle = css({ display: 'flex', flexDirection: 'column', gap: '40px' })
export const dragPreviewStyle = css({
  boxSizing: 'border-box',
  position: 'fixed',
  zIndex: 10,
  width: '56px',
  maxWidth: 'calc(100vw - 2px)',
  maxHeight: 'calc(100vh - 2px)',
  aspectRatio: '82 / 116',
  border: '1px solid var(--color-teal)',
  borderRadius: '8px',
  background: 'var(--color-card-back) url(/cards/card-back.webp) center / contain no-repeat',
  pointerEvents: 'none',
  transform: 'translate(-50%, -50%)',
})
export const askStyle = css({ display: 'flex', flexDirection: 'column', gap: '20px' })
export const headingStyle = css({
  margin: 0,
  fontFamily: 'var(--font-display)',
  fontWeight: 400,
  fontSize: 'clamp(24px, 5vw, 36px)',
  lineHeight: 1.25,
  color: 'var(--color-text)',
})
export const labelStyle = css({
  display: 'block',
  fontFamily: 'var(--font-mono)',
  fontSize: '10px',
  letterSpacing: '0.08em',
  color: 'var(--color-text-muted)',
  marginBottom: '8px',
})
export const formRowStyle = css({ display: 'flex', gap: '12px', flexWrap: 'wrap' })
export const inputStyle = css({
  flex: '1 1 240px',
  minWidth: 0,
  height: '48px',
  padding: '0 14px',
  fontFamily: 'var(--font-body)',
  fontSize: '14px',
  color: 'var(--color-text)',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-control)',
  '&::placeholder': { color: 'var(--color-text-muted)' },
  '&:focus-visible': { outline: '2px solid var(--color-focus)', outlineOffset: '2px' },
})
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
export const errorStyle = css({ color: 'var(--color-amber)' })
export const spreadSectionStyle = css({ display: 'flex', flexDirection: 'column', gap: '16px' })
export const spreadHeaderStyle = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  justifyContent: 'space-between',
})
export const mutedMonoStyle = css({
  fontFamily: 'var(--font-mono)',
  fontSize: '10px',
  letterSpacing: '0.08em',
  color: 'var(--color-text-muted)',
})
export const mutedSmallStyle = css({
  fontFamily: 'var(--font-body)',
  fontSize: '12px',
  color: 'var(--color-text-muted)',
})
export const spreadRowStyle = css({
  display: 'flex',
  gap: '12px',
  '@media (min-width: 480px)': { gap: '16px' },
})
export const slotWrapStyle = css({
  flex: '1 1 0',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px',
  '&[data-drop-target]': { outline: '2px dashed var(--color-focus)', outlineOffset: '3px' },
})
export const slotLabelStyle = css({
  fontFamily: 'var(--font-mono)',
  fontSize: '10px',
  letterSpacing: '0.08em',
  color: 'var(--color-text-muted)',
})
export const emptySlotStyle = css({
  width: '100%',
  minHeight: '116px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-card)',
  background: 'var(--color-surface)',
  color: 'var(--color-text-muted)',
  cursor: 'pointer',
  '&:focus-visible': { outline: '2px solid var(--color-focus)', outlineOffset: '2px' },
})
export const faceDownStyle = css({
  width: '82px',
  maxWidth: '100%',
  aspectRatio: '82 / 116',
  padding: 0,
  border: '1px solid var(--color-teal)',
  borderRadius: '12px',
  background: 'var(--color-card-back) url(/cards/card-back.webp) center / contain no-repeat',
  cursor: 'pointer',
  '&:focus-visible': { outline: '2px solid var(--color-focus)', outlineOffset: '2px' },
})
export const revealedStyle = css({
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  width: '100%',
  minHeight: '116px',
  padding: '10px',
  overflowWrap: 'anywhere',
  border: '1px solid var(--color-teal)',
  borderRadius: '12px',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-body)',
  fontSize: '12px',
})
export const frontFrameStyle = css({
  position: 'relative',
  width: '100%',
  maxWidth: '164px',
  aspectRatio: '82 / 116',
  alignSelf: 'center',
  background: 'var(--color-card-back)',
  perspective: '800px',
})
export const frontFaceStyle = css({
  position: 'absolute',
  inset: 0,
  backfaceVisibility: 'hidden',
  pointerEvents: 'none',
})
export const backFaceStyle = css({
  position: 'absolute',
  inset: 0,
  backfaceVisibility: 'hidden',
  pointerEvents: 'none',
  background: 'var(--color-card-back) url(/cards/card-back.webp) center / contain no-repeat',
  transform: 'rotateY(180deg)',
})
export const frontImageStyle = css({
  position: 'absolute',
  inset: 0,
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  '&[hidden]': { display: 'none' },
})
export const resultStyle = css({
  overflowWrap: 'anywhere',
  fontFamily: 'var(--font-body)',
  color: 'var(--color-text)',
})
export const resultActionsStyle = css({ display: 'flex', flexWrap: 'wrap', gap: '12px' })
export const shareDialogStyle = css({
  boxSizing: 'border-box',
  width: 'min(32rem, calc(100vw - 32px))',
  maxWidth: 'none',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-panel)',
  padding: '24px',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-body)',
  '&::backdrop': { background: 'rgba(0, 0, 0, 0.72)' },
})
export const shareDialogActionsStyle = css({ display: 'flex', flexWrap: 'wrap', gap: '12px' })
export const shareUrlStyle = css({
  boxSizing: 'border-box',
  width: '100%',
  minWidth: 0,
  height: '48px',
  marginTop: '8px',
  padding: '10px',
  border: '1px solid var(--color-teal)',
  borderRadius: 'var(--radius-control)',
  background: 'var(--color-table)',
  color: 'var(--color-text)',
  font: 'inherit',
  '&:focus-visible': { outline: '2px solid var(--color-focus)', outlineOffset: '2px' },
})
export const shareUrlOutputStyle = css({ flexBasis: '100%', minWidth: 0 })
export const sharedPageLinkStyle = css({
  display: 'inline-flex',
  alignItems: 'center',
  textDecoration: 'none',
})
export const deckSectionStyle = css({ display: 'flex', flexDirection: 'column', gap: '16px' })
export const deckLabelRowStyle = css({ display: 'flex', alignItems: 'center', gap: '14px' })
export const deckRuleStyle = css({
  flex: '1 1 auto',
  height: '1px',
  background: 'var(--color-border)',
})
export const deckCopyStyle = css({
  flex: '0 0 auto',
  fontFamily: 'var(--font-mono)',
  fontSize: '9px',
  letterSpacing: '0.08em',
  color: 'var(--color-text-muted)',
})
export const deckGridStyle = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '10px',
  '@media (min-width: 640px)': { gridTemplateColumns: 'repeat(9, 1fr)' },
})
export const cardBackStyle = css({
  width: '100%',
  aspectRatio: '82 / 116',
  border: '1px solid var(--color-teal)',
  borderRadius: '12px',
  background: 'var(--color-card-back) url(/cards/card-back.webp) center / contain no-repeat',
  cursor: 'pointer',
  '&:focus-visible': { outline: '2px solid var(--color-focus)', outlineOffset: '2px' },
})
export const selectedStyle = css({ outline: '2px solid var(--color-amber)', outlineOffset: '2px' })
