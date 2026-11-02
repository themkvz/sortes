import { clientEntry, css, type Handle, on, ref } from 'remix/component'

import { developerDeck } from '../../domain/tarot/decks/developer.ts'
import { idle, place, type ReadingState, reveal, start } from '../../domain/tarot/reading.ts'

export const ReadingBoard = clientEntry(import.meta.url, function ReadingBoard(handle: Handle) {
  let state: ReadingState = idle()
  let draft = ''
  let pending: number | null = null
  let error = ''
  let ready = false
  let status = 'Preparing the deck…'
  let boardRoot: HTMLElement | undefined
  let gesture: {
    pointerId: number
    choiceIndex: number
    source: HTMLButtonElement
    startX: number
    startY: number
    active: boolean
    target: string | null
    x: number
    y: number
    controller: AbortController
  } | null = null
  let suppressDragClick = false
  const DRAG_THRESHOLD_CSS_PX = 6
  const DRAG_PREVIEW_WIDTH_CSS_PX = 56

  const clampPreviewPoint = (x: number, y: number) => {
    const width = Math.min(
      DRAG_PREVIEW_WIDTH_CSS_PX,
      Math.max(0, window.innerWidth - 2),
      (Math.max(0, window.innerHeight - 2) * 82) / 116,
    )
    const halfWidth = width / 2
    const halfHeight = (width * 116) / 164
    return {
      x: Math.min(Math.max(halfWidth, x), Math.max(halfWidth, window.innerWidth - halfWidth)),
      y: Math.min(Math.max(halfHeight, y), Math.max(halfHeight, window.innerHeight - halfHeight)),
    }
  }

  const dragTargetAt = (x: number, y: number) => {
    const currentState = state
    if (currentState.status !== 'choosing') return null
    const hit = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-position]')
    if (!hit || !boardRoot?.contains(hit)) return null
    const positionId = hit.dataset.position
    return positionId && !currentState.placements[positionId] ? positionId : null
  }

  const stopGesture = (restoreFocus: boolean, clearPending: boolean) => {
    const current = gesture
    if (!current) return
    gesture = null
    current.controller.abort()
    if (current.source.hasPointerCapture(current.pointerId)) {
      current.source.releasePointerCapture(current.pointerId)
    }
    if (clearPending) {
      pending = null
      status = 'Selection cleared.'
    }
    handle.update()
    if (restoreFocus && boardRoot?.contains(current.source)) current.source.focus()
  }

  const beginGesture = (event: PointerEvent, choiceIndex: number) => {
    if (
      event.pointerType !== 'mouse' ||
      !event.isPrimary ||
      event.button !== 0 ||
      state.status !== 'choosing' ||
      state.choices[choiceIndex]?.picked ||
      gesture
    )
      return
    suppressDragClick = false
    const source = event.currentTarget as HTMLButtonElement
    const controller = new AbortController()
    const current = {
      pointerId: event.pointerId,
      choiceIndex,
      source,
      startX: event.clientX,
      startY: event.clientY,
      active: false,
      target: null as string | null,
      x: event.clientX,
      y: event.clientY,
      controller,
    }
    gesture = current
    source.setPointerCapture(event.pointerId)
    const move = (pointerEvent: PointerEvent) => {
      if (gesture !== current || pointerEvent.pointerId !== current.pointerId) return
      if (!current.active) {
        if (
          Math.hypot(pointerEvent.clientX - current.startX, pointerEvent.clientY - current.startY) <
          DRAG_THRESHOLD_CSS_PX
        )
          return
        current.active = true
        suppressDragClick = true
      }
      const point = clampPreviewPoint(pointerEvent.clientX, pointerEvent.clientY)
      current.x = point.x
      current.y = point.y
      current.target = dragTargetAt(pointerEvent.clientX, pointerEvent.clientY)
      handle.update()
    }
    const finish = (pointerEvent: PointerEvent) => {
      if (gesture !== current || pointerEvent.pointerId !== current.pointerId) return
      const isDrop = current.active && pointerEvent.type === 'pointerup'
      const target = isDrop ? dragTargetAt(pointerEvent.clientX, pointerEvent.clientY) : null
      stopGesture(true, false)
      if (isDrop && target) put(target, current.choiceIndex)
    }
    window.addEventListener('pointermove', move, { signal: controller.signal })
    window.addEventListener('pointerup', finish, { signal: controller.signal })
    window.addEventListener('pointercancel', finish, { signal: controller.signal })
    window.addEventListener('blur', () => stopGesture(false, false), { signal: controller.signal })
  }

  handle.queueTask(() => {
    ready = true
    status = 'The deck is ready.'
    handle.update()
  })

  const focus = (selector: string) => {
    handle.queueTask(() => boardRoot?.querySelector<HTMLElement>(selector)?.focus())
    handle.update()
  }

  const startReading = () => {
    if (!ready || state.status !== 'idle') return
    const result = start(developerDeck, state, draft)
    if (!result.success) {
      error = 'Enter a valid question of up to 160 Unicode code points.'
      handle.update()
      return
    }
    state = result.value
    error = ''
    pending = null
    status = 'Choose a hidden card, then place it in a position.'
    focus('[data-choice="0"]')
  }

  const choose = (index: number) => {
    if (state.status !== 'choosing' || state.choices[index]?.picked) return
    pending = index
    status = `Hidden card ${index + 1} selected.`
    handle.update()
  }

  const put = (positionId: string, choiceIndex = pending) => {
    if (choiceIndex === null || choiceIndex === undefined) return
    const previous = state
    state = place(developerDeck, state, choiceIndex, positionId)
    if (state === previous) return
    pending = null
    const placedState = state
    status =
      placedState.status === 'ready'
        ? 'All cards placed. Reveal them one at a time.'
        : `${developerDeck.positions.find((p) => p.id === positionId)?.label} card placed.`
    if (placedState.status === 'ready') focus('[data-reveal]')
    else if (placedState.status === 'choosing') {
      const nextIndex = Array.from(
        { length: placedState.choices.length },
        (_, offset) => (choiceIndex + offset + 1) % placedState.choices.length,
      ).find((index) => !placedState.choices[index]?.picked)
      if (nextIndex !== undefined) focus(`[data-choice="${nextIndex}"]`)
    }
  }

  const turn = (positionId: string) => {
    const previous = state
    state = reveal(developerDeck, state, positionId)
    if (state === previous) return
    if (state.status === 'complete') {
      status = 'Reading complete.'
      focus('[data-verdict]')
    } else {
      status = `${developerDeck.positions.find((p) => p.id === positionId)?.label} card revealed.`
      focus('[data-reveal]:not(:disabled)')
    }
  }

  const restart = () => {
    state = idle()
    draft = ''
    pending = null
    error = ''
    status = 'Ask a question to begin.'
    focus('input')
  }

  return () => {
    const active = state.status !== 'idle'
    const positions = developerDeck.positions
    const placements =
      state.status === 'choosing' || state.status === 'ready' || state.status === 'revealing'
        ? state.placements
        : {}
    const choices = state.status === 'choosing' ? state.choices : []
    const completedState = state.status === 'complete' ? state : null
    const complete = completedState !== null
    return (
      <section
        mix={[
          boardStyle,
          ref((node, signal) => {
            boardRoot = node
            window.addEventListener(
              'pointerdown',
              () => {
                if (!gesture) suppressDragClick = false
              },
              { capture: true, signal },
            )
            window.addEventListener(
              'click',
              (event) => {
                if (!suppressDragClick || event.detail === 0) return
                event.preventDefault()
                event.stopImmediatePropagation()
                suppressDragClick = false
              },
              { capture: true, signal },
            )
            signal.addEventListener('abort', () => stopGesture(false, false))
          }),
          on('keydown', (event) => {
            if (event.key === 'Escape' && gesture) {
              suppressDragClick = true
              stopGesture(true, true)
              return
            }
            if (event.key === 'Escape' && pending !== null) {
              pending = null
              status = 'Selection cleared.'
              handle.update()
            }
          }),
        ]}
      >
        <section aria-label="Ask your question" mix={askStyle}>
          <h1 mix={headingStyle}>Ask something you're overthinking.</h1>
          <form
            mix={on('submit', (event) => {
              event.preventDefault()
              startReading()
            })}
          >
            <label htmlFor={handle.id} mix={labelStyle}>
              YOUR QUESTION
            </label>
            <div mix={formRowStyle}>
              <input
                id={handle.id}
                type="text"
                value={active ? state.question : draft}
                readOnly={active}
                aria-invalid={!!error}
                aria-describedby={error ? `${handle.id}-error` : undefined}
                placeholder="What should I ask?"
                mix={[
                  inputStyle,
                  on('input', (event) => {
                    draft = event.currentTarget.value
                    error = ''
                    handle.update()
                  }),
                ]}
              />
              <button type="submit" disabled={!ready || active} mix={buttonStyle}>
                {draft.trim() ? 'Ask' : 'Surprise me'}
              </button>
            </div>
            {error && (
              <p id={`${handle.id}-error`} role="alert" mix={errorStyle}>
                {error}
              </p>
            )}
            <p>
              <span aria-live="polite">{status}</span>
            </p>
            <noscript>This reading experience requires JavaScript.</noscript>
          </form>
        </section>
        <section aria-label="Your spread" mix={spreadSectionStyle}>
          <div mix={spreadHeaderStyle}>
            <span mix={mutedMonoStyle}>YOUR SPREAD</span>
            <span mix={mutedSmallStyle}>Choose and place three cards.</span>
          </div>
          <div mix={spreadRowStyle}>
            {positions.map((position) => {
              const placement = placements[position.id]
              const completedCard = completedState?.interpretation.cards.find(
                (item) => item.positionId === position.id,
              )
              const card =
                completedCard ??
                (placement?.revealed
                  ? developerDeck.cards.find((item) => item.id === placement.cardId)
                  : undefined)
              const meaning = completedCard
                ? completedCard.meaning
                : placement?.revealed
                  ? developerDeck.cards.find((item) => item.id === placement.cardId)?.meanings[
                      position.id
                    ]?.text
                  : undefined
              const cardName = card && ('cardName' in card ? card.cardName : card.name)
              const description = card && ('shortDescription' in card ? card.shortDescription : '')
              const cardId =
                completedCard?.cardId ?? (placement?.revealed ? placement.cardId : undefined)
              return (
                <div
                  key={position.id}
                  data-position={position.id}
                  data-drop-target={
                    (gesture?.active && gesture.target === position.id) || undefined
                  }
                  mix={slotWrapStyle}
                >
                  <span mix={slotLabelStyle}>{position.label.toUpperCase()}</span>
                  {completedCard || (placement?.revealed && card) ? (
                    <article mix={revealedStyle}>
                      <div data-front-frame mix={frontFrameStyle}>
                        <img
                          src={`/cards/developer/fronts/${cardId}.webp`}
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
                      <strong>{cardName}</strong>
                      <span>{description}</span>
                      <p>{meaning}</p>
                    </article>
                  ) : placement ? (
                    <button
                      type="button"
                      aria-label={`${state.status === 'choosing' ? 'Hidden card in' : 'Reveal'} ${position.label} card`}
                      data-reveal
                      disabled={state.status === 'choosing'}
                      mix={[faceDownStyle, on('click', () => turn(position.id))]}
                    >
                      <span aria-hidden="true" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      aria-label={`Place card in ${position.label}`}
                      disabled={pending === null || state.status !== 'choosing'}
                      mix={[emptySlotStyle, on('click', () => put(position.id))]}
                    >
                      Place card
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </section>
        {(choices.length > 0 || state.status === 'idle') && (
          <section aria-label="Hidden cards" mix={deckSectionStyle}>
            <div mix={deckLabelRowStyle}>
              <span mix={deckRuleStyle} />
              <span mix={deckCopyStyle}>CHOOSE A HIDDEN CARD</span>
              <span mix={deckRuleStyle} />
            </div>
            <div mix={deckGridStyle}>
              {(state.status === 'idle'
                ? Array.from({ length: 9 }, (_, index) => ({ picked: true, index }))
                : choices.map((choice, index) => ({ ...choice, index }))
              ).map(({ picked, index }) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Choose hidden card ${index + 1}`}
                  aria-pressed={pending === index}
                  disabled={!ready || picked}
                  data-choice={index}
                  mix={[
                    cardBackStyle,
                    pending === index ? selectedStyle : null,
                    on('click', () => choose(index)),
                    on('pointerdown', (event) => beginGesture(event, index)),
                    on('lostpointercapture', (event) => {
                      if (
                        gesture?.source === event.currentTarget &&
                        event.pointerId === gesture.pointerId
                      )
                        stopGesture(true, false)
                    }),
                  ]}
                >
                  <span aria-hidden="true" />
                </button>
              ))}
            </div>
          </section>
        )}
        {complete && (
          <section aria-label="Reading result" mix={resultStyle}>
            <p>{state.question}</p>
            <h2 tabIndex={-1} data-verdict>
              Verdict
            </h2>
            <p>{completedState?.interpretation.verdict}</p>
            <button type="button" mix={[buttonStyle, on('click', restart)]}>
              Ask again
            </button>
          </section>
        )}
        {gesture?.active && (
          <div
            aria-hidden="true"
            data-drag-preview
            mix={dragPreviewStyle}
            style={{ left: `${gesture.x}px`, top: `${gesture.y}px` }}
          />
        )}
      </section>
    )
  }
})

const boardStyle = css({ display: 'flex', flexDirection: 'column', gap: '40px' })
const dragPreviewStyle = css({
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
const askStyle = css({ display: 'flex', flexDirection: 'column', gap: '20px' })
const headingStyle = css({
  margin: 0,
  fontFamily: 'var(--font-display)',
  fontWeight: 400,
  fontSize: 'clamp(24px, 5vw, 36px)',
  lineHeight: 1.25,
  color: 'var(--color-text)',
})
const labelStyle = css({
  display: 'block',
  fontFamily: 'var(--font-mono)',
  fontSize: '10px',
  letterSpacing: '0.08em',
  color: 'var(--color-text-muted)',
  marginBottom: '8px',
})
const formRowStyle = css({ display: 'flex', gap: '12px', flexWrap: 'wrap' })
const inputStyle = css({
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
const buttonStyle = css({
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
const errorStyle = css({ color: 'var(--color-amber)' })
const spreadSectionStyle = css({ display: 'flex', flexDirection: 'column', gap: '16px' })
const spreadHeaderStyle = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  justifyContent: 'space-between',
})
const mutedMonoStyle = css({
  fontFamily: 'var(--font-mono)',
  fontSize: '10px',
  letterSpacing: '0.08em',
  color: 'var(--color-text-muted)',
})
const mutedSmallStyle = css({
  fontFamily: 'var(--font-body)',
  fontSize: '12px',
  color: 'var(--color-text-muted)',
})
const spreadRowStyle = css({
  display: 'flex',
  gap: '12px',
  '@media (min-width: 480px)': { gap: '16px' },
})
const slotWrapStyle = css({
  flex: '1 1 0',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px',
  '&[data-drop-target]': { outline: '2px dashed var(--color-focus)', outlineOffset: '3px' },
})
const slotLabelStyle = css({
  fontFamily: 'var(--font-mono)',
  fontSize: '10px',
  letterSpacing: '0.08em',
  color: 'var(--color-text-muted)',
})
const emptySlotStyle = css({
  width: '100%',
  minHeight: '116px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-card)',
  background: 'var(--color-surface)',
  color: 'var(--color-text-muted)',
  cursor: 'pointer',
  '&:focus-visible': { outline: '2px solid var(--color-focus)', outlineOffset: '2px' },
})
const faceDownStyle = css({
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
const revealedStyle = css({
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
const frontFrameStyle = css({
  position: 'relative',
  width: '100%',
  maxWidth: '164px',
  aspectRatio: '82 / 116',
  alignSelf: 'center',
  background: 'var(--color-card-back)',
})
const frontImageStyle = css({
  position: 'absolute',
  inset: 0,
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  '&[hidden]': { display: 'none' },
})
const resultStyle = css({
  overflowWrap: 'anywhere',
  fontFamily: 'var(--font-body)',
  color: 'var(--color-text)',
})
const deckSectionStyle = css({ display: 'flex', flexDirection: 'column', gap: '16px' })
const deckLabelRowStyle = css({ display: 'flex', alignItems: 'center', gap: '14px' })
const deckRuleStyle = css({ flex: '1 1 auto', height: '1px', background: 'var(--color-border)' })
const deckCopyStyle = css({
  flex: '0 0 auto',
  fontFamily: 'var(--font-mono)',
  fontSize: '9px',
  letterSpacing: '0.08em',
  color: 'var(--color-text-muted)',
})
const deckGridStyle = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '10px',
  '@media (min-width: 640px)': { gridTemplateColumns: 'repeat(9, 1fr)' },
})
const cardBackStyle = css({
  width: '100%',
  aspectRatio: '82 / 116',
  border: '1px solid var(--color-teal)',
  borderRadius: '12px',
  background: 'var(--color-card-back) url(/cards/card-back.webp) center / contain no-repeat',
  cursor: 'pointer',
  '&:focus-visible': { outline: '2px solid var(--color-focus)', outlineOffset: '2px' },
})
const selectedStyle = css({ outline: '2px solid var(--color-amber)', outlineOffset: '2px' })
