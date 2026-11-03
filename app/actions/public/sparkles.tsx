import type { Handle } from 'remix/component'

import { sparkleFieldStyle, sparkleStyle } from './magic.styles.ts'

const TONES = ['amber', 'light', 'teal'] as const

// Deterministic pseudo-random values so the server and the browser render the same sparkles.
function unit(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

interface SparklesProps {
  count: number
  /** `drift` loops gently forever; `burst` flies outward once from the centre. */
  mode: 'drift' | 'burst'
  seed?: number
  /** Burst distance from the centre, in CSS pixels. */
  reach?: number
  delayMs?: number
}

export function Sparkles(handle: Handle<SparklesProps>) {
  return () => {
    const { count, mode, seed = 1, reach = 120, delayMs = 0 } = handle.props
    return (
      <span aria-hidden="true" mix={sparkleFieldStyle}>
        {Array.from({ length: count }, (_, index) => {
          const random = (salt: number) => unit(seed * 131 + index * 17 + salt)
          const size = `${4 + Math.round(random(1) * 6)}px`
          const style =
            mode === 'burst'
              ? (() => {
                  const angle = (index / count) * Math.PI * 2 + random(2) * 0.6
                  const distance = reach * (0.55 + random(3) * 0.45)
                  return {
                    left: '50%',
                    top: '50%',
                    '--size': size,
                    '--dx': `${Math.round(Math.cos(angle) * distance)}px`,
                    '--dy': `${Math.round(Math.sin(angle) * distance)}px`,
                    '--duration': `${900 + Math.round(random(4) * 500)}ms`,
                    '--delay': `${delayMs + Math.round(random(5) * 160)}ms`,
                  }
                })()
              : {
                  left: `${Math.round(random(2) * 100)}%`,
                  top: `${Math.round(random(3) * 100)}%`,
                  '--size': size,
                  '--peak': `${(0.35 + random(4) * 0.5).toFixed(2)}`,
                  '--dx': `${Math.round((random(5) - 0.5) * 60)}px`,
                  '--dy': `${Math.round(-20 - random(6) * 50)}px`,
                  '--duration': `${(5 + random(7) * 6).toFixed(1)}s`,
                  '--delay': `${(-random(8) * 10).toFixed(1)}s`,
                }
          return (
            <span
              key={index}
              data-mode={mode}
              data-tone={TONES[index % TONES.length]}
              mix={sparkleStyle}
              style={style}
            />
          )
        })}
      </span>
    )
  }
}
