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
  transition: 'background-color 160ms ease-out, transform 160ms ease-out',
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
  perspective: '900px',
})
export const flipCardStyle = css({
  position: 'absolute',
  inset: 0,
  transformStyle: 'preserve-3d',
})
export const frontFaceStyle = css({
  position: 'absolute',
  inset: 0,
  overflow: 'hidden',
  borderRadius: 'var(--radius-card)',
  background: 'var(--color-card-back)',
  backfaceVisibility: 'hidden',
  pointerEvents: 'none',
})
export const backFaceStyle = css({
  position: 'absolute',
  inset: 0,
  borderRadius: 'var(--radius-card)',
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
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
  width: '100%',
  maxWidth: '828px',
  alignSelf: 'center',
  overflowWrap: 'anywhere',
  fontFamily: 'var(--font-body)',
  color: 'var(--color-text)',
})
// The verdict is printed on the card-face parchment, the one light surface on the table.
export const resultPanelStyle = css({
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '12px',
  padding: '40px 32px 44px',
  borderRadius: 'var(--radius-panel)',
  background: 'var(--color-card-face)',
  color: 'var(--color-card-ink)',
  textAlign: 'center',
  // The verdict surfaces like ink on parchment: from faint and blurred to sharp.
  transition:
    'opacity 900ms cubic-bezier(0.2, 0.7, 0.2, 1), filter 900ms cubic-bezier(0.2, 0.7, 0.2, 1), transform 900ms cubic-bezier(0.2, 0.7, 0.2, 1)',
  '@starting-style': {
    opacity: 0,
    filter: 'blur(10px)',
    transform: 'translateY(16px) scale(0.98)',
  },
  '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
  '@media (max-width: 599px)': { padding: '28px 20px 32px' },
  '& [data-result-question]': {
    margin: 0,
    fontSize: '15px',
    lineHeight: 1.45,
    color: 'color-mix(in srgb, var(--color-card-ink) 72%, transparent)',
    '&::before': { content: '"You asked: "' },
  },
  '& [data-verdict]': {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: '8px 0 0',
    fontFamily: 'var(--font-body)',
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--color-card-ink)',
    '&:focus-visible': { outline: '2px solid var(--color-card-ink)', outlineOffset: '4px' },
    '& svg': { color: '#B0701F' },
  },
  '& [data-result-verdict]': {
    maxWidth: '34ch',
    margin: 0,
    fontFamily: 'var(--font-display)',
    fontSize: '28px',
    lineHeight: 1.35,
    textWrap: 'balance',
    '@media (max-width: 599px)': { fontSize: '22px' },
  },
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
export const detailsStyle = css({
  gridColumn: '1',
  minWidth: 0,
  boxSizing: 'border-box',
  padding: '20px',
  overflowWrap: 'anywhere',
  borderRadius: 'var(--radius-card)',
  background: 'var(--color-surface)',
  '& h2': {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    margin: 0,
    fontWeight: 400,
  },
  '& [data-detail-position]': {
    fontSize: '14px',
    lineHeight: 1.3,
    color: 'var(--color-teal)',
  },
  '& [data-detail-name]': {
    fontFamily: 'var(--font-display)',
    fontSize: '24px',
    lineHeight: 1.15,
    color: 'var(--color-text)',
  },
  // The position meaning is the reading itself, so it leads; the card's tagline follows quietly.
  '& [data-detail-meaning]': {
    margin: '14px 0 0',
    fontSize: '17px',
    lineHeight: 1.5,
    color: 'var(--color-text)',
  },
  '& [data-detail-summary]': {
    margin: '10px 0 0',
    fontSize: '15px',
    lineHeight: 1.45,
    fontStyle: 'italic',
    color: 'var(--color-text-muted)',
  },
  '@media (min-width: 768px)': {
    '&[data-card-column="2"]': { gridColumn: '2' },
    '&[data-card-column="3"]': { gridColumn: '3' },
  },
})

export const resultActionsStyle = css({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: '12px',
})
export const shareDialogStyle = css({
  boxSizing: 'border-box',
  width: 'min(30rem, calc(100vw - 32px))',
  maxWidth: 'none',
  margin: 'auto',
  border: 'none',
  borderRadius: 'var(--radius-panel)',
  padding: '32px',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-body)',
  // A dialog truly floats, so it is the one surface here that earns a shadow.
  boxShadow: '0 24px 64px #000000b3',
  '@media (max-width: 599px)': { padding: '24px' },
  '& h2': {
    margin: 0,
    fontFamily: 'var(--font-display)',
    fontSize: '28px',
    fontWeight: 400,
    lineHeight: 1.15,
  },
  '& > p': {
    margin: '12px 0 28px',
    fontSize: '16px',
    lineHeight: 1.5,
    color: 'var(--color-text-muted)',
  },
  '&::backdrop': { background: 'rgba(5, 7, 6, 0.8)' },
})

