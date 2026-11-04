import { createCookie } from 'remix/cookie'

import { developerDeck } from '../domain/tarot/decks/developer.ts'
import { fromSnapshot, type ReadingSnapshot } from '../domain/tarot/snapshot.ts'
import { loadServerEnv } from '../env.ts'
import { createReadingKey, openValue, sealValue } from './seal.ts'

const MAX_BODY_BYTES = 4096
const MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24 hours
const noStore = { 'Cache-Control': 'no-store' }
// `/` depends on the cookie: browsers may keep it for back/forward but must revalidate it.
// Chromium reuses a `no-cache` page on history navigation without asking, so `Vary` makes a
// changed cookie miss that cached copy.
const pageCache = { 'Cache-Control': 'private, no-cache', Vary: 'Cookie' }
const invalid = { error: 'invalid-reading-state' }
const keep = (value: string) => value

/**
 * The sealed value: `n` is the client's request sequence, `at` the server's seal time, and `r`
 * the reading, or `null` once it was cleared (a tombstone that older requests cannot overwrite).
 */
type SavedState = { n: number; at: number; r: ReadingSnapshot | null }

const isSeq = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 0

// A browser-session cookie: no Expires or Max-Age. The sealed token is already cookie-safe
// base64url and tamper-proof, so it is stored as is, without the default encoding or signing.
// Development and test run on plain http://localhost, so only production marks it Secure.
const readingCookie = createCookie('sortes_reading', {
  httpOnly: true,
  sameSite: 'Strict',
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  encode: keep,
  decode: keep,
})

const clearCookie = () => readingCookie.serialize('', { maxAge: 0 })

let readingKey: Promise<CryptoKey> | undefined
// Derived on first use; server.ts has already validated the secret at startup.
function key() {
  readingKey ??= createReadingKey(loadServerEnv().readingStateSecret).catch((error) => {
    readingKey = undefined // let the next request try again instead of caching the failure
    throw error
  })
  return readingKey
}

/** Parses a JSON body of at most 4 KB; returns `undefined` for anything larger or malformed. */
async function readJson(request: Request): Promise<unknown> {
  // Only JSON is accepted, so cross-site pages cannot send a simple (preflight-free) request.
  // ponytail: no rate limit here; limit these routes at the proxy if they are ever abused.
  const mediaType = request.headers.get('Content-Type')?.split(';', 1)[0].trim().toLowerCase()
  if (mediaType !== 'application/json') return undefined
  if (Number(request.headers.get('Content-Length')) > MAX_BODY_BYTES || !request.body) {
    return undefined
  }
  const chunks: Uint8Array[] = []
  let size = 0
  for await (const chunk of request.body) {
    size += chunk.byteLength
    if (size > MAX_BODY_BYTES) return undefined
    chunks.push(chunk)
  }
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)))
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof TypeError) return undefined
    throw error
  }
}

/** Opens a token; `undefined` for anything altered, foreign, expired or impossible. */
async function openState(token: string): Promise<SavedState | undefined> {
  const value = await openValue(await key(), token)
  if (typeof value !== 'object' || value === null) return undefined
  const { n, at, r, ...rest } = value as Record<string, unknown>
  if (!isSeq(n) || !Number.isSafeInteger(at) || Object.keys(rest).length > 0) return undefined
  if (Date.now() - (at as number) > MAX_AGE_MS) return undefined
  if (r === null) return { n, at: at as number, r }
  const result = fromSnapshot(developerDeck, r)
  return result.success ? { n, at: at as number, r: result.value.snapshot } : undefined
}

/**
 * Seals request `seq` into the cookie, unless the request's cookie already holds a newer one.
 * Returns the `Set-Cookie` value, or `undefined` for a stale request that changes nothing.
 */
async function writeState(request: Request, seq: number, reading: ReadingSnapshot | null) {
  const token = await readingCookie.parse(request.headers.get('Cookie'))
  const current = token === null ? undefined : await openState(token)
  if (current && current.n > seq) return undefined
  const state: SavedState = { n: seq, at: Date.now(), r: reading }
  return readingCookie.serialize(await sealValue(await key(), state))
}

function respond(body: object, setCookie?: string, status = 200) {
  const headers = setCookie ? { ...noStore, 'Set-Cookie': setCookie } : noStore
  return Response.json(body, { status, headers })
}

const done = (setCookie?: string) =>
  respond(setCookie ? { ok: true } : { ok: true, stale: true }, setCookie)

/** Reads `{ seq, snapshot }`; `seq` is `undefined` unless it is a non-negative safe integer. */
async function readRequest(request: Request) {
  // Primitives and arrays have no such keys, so they read as missing.
  const body = ((await readJson(request)) ?? {}) as Record<string, unknown>
  return { seq: isSeq(body.seq) ? body.seq : undefined, snapshot: body.snapshot }
}

/**
 * Seals `{ seq, snapshot }`. An invalid snapshot with a valid `seq` leaves a tombstone, so no
 * stale step survives; without a valid `seq` the cookie is left alone.
 */
export async function sealReadingState(request: Request) {
  const { seq, snapshot } = await readRequest(request)
  if (seq === undefined) return respond(invalid, undefined, 400)
  const result = fromSnapshot(developerDeck, snapshot)
  if (!result.success) return respond(invalid, await writeState(request, seq, null), 400)
  return done(await writeState(request, seq, result.value.snapshot))
}

/** Clears with `{ seq }` by writing a tombstone, still a session cookie. */
export async function clearReadingState(request: Request) {
  const { seq } = await readRequest(request)
  if (seq === undefined) return respond(invalid, undefined, 400)
  return done(await writeState(request, seq, null))
}

/**
 * Opens the reading cookie for rendering `/`. Returns the restored snapshot, or the headers that
 * delete a cookie that is altered, foreign, expired or impossible; a tombstone renders idle and
 * stays. Every `/` response is `private, no-cache` and varies by cookie.
 */
export async function savedReading(
  request: Request,
): Promise<{ snapshot?: ReadingSnapshot; headers: Record<string, string> }> {
  const token = await readingCookie.parse(request.headers.get('Cookie'))
  if (token === null) return { headers: pageCache }
  const state = await openState(token)
  if (!state) return { headers: { ...pageCache, 'Set-Cookie': await clearCookie() } }
  return { snapshot: state.r ?? undefined, headers: pageCache }
}
