import type { Handle } from 'remix/component'
import { on, ref } from 'remix/component'

import type { CardInterpretation } from '../../domain/tarot/reading.ts'
import {
  backFaceStyle,
  frontFaceStyle,
  frontFrameStyle,
  frontImageStyle,
} from './reading-board.styles.ts'

const REVEAL_FLIP_DURATION_MS = 240

export function RevealedCard(handle: Handle<{ card: CardInterpretation }>) {
  return () => {
    const { card } = handle.props
    return (
      <div
        data-front-frame
        mix={[
          frontFrameStyle,
          ref((frame, signal) => {
            const front = frame.querySelector<HTMLElement>('[data-front-face]')
            const back = frame.querySelector<HTMLElement>('[data-back-face]')
            const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
            if (!front || !back || motion.matches || !front.animate || !back.animate) return
            let frontAnimation: Animation | undefined
            let backAnimation: Animation | undefined
            try {
              frontAnimation = front.animate(
                [{ transform: 'rotateY(180deg)' }, { transform: 'rotateY(0deg)' }],
                { duration: REVEAL_FLIP_DURATION_MS, easing: 'ease-in-out' },
              )
              backAnimation = back.animate(
                [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(-180deg)' }],
                { duration: REVEAL_FLIP_DURATION_MS, easing: 'ease-in-out' },
              )
            } catch {
              frontAnimation?.cancel()
              backAnimation?.cancel()
              return
            }
            const settle = () => {
              frontAnimation?.cancel()
              backAnimation?.cancel()
            }
            motion.addEventListener('change', (event) => event.matches && settle(), { signal })
            signal.addEventListener('abort', settle, { once: true })
          }),
        ]}
      >
        <div aria-hidden="true" data-back-face mix={backFaceStyle} />
        <img
          src={`/cards/developer/fronts/${card.cardId}.webp`}
          alt=""
          aria-hidden="true"
          data-front-art
          data-front-face
          width="492"
          height="700"
          mix={[
            frontFaceStyle,
            frontImageStyle,
            on('error', (event) => {
              event.currentTarget.hidden = true
            }),
          ]}
        />
      </div>
    )
  }
}