export const shareDialogActionsStyle = css({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px',
  '@media (max-width: 599px)': {
    flexDirection: 'column-reverse',
    '& > button': { width: '100%' },
  },
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
  // Idle choices are disabled; let clicks reach the grid so it can point to the question.
  '&[data-idle]': { cursor: 'pointer' },
  '&[data-idle] > button': { pointerEvents: 'none' },
  // Flex rather than a fixed grid, so the deck stays centred as placed cards leave it.
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: '10px 14px',
  width: '100%',
  maxWidth: '390px',
  margin: '0 auto',
  '& > button': { flex: '0 0 calc((100% - 28px) / 3)' },
  '@media (min-width: 1024px)': {
    flexWrap: 'nowrap',
    gap: '14px',
    maxWidth: '1000px',
    minHeight: '156px',
    padding: '0 0 16px',
    alignItems: 'flex-start',
    // The shallow arc follows the cards still in the deck, set per card in --deck-offset.
    '& > button': { flex: '0 0 82px', transform: 'translateY(var(--deck-offset, 0px))' },
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
  background: 'var(--color-card-back)',
  cursor: 'pointer',
  transition: 'background-color 280ms ease-out, border-color 280ms ease-out',
  // The artwork is its own layer so it can leave the deck while the slot stays in place.
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    borderRadius: 'inherit',
    background: 'url(/cards/card-back.webp) center / auto 52px no-repeat',
    transition: 'opacity 280ms ease-out, transform 280ms ease-out',
    pointerEvents: 'none',
  },
  '&:disabled:not([data-picked])': { opacity: 0.55 },
  // A placed card lifts out of the deck and leaves an empty outline behind.
  '&[data-picked], &[data-dragging]': {
    background: 'transparent',
    borderStyle: 'dashed',
    borderColor: 'var(--color-border)',
  },
  // After its lift-out, a placed card leaves the deck and the remaining cards close the gap.
  '&[data-picked]': {
    display: 'none',
    transition:
      'display 280ms allow-discrete, background-color 280ms ease-out, border-color 280ms ease-out',
  },
  '&[data-dragging]': { cursor: 'grabbing' },
  '&[data-picked]::before, &[data-dragging]::before': {
    opacity: 0,
    transform: 'translateY(-24px) scale(0.92)',
  },
  '@media (hover: hover) and (pointer: fine)': {
    '&:not(:disabled):not([data-selected]):hover': {
      borderColor: 'var(--color-amber)',
      boxShadow: '0 10px 18px #00000088',
    },
  },
  '@media (min-width: 1024px)': {
    minHeight: '116px',
    aspectRatio: '82 / 116',
    '&::before': { backgroundSize: 'contain' },
  },
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'none',
    '&[data-picked]': { transition: 'none' },
    '&::before': { transition: 'none' },
  },
  '&:focus-visible': { outline: '2px solid var(--color-focus)', outlineOffset: '2px' },
})
