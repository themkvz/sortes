import { css } from 'remix/component'

// Every effect here animates only transform and opacity so it stays on the compositor.
// Reduced motion removes the motion and the decorative sparkles entirely.
const REDUCED = '@media (prefers-reduced-motion: reduce)'
const STAR = 'polygon(50% 0, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0 50%, 39% 39%)'

export const sparkleFieldStyle = css({
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  [REDUCED]: { display: 'none' },
})

export const sparkleStyle = css({
  '@keyframes pt-drift': {
    '0%': { opacity: 0, transform: 'translate(-50%, -50%) scale(0.4)' },
    '30%': { opacity: 'var(--peak)' },
    '70%': { opacity: 'var(--peak)' },
    '100%': {
      opacity: 0,
      transform: 'translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1)',
    },
  },
  '@keyframes pt-burst': {
    '0%': { opacity: 0, transform: 'translate(-50%, -50%) scale(0)' },
    '20%': { opacity: 1 },
    '100%': {
      opacity: 0,
      transform: 'translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1) rotate(90deg)',
    },
  },
  position: 'absolute',
  width: 'var(--size)',
  height: 'var(--size)',
  clipPath: STAR,
  background: 'var(--color-amber)',
  opacity: 0,
  '&[data-tone="light"]': { background: 'var(--color-card-face)' },
  '&[data-tone="teal"]': { background: 'var(--color-focus)' },
  '&[data-mode="drift"]': {
    animation: 'pt-drift var(--duration) ease-in-out var(--delay) infinite',
  },
  '&[data-mode="burst"]': {
    animation: 'pt-burst var(--duration) cubic-bezier(0.2, 0.7, 0.2, 1) var(--delay) both',
  },
})

// A soft band of light that crosses its parent once, after a reveal or the verdict appears.
export const sheenStyle = css({
  '@keyframes pt-sheen': {
    '0%': { transform: 'translateX(-120%) skewX(-18deg)', opacity: 0 },
    '20%': { opacity: 1 },
    '100%': { transform: 'translateX(220%) skewX(-18deg)', opacity: 0 },
  },
  position: 'absolute',
  inset: 0,
  overflow: 'hidden',
  borderRadius: 'inherit',
  pointerEvents: 'none',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '45%',
    background: 'linear-gradient(90deg, transparent, rgba(255, 244, 214, 0.55), transparent)',
    opacity: 0,
    animation: 'pt-sheen 1100ms cubic-bezier(0.3, 0.6, 0.2, 1) var(--sheen-delay, 0ms) both',
  },
  [REDUCED]: { display: 'none' },
})

export const breathingOrbStyle = css({
  '@keyframes pt-breathe': {
    '0%': { opacity: 0.35, transform: 'translate(-50%, -50%) scale(0.85)' },
    '100%': { opacity: 0.7, transform: 'translate(-50%, -50%) scale(1.1)' },
  },
  position: 'absolute',
  top: '50%',
  left: '50%',
  width: 'min(640px, 100%)',
  height: '100%',
  borderRadius: '50%',
  background: 'radial-gradient(closest-side, rgba(241, 166, 75, 0.28), transparent)',
  pointerEvents: 'none',
  transform: 'translate(-50%, -50%)',
  animation: 'pt-breathe 4.8s ease-in-out infinite alternate',
  [REDUCED]: { animation: 'none' },
})

export const floatStyle = css({
  '@keyframes pt-float': {
    '0%': { transform: 'translateY(0)' },
    '100%': { transform: 'translateY(-6px)' },
  },
  animation: 'pt-float 3.6s ease-in-out infinite alternate',
  [REDUCED]: { animation: 'none' },
})

// The question button: a light sweep every few seconds and a twinkling icon while it waits.
export const ctaMagicStyle = css({
  '@keyframes pt-cta-sweep': {
    '0%': { transform: 'translateX(-160%) skewX(-20deg)' },
    '45%, 100%': { transform: 'translateX(320%) skewX(-20deg)' },
  },
  '@keyframes pt-twinkle': {
    '0%, 100%': { transform: 'scale(1) rotate(0deg)' },
    '50%': { transform: 'scale(1.18) rotate(14deg)' },
  },
  position: 'relative',
  overflow: 'hidden',
  isolation: 'isolate',
  '&::after': {
    content: '""',
    position: 'absolute',
    zIndex: -1,
    top: 0,
    bottom: 0,
    left: 0,
    width: '40%',
    background: 'linear-gradient(90deg, transparent, rgba(255, 248, 228, 0.6), transparent)',
    animation: 'pt-cta-sweep 4.2s ease-in-out 1s infinite',
  },
  '&:not(:disabled) svg': { animation: 'pt-twinkle 2.4s ease-in-out infinite' },
  '&:disabled::after': { display: 'none' },
  '@media (hover: hover) and (pointer: fine)': {
    '&:not(:disabled):hover': {
      boxShadow: '0 0 0 3px rgba(241, 166, 75, 0.22), 0 10px 32px rgba(241, 166, 75, 0.35)',
    },
  },
  [REDUCED]: {
    '&::after': { display: 'none' },
    '& svg': { animation: 'none' },
  },
})

// Slow-turning rings and drifting stars on the table under the spread.
export const tableRingsStyle = css({
  '@keyframes pt-turn': {
    '0%': { transform: 'translate(-50%, -50%) rotate(0deg)' },
    '100%': { transform: 'translate(-50%, -50%) rotate(360deg)' },
  },
  '@media (min-width: 1024px)': {
    '&::before': { animation: 'pt-turn 120s linear infinite' },
    '&::after': { animation: 'pt-turn 90s linear infinite reverse' },
  },
  [REDUCED]: { '&::before, &::after': { animation: 'none' } },
})

export const tableStarsStyle = css({
  position: 'absolute',
  zIndex: -1,
  inset: '-48px 0',
  overflow: 'hidden',
  pointerEvents: 'none',
})
