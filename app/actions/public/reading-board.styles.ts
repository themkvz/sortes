import { css } from 'remix/component'

const MOBILE = '@media (max-width: 767px)'
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
export const headerStyle = css({
  display: 'flex',
  height: '32px',
  alignItems: 'center',
  justifyContent: 'space-between',
  '@media (min-width: 720px)': { height: '48px' },
})
export const brandStyle = css({ display: 'flex', alignItems: 'center', gap: '10px' })
export const brandMarkStyle = css({
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
export const brandNameStyle = css({
  fontFamily: 'var(--font-mono)',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '1.6px',
  color: 'var(--color-text)',
})
export const stageMetaStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  fontFamily: 'var(--font-mono)',
})
export const stageNumberStyle = css({
  fontSize: '10px',
  color: 'var(--color-teal)',
  [MOBILE]: { fontSize: '9px' },
})
export const stageRuleStyle = css({
  width: '24px',
  height: '1px',
  background: 'var(--color-border)',
})
export const stageNameStyle = css({
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '1.2px',
  color: 'var(--color-text-muted)',
})
export const wideOnlyStyle = css({ [MOBILE]: { display: 'none' } })
export const mobileOnlyStyle = css({ '@media (min-width: 768px)': { display: 'none' } })
export const badgeStyle = css({
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
})
export const hintStyle = css({ fontFamily: 'var(--font-body)', fontSize: '12px' })
export const liveStatusStyle = css({ '&[data-quiet]': visuallyHidden })
export const formRowStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  flexWrap: 'nowrap',
})
export const submitButtonStyle = css({
  boxSizing: 'border-box',
  width: '160px',
  minWidth: '160px',
  height: '56px',
  padding: '8px',
  fontSize: '14px',
  '@media (max-width: 599px)': {
    width: '110px',
    minWidth: '96px',
    height: '48px',
    fontSize: '13px',
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
export const spreadSectionStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  width: '100%',
  maxWidth: '828px',
  alignSelf: 'center',
})
export const spreadHeaderStyle = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  minHeight: '32px',
  alignItems: 'center',
  justifyContent: 'space-between',
})
export const mutedMonoStyle = css({
  fontFamily: 'var(--font-mono)',
  fontSize: '11px',
  letterSpacing: '0.08em',
  color: 'var(--color-text-muted)',
})
export const mutedSmallStyle = css({
  fontFamily: 'var(--font-body)',
  fontSize: '12px',
  color: 'var(--color-text-muted)',
})
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
  '&[data-drop-target] > button': {
    background: 'var(--color-selected-surface)',
    borderColor: 'var(--color-teal)',
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
export const frontFrameStyle = css({
  position: 'relative',
  width: '100%',
  maxWidth: '100%',
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
  width: '100%',
  maxWidth: '828px',
  alignSelf: 'center',
  overflowWrap: 'anywhere',
  fontFamily: 'var(--font-body)',
  color: 'var(--color-text)',
})
export const detailsListStyle = css({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '24px',
  '&:empty': { display: 'none' },
  '@media (min-width: 768px)': {
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '54px',
  },
})
export const detailsStyle = css({
  gridColumn: '1',
  minWidth: 0,
  overflowWrap: 'anywhere',
  '& h2': {
    margin: '0 0 8px',
    fontFamily: 'var(--font-display)',
    fontSize: '20px',
    fontWeight: 400,
    lineHeight: 1.25,
  },
  '& p': { margin: '8px 0 0', fontSize: '16px', lineHeight: 1.5 },
  '@media (min-width: 768px)': {
    '&[data-card-column="2"]': { gridColumn: '2' },
    '&[data-card-column="3"]': { gridColumn: '3' },
  },
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
export const deckSectionStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  marginTop: '18px',
  '@media (max-width: 767px)': { marginTop: 0 },
})
export const deckLabelRowStyle = css({ display: 'flex', alignItems: 'center', gap: '14px' })
export const deckRuleStyle = css({
  flex: '1 1 auto',
  height: '1px',
  background: 'var(--color-border)',
})
export const deckCopyStyle = css({
  flex: '0 0 auto',
  fontFamily: 'var(--font-mono)',
  fontSize: '11px',
  letterSpacing: '0.08em',
  color: 'var(--color-text-muted)',
})
export const deckGridStyle = css({
  boxSizing: 'border-box',
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '10px 14px',
  width: '100%',
  maxWidth: '390px',
  margin: '0 auto',
  '& > :nth-child(1), & > :nth-child(9)': { transform: 'none' },
  '@media (min-width: 1024px)': {
    gridTemplateColumns: 'repeat(9, 82px)',
    gap: '14px',
    maxWidth: '1000px',
    minHeight: '156px',
    padding: '0 0 16px',
    alignContent: 'start',
    justifyContent: 'center',
    '& > :nth-child(1), & > :nth-child(9)': { transform: 'translateY(24px)' },
    '& > :nth-child(2)': { transform: 'translateY(14px)' },
    '& > :nth-child(3)': { transform: 'translateY(7px)' },
    '& > :nth-child(4)': { transform: 'translateY(2px)' },
    '& > :nth-child(5)': { transform: 'none' },
    '& > :nth-child(6)': { transform: 'translateY(3px)' },
    '& > :nth-child(7)': { transform: 'translateY(8px)' },
    '& > :nth-child(8)': { transform: 'translateY(15px)' },
  },
})
export const cardBackStyle = css({
  boxSizing: 'border-box',
  position: 'relative',
  width: '100%',
  minHeight: '64px',
  aspectRatio: 'auto',
  border: '1px solid var(--color-teal)',
  borderRadius: '12px',
  background: 'var(--color-card-back) url(/cards/card-back.webp) center / auto 52px no-repeat',
  cursor: 'pointer',
  '&[data-picked]': { cursor: 'not-allowed' },
  '&:disabled:not([data-picked])': { opacity: 0.55 },
  '@media (hover: hover) and (pointer: fine)': {
    '&:not(:disabled):not([data-selected]):hover': {
      borderColor: 'var(--color-amber)',
      boxShadow: '0 10px 18px #00000088',
    },
  },
  '@media (min-width: 1024px)': {
    minHeight: '116px',
    aspectRatio: '82 / 116',
    backgroundSize: 'contain',
  },
  '&:focus-visible': { outline: '2px solid var(--color-focus)', outlineOffset: '2px' },
})
