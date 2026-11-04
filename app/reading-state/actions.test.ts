import { expect } from 'remix/assert'
import { describe, test } from 'remix/test'

import { developerDeck } from '../domain/tarot/decks/developer.ts'
import { idle, place, reveal, start } from '../domain/tarot/reading.ts'
import { type ReadingSnapshot, toSnapshot } from '../domain/tarot/snapshot.ts'
import { loadServerEnv } from '../env.ts'
import { createAppRouter } from '../router.tsx'
import { routes } from '../routes.ts'
import { createReadingKey, openValue, sealValue } from './seal.ts'

const HOUR_MS = 60 * 60 * 1000
const QUESTION = 'Should I migrate the monolith?'
const INVALID = { error: 'invalid-reading-state' }
const COOKIE_NAME = 'sortes_reading'
const IDLE_GATE = 'Ask your question first'
const key = await createReadingKey(loadServerEnv().readingStateSecret)
let lastSeq = 0

/** A reading with the third choice placed in `problem`, or also revealed once all are placed. */
function draft(stage: 'choosing' | 'revealing' = 'choosing'): ReadingSnapshot {
  const started = start(developerDeck, idle(), QUESTION)
  if (!started.success || started.value.status !== 'choosing') throw new Error('Expected a start')
  const choices = started.value.choices.map(({ cardId }) => cardId)
  let state = place(developerDeck, started.value, 2, 'problem')
  if (stage === 'revealing') {
    state = place(developerDeck, state, 0, 'context')
    state = place(developerDeck, state, 1, 'advice')
    state = reveal(developerDeck, state, 'problem')
  }
  const snapshot = toSnapshot(state, choices)
  if (!snapshot) throw new Error('Expected a snapshot')
  return snapshot
}

function post(
  href: string,
  body: BodyInit,
  { contentType = 'application/json', cookie }: { contentType?: string; cookie?: string } = {},
) {
  const headers: Record<string, string> = contentType ? { 'Content-Type': contentType } : {}
  if (cookie) headers.Cookie = `${COOKIE_NAME}=${cookie}`
  return createAppRouter().fetch(
    new Request(`http://localhost${href}`, { method: 'POST', headers, body }),
  )
}

const seal = (snapshot: unknown, seq = ++lastSeq, cookie?: string) =>
  post(routes.readingSeal.href(), JSON.stringify({ seq, snapshot }), { cookie })
const clear = (seq = ++lastSeq, cookie?: string) =>
  post(routes.readingClear.href(), JSON.stringify({ seq }), { cookie })

function home(cookie?: string) {
  return createAppRouter().fetch(
    new Request(`http://localhost${routes.home.href()}`, {
      headers: cookie === undefined ? {} : { Cookie: `${COOKIE_NAME}=${cookie}` },
    }),
  )
}

function tokenOf(response: Response) {
  const header = response.headers.get('Set-Cookie') ?? ''
  const token = header.match(/^sortes_reading=([^;]+);/)?.[1]
  if (!token) throw new Error(`Expected a reading cookie, got "${header}"`)
  return token
}

async function stateOf(response: Response) {
  return (await openValue(key, tokenOf(response))) as { n: number; at: number; r: unknown }
}

function expectCleared(response: Response) {
  expect(response.headers.get('Set-Cookie')).toBe(
    'sortes_reading=; HttpOnly; Max-Age=0; Path=/; SameSite=Strict',
  )
}

async function expectTombstone(response: Response, seq: number) {
  const { n, r } = await stateOf(response)
  expect({ n, r }).toEqual({ n: seq, r: null })
}

/** Rendered elements carrying `attribute`; the page's CSS mentions the same names in selectors. */
function elementsWith(html: string, attribute: string) {
  return html.match(new RegExp(`<[a-z0-9]+\\s[^>]*\\b${attribute}(?=[\\s=>])[^>]*>`, 'g')) ?? []
}

/** A generic 400 that leaves a tombstone for a valid `seq`, or the cookie alone without one. */
async function expectInvalid(response: Response, seq?: number) {
  expect(response.status).toBe(400)
  expect(response.headers.get('Cache-Control')).toBe('no-store')
  if (seq === undefined) expect(response.headers.get('Set-Cookie')).toBe(null)
  else await expectTombstone(response, seq)
  expect(await response.json()).toEqual(INVALID)
}

async function expectStale(response: Response) {
  expect(response.status).toBe(200)
  expect(response.headers.get('Cache-Control')).toBe('no-store')
  expect(response.headers.get('Set-Cookie')).toBe(null)
  expect(await response.json()).toEqual({ ok: true, stale: true })
}

async function expectIdle(response: Response) {
  expect(response.status).toBe(200)
  expect(response.headers.get('Cache-Control')).toBe('private, no-cache')
  expect(response.headers.get('Vary')?.toLowerCase()).toContain('cookie')
  const html = await response.text()
  expect(html).toContain(IDLE_GATE)
  expect(html).not.toContain('readonly')
}

