import type { Handle } from 'remix/component'
import { on, ref } from 'remix/component'

import type { CardInterpretation } from '../../domain/tarot/reading.ts'
import {
  backFaceStyle,
  flipCardStyle,
  frontFaceStyle,
  frontFrameStyle,
  frontImageStyle,
} from './reading-board.styles.ts'

const REVEAL_FLIP_DURATION_MS = 420
const REVEAL_FLIP_EASING = 'cubic-bezier(0.3, 0.7, 0.2, 1)'

export function RevealedCard(handle: Handle<{ card: CardInterpretation }>) {
  return () => {
    const { card } = handle.props
    return (
      <div data-front-frame mix={frontFrameStyle}>
        <div
          mix={[
            flipCardStyle,
            ref((flipCard, signal) => {
              const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
              if (motion.matches || !flipCard.animate) return
              let animation: Animation
              try {
                // One card turns over as a whole, so its two faces never show the table behind.
                animation = flipCard.animate(
                  [
                    { transform: 'rotateY(-180deg) scale(1)' },
                    { transform: 'rotateY(-90deg) scale(1.06)', offset: 0.5 },
                    { transform: 'rotateY(0deg) scale(1)' },
                  ],
                  { duration: REVEAL_FLIP_DURATION_MS, easing: REVEAL_FLIP_EASING },
                )
              } catch {
                return
              }
              const settle = () => animation.cancel()
              motion.addEventListener('change', (event) => event.matches && settle(), { signal })
              signal.addEventListener('abort', settle, { once: true })
            }),
          ]}
        >
          <div aria-hidden="true" data-back-face mix={backFaceStyle} />
          <div data-front-face mix={frontFaceStyle}>
            <img
              src={`/cards/developer/fronts/${card.cardId}.webp`}
              alt=""
              aria-hidden="true"
              data-front-art
              width="492"
              height="700"
              mix={[
                frontImageStyle,
                on('error', (event) => {
                  event.currentTarget.hidden = true
                }),
              ]}
            />
          </div>
        </div>
      </div>
    )
  }
}
