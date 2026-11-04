import { css } from 'remix/component'

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
