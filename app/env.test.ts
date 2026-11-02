import { expect } from 'remix/assert'
import { test } from 'remix/test'

import { loadServerEnv } from './env.ts'

test('defaults succeed without any env vars set', () => {
  const env = loadServerEnv({})
  expect(env.mode).toBe('development')
  expect(env.port).toBe(44100)
  expect(env.host).toBe('0.0.0.0')
})

test('rejects an out-of-range port with an actionable message', () => {
  expect(() => loadServerEnv({ PORT: '999999' })).toThrow(/PORT/)
})

test('rejects a non-numeric port', () => {
  expect(() => loadServerEnv({ PORT: 'abc' })).toThrow(/PORT/)
})

test('rejects an unsupported NODE_ENV value', () => {
  expect(() => loadServerEnv({ NODE_ENV: 'staging' })).toThrow(/NODE_ENV/)
})

test('accepts a valid explicit production configuration', () => {
  const env = loadServerEnv({ NODE_ENV: 'production', PORT: '8080', HOST: '127.0.0.1' })
  expect(env).toEqual({ host: '127.0.0.1', port: 8080, mode: 'production' })
})
