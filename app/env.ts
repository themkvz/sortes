export interface ServerEnv {
  host: string
  port: number
  mode: 'development' | 'production' | 'test'
}

const VALID_MODES = ['development', 'production', 'test'] as const

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

  return { host, port, mode: mode as ServerEnv['mode'] }
}
