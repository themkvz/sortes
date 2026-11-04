import type { ReadingSnapshot } from '../../domain/tarot/snapshot.ts'
import { routes } from '../../routes.ts'

// A stalled request must not freeze the board; past this it counts as a failure.
const REQUEST_TIMEOUT_MS = 8000

// Orders every seal and clear: the server ignores a request older than the saved one. Based on
// milliseconds, so the first request of a reloaded page still beats the old page's requests.
let seq = 0

interface Write {
  readonly href: string
  readonly body: object
}

// The browser attaches the cookie when a request leaves, so two overlapping writes can land in
// either order and the server cannot tell which is newer. Keep one write in flight; while it
// runs, only the newest pending write is kept, and it goes out when the current one settles.
let inFlight = false
let pending: Write | undefined

// The server owns the HttpOnly reading cookie: seal sets it, clear leaves an empty tombstone.
async function postJson({ href, body }: Write) {
  seq = Math.max(seq + 1, Date.now())
  const response = await fetch(href, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seq, ...body }),
    // A reload right after a step or `Ask again` must not cancel the cookie update.
    keepalive: true,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!response.ok) throw new Error(`Reading state request failed with ${response.status}`)
}

const clearWrite = (): Write => ({ href: routes.readingClear.href(), body: {} })

async function drain() {
  inFlight = true
  while (pending) {
    const write = pending
    pending = undefined
    try {
      await postJson(write)
    } catch {
      // A failed seal must not leave an older step to restore, unless a newer write replaces it.
      // A failed clear is best effort: the cookie ends with the session or after 24 hours.
      if (write.href === routes.readingSeal.href()) pending ??= clearWrite()
    }
  }
  inFlight = false
}

function enqueue(write: Write) {
  pending = write
  if (!inFlight) void drain()
}

/** Clears the saved reading, after any write already in flight. */
export function forgetReading() {
  enqueue(clearWrite())
}

/** Seals the reading into the cookie, after any write already in flight; newer steps win. */
export function saveReading(snapshot: ReadingSnapshot) {
  enqueue({ href: routes.readingSeal.href(), body: { snapshot } })
}
