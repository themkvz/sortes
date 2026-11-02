const DRAG_THRESHOLD_CSS_PX = 6
const DRAG_PREVIEW_WIDTH_CSS_PX = 56

interface DragGestureOptions {
  /** Whether a hovered position can receive the dragged card right now. */
  readonly isTarget: (positionId: string) => boolean
  /** Called after the gesture activates and on every later move. */
  readonly onChange: () => void
  readonly onDrop: (positionId: string, choiceIndex: number) => void
  /** Called once when the gesture ends, before focus returns to the source. */
  readonly onEnd: () => void
}

function clampPreviewPoint(x: number, y: number) {
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

export function canStartDrag(event: PointerEvent): boolean {
  return event.pointerType === 'mouse' && event.isPrimary && event.button === 0
}

/** Starts a primary-mouse drag of one hidden card, from pointerdown until drop or cancellation. */
export function startCardDrag(
  event: PointerEvent,
  choiceIndex: number,
  root: HTMLElement,
  { isTarget, onChange, onDrop, onEnd }: DragGestureOptions,
) {
  const { pointerId } = event
  const source = event.currentTarget as HTMLElement
  const startX = event.clientX
  const startY = event.clientY
  const controller = new AbortController()
  const state = { active: false, target: null as string | null, x: startX, y: startY }

  /** Ends the gesture without dropping. Safe to call more than once. */
  const cancel = (restoreFocus: boolean) => {
    if (controller.signal.aborted) return
    controller.abort()
    if (source.hasPointerCapture(pointerId)) source.releasePointerCapture(pointerId)
    onEnd()
    if (restoreFocus && root.contains(source)) source.focus()
  }

  const targetAt = (clientX: number, clientY: number) => {
    const hit = document.elementFromPoint(clientX, clientY)?.closest<HTMLElement>('[data-position]')
    if (!hit || !root.contains(hit)) return null
    const positionId = hit.dataset.position
    return positionId && isTarget(positionId) ? positionId : null
  }

  const move = (moveEvent: PointerEvent) => {
    if (moveEvent.pointerId !== pointerId) return
    if (!state.active) {
      if (
        Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) < DRAG_THRESHOLD_CSS_PX
      )
        return
      state.active = true
    }
    const point = clampPreviewPoint(moveEvent.clientX, moveEvent.clientY)
    state.x = point.x
    state.y = point.y
    state.target = targetAt(moveEvent.clientX, moveEvent.clientY)
    onChange()
  }

  const finish = (endEvent: PointerEvent) => {
    if (endEvent.pointerId !== pointerId) return
    const isDrop = state.active && endEvent.type === 'pointerup'
    const dropTarget = isDrop ? targetAt(endEvent.clientX, endEvent.clientY) : null
    cancel(true)
    if (dropTarget) onDrop(dropTarget, choiceIndex)
  }

  source.setPointerCapture(pointerId)
  const { signal } = controller
  window.addEventListener('pointermove', move, { signal })
  window.addEventListener('pointerup', finish, { signal })
  window.addEventListener('pointercancel', finish, { signal })
  window.addEventListener('blur', () => cancel(false), { signal })
  source.addEventListener(
    'lostpointercapture',
    (lostEvent) => {
      if (lostEvent.pointerId === pointerId) cancel(true)
    },
    { signal },
  )

  return { state, cancel }
}