describe('reading state routes', () => {
  test('seal sets an HttpOnly session cookie that hides the reading', async () => {
    const sealed = await seal(draft())
    expect(sealed.status).toBe(200)
    expect(sealed.headers.get('Cache-Control')).toBe('no-store')
    expect(await sealed.json()).toEqual({ ok: true })
    const header = sealed.headers.get('Set-Cookie') ?? ''
    const token = tokenOf(sealed)
    // A browser-session cookie: no Expires or Max-Age, and no Secure outside production.
    expect(header).toBe(`sortes_reading=${token}; HttpOnly; Path=/; SameSite=Strict`)
    expect(token).not.toContain('monolith')
    const raw = Buffer.from(token, 'base64url').toString('latin1')
    for (const card of developerDeck.cards) expect(raw).not.toContain(card.id)
  })

  test('the server stamps the seal time instead of trusting the client', async () => {
    const snapshot = draft()
    const response = await post(
      routes.readingSeal.href(),
      JSON.stringify({ seq: 7, snapshot, at: 0 }),
    )
    const { n, at, r } = await stateOf(response)
    expect({ n, r }).toEqual({ n: 7, r: snapshot })
    expect(Math.abs(Date.now() - at)).toBeLessThan(HOUR_MS)
  })

  test('rejects oversize bodies, with or without a declared length, and keeps the cookie', async () => {
    const huge = JSON.stringify({ seq: 1, snapshot: draft(), padding: 'x'.repeat(5000) })
    await expectInvalid(await post(routes.readingSeal.href(), huge))
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(huge))
        controller.close()
      },
    })
    await expectInvalid(await post(routes.readingSeal.href(), stream))
  })

  test('accepts only JSON bodies, so cross-site simple requests are refused', async () => {
    const sealBody = JSON.stringify({ seq: 1, snapshot: draft() })
    const clearBody = JSON.stringify({ seq: 1 })
    for (const contentType of ['text/plain', 'application/x-www-form-urlencoded', '']) {
      await expectInvalid(await post(routes.readingSeal.href(), sealBody, { contentType }))
      await expectInvalid(await post(routes.readingClear.href(), clearBody, { contentType }))
    }
  })

  test('rejects malformed and impossible bodies with one generic error', async () => {
    await expectInvalid(await post(routes.readingSeal.href(), 'not json'))
    await expectInvalid(await post(routes.readingSeal.href(), ''))
    await expectInvalid(await post(routes.readingSeal.href(), JSON.stringify([draft()])))
    await expectInvalid(await post(routes.readingSeal.href(), 'null'))
    for (const seq of [-1, 1.5, '3', null, Number.MAX_SAFE_INTEGER + 1]) {
      await expectInvalid(await seal(draft(), seq as number))
    }
    // A valid sequence leaves a tombstone, so no stale step survives a rejected seal.
    await expectInvalid(await seal(undefined, 11), 11)
    await expectInvalid(await seal({ ...draft(), picked: [0, 1] }, 12), 12)
  })

  test('clear writes a session tombstone with a no-store response', async () => {
    const response = await clear(21)
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(response.headers.get('Set-Cookie')).toBe(
      `sortes_reading=${tokenOf(response)}; HttpOnly; Path=/; SameSite=Strict`,
    )
    await expectTombstone(response, 21)
    expect(await response.json()).toEqual({ ok: true })
    for (const body of ['{}', '{"seq":-1}', 'not json']) {
      await expectInvalid(await post(routes.readingClear.href(), body))
    }
  })

  test('a seal older than the saved one is ignored', async () => {
    const newer = tokenOf(await seal(draft('revealing'), 200))
    await expectStale(await seal(draft(), 199, newer))
    await expectInvalid(await seal(undefined, 199, newer))
    const { n } = await stateOf(await seal(draft(), 200, newer))
    expect(n).toBe(200)
  })

  test('a clear older than the saved seal is ignored', async () => {
    const sealed = tokenOf(await seal(draft(), 300))
    await expectStale(await clear(299, sealed))
    await expectTombstone(await clear(301, sealed), 301)
  })

  test('a late older seal cannot bring back a cleared reading', async () => {
    const tombstone = tokenOf(await clear(400))
    await expectStale(await seal(draft(), 399, tombstone))
    const next = draft()
    const { n, r } = await stateOf(await seal(next, 401, tombstone))
    expect({ n, r }).toEqual({ n: 401, r: next })
  })

  test('an invalid cookie does not block a new request', async () => {
    const expired = await sealValue(key, { n: 900, at: Date.now() - 25 * HOUR_MS, r: null })
    for (const cookie of ['tampered', expired]) {
      const { n } = await stateOf(await seal(draft(), 500, cookie))
      expect(n).toBe(500)
    }
  })
})

