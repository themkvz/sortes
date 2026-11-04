export interface ServerEnv {
  host: string
  port: number
  readingStateSecret: string
}

const VALID_MODES = ['development', 'production', 'test'] as const
const READING_STATE_SECRET_MIN_LENGTH = 32
// Development and test seal with a per-process key, so saved readings stop opening after a restart.
const temporaryReadingStateSecret = crypto.randomUUID() + crypto.randomUUID()

export function loadServerEnv(env: Record<string, string | undefined> = process.env): ServerEnv {
  const mode = env.NODE_ENV ?? 'development'
  if (!(VALID_MODES as readonly string[]).includes(mode)) {
    throw new Error(`Invalid NODE_ENV "${mode}". Expected one of: ${VALID_MODES.join(', ')}.`)
  }

  const host = env.HOST ?? '0.0.0.0'

  const rawPort = env.PORT ?? '44100'
  const port = Number(rawPort)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT "${rawPort}". Expected an integer between 1 and 65535.`)
  }

  const secret = env.READING_STATE_SECRET ?? ''
  if (secret === '' && mode === 'production') {
    throw new Error(
      `Missing READING_STATE_SECRET. Set it to a random value of at least ${READING_STATE_SECRET_MIN_LENGTH} characters.`,
    )
  }
  if (secret !== '' && secret.length < READING_STATE_SECRET_MIN_LENGTH) {
    throw new Error(
      `Invalid READING_STATE_SECRET. Expected at least ${READING_STATE_SECRET_MIN_LENGTH} characters.`,
    )
  }
  const readingStateSecret = secret === '' ? temporaryReadingStateSecret : secret

  return { host, port, readingStateSecret }
}