describe('home page restore', () => {
  test('renders idle without a cookie, never setting one, and must revalidate', async () => {
    const response = await home()
    expect(response.headers.get('Set-Cookie')).toBe(null)
    await expectIdle(response)
  })

  test('renders a reading in progress from a valid cookie', async () => {
    const response = await home(tokenOf(await seal(draft())))
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('private, no-cache')
    expect(response.headers.get('Vary')?.toLowerCase()).toContain('cookie')
    expect(response.headers.get('Set-Cookie')).toBe(null)
    const html = await response.text()
    expect(html).not.toContain(IDLE_GATE)
    expect(html).toMatch(/<input[^>]* value="Should I migrate the monolith\?"[^>]* readonly/)
    const picked = elementsWith(html, 'data-picked')
    expect(picked).toHaveLength(1)
    expect(picked[0]).toContain('data-choice="2"')
    expect(html).toContain('aria-label="Hidden card in Problem card"')
  })

  test('renders revealed cards settled from a valid cookie', async () => {
    const snapshot = draft('revealing')
    const response = await home(tokenOf(await seal(snapshot)))
    const html = await response.text()
    expect(html).not.toContain(IDLE_GATE)
    const revealedIds = [...html.matchAll(/data-card-id="([^"]+)"/g)].map(([, id]) => id)
    expect(revealedIds).toEqual([snapshot.choices[2]])
    expect(elementsWith(html, 'data-reveal')).toHaveLength(2)
    expect(elementsWith(html, 'data-mode="burst"')).toHaveLength(0)
    expect(elementsWith(html, 'data-verdict')).toHaveLength(0)
  })

  test('renders idle from a tombstone and keeps it', async () => {
    const response = await home(tokenOf(await clear()))
    expect(response.headers.get('Set-Cookie')).toBe(null)
    await expectIdle(response)
  })

  test('renders idle and deletes tampered, expired and impossible cookies', async () => {
    const token = tokenOf(await seal(draft()))
    const bytes = Buffer.from(token, 'base64url')
    bytes[20] ^= 1
    const now = Date.now()
    const impossible = { ...draft(), placements: { problem: { choice: 2, revealed: true } } }
    const rejected = [
      bytes.toString('base64url'),
      'not-a-token',
      '%E0%A4%A',
      '"abc"',
      await sealValue(key, { n: 1, at: now - 25 * HOUR_MS, r: draft() }),
      await sealValue(key, { n: 1, at: now - 25 * HOUR_MS, r: null }),
      await sealValue(key, { n: 1, at: now, r: impossible }),
      await sealValue(key, { n: -1, at: now, r: draft() }),
      await sealValue(key, { n: 1, at: now, r: draft(), extra: true }),
      await sealValue(key, { at: now, r: draft() }),
      await sealValue(key, { ...draft(), sealedAt: now }),
      await sealValue(await createReadingKey('another-reading-state-secret-0123456789'), {
        n: 1,
        at: now,
        r: draft(),
      }),
    ]
    for (const cookie of rejected) {
      const response = await home(cookie)
      expectCleared(response)
      await expectIdle(response)
    }
    const recent = await home(await sealValue(key, { n: 1, at: now - 23 * HOUR_MS, r: draft() }))
    expect(recent.headers.get('Set-Cookie')).toBe(null)
    expect(await recent.text()).not.toContain(IDLE_GATE)
  })
  test('the shared-reading page neither reads nor sets the cookie', async () => {
    const payload = Buffer.from(
      JSON.stringify({
        v: 1,
        d: 'developer',
        s: 'three-card',
        q: 'Should I rewrite it?',
        c: ['legacy-system', 'infinite-refactor', 'mvp'],
      }),
    ).toString('base64url')
    const response = await createAppRouter().fetch(
      new Request(`http://localhost${routes.sharedReading.href({ payload })}`, {
        headers: { Cookie: `${COOKIE_NAME}=tampered` },
      }),
    )
    expect(response.status).toBe(200)
    expect(response.headers.get('Set-Cookie')).toBe(null)
  })

  test('request logs carry only the method, route path and status', async () => {
    const original = console.log
    const lines: string[] = []
    console.log = (...args: unknown[]) => lines.push(args.join(' '))
    let token = ''
    try {
      token = tokenOf(await seal(draft()))
      await home(token)
      await home('tampered')
      await clear()
    } finally {
      console.log = original
    }
    expect(lines).toHaveLength(4)
    expect(lines[0]).toMatch(/^POST \/reading-state\/seal 200 [\d.]+ ms$/)
    expect(lines[1]).toMatch(/^GET \/ 200 [\d.]+ ms$/)
    expect(lines[2]).toMatch(/^GET \/ 200 [\d.]+ ms$/)
    expect(lines[3]).toMatch(/^POST \/reading-state\/clear 200 [\d.]+ ms$/)
    for (const line of lines) {
      expect(line).not.toContain(token)
      expect(line).not.toContain(COOKIE_NAME)
      expect(line).not.toContain('monolith')
    }
  })
})
