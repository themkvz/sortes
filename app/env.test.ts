import { expect } from 'remix/assert'
import { test } from 'remix/test'

import { loadServerEnv } from './env.ts'

const PRODUCTION_SECRET = 'production-reading-state-secret-0123456789'

test('defaults succeed without any env vars set', () => {
  const env = loadServerEnv({})
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
  const env = loadServerEnv({
    NODE_ENV: 'production',
    PORT: '8080',
    HOST: '127.0.0.1',
    READING_STATE_SECRET: PRODUCTION_SECRET,
  })
  expect(env).toEqual({ host: '127.0.0.1', port: 8080, readingStateSecret: PRODUCTION_SECRET })
})

test('requires a reading state secret in production', () => {
  expect(() => loadServerEnv({ NODE_ENV: 'production' })).toThrow(/READING_STATE_SECRET/)
  expect(() => loadServerEnv({ NODE_ENV: 'production', READING_STATE_SECRET: '' })).toThrow(
    /READING_STATE_SECRET/,
  )
})

test('rejects a short reading state secret without echoing it', () => {
  const secret = 'too-short-secret'
  expect(() => loadServerEnv({ NODE_ENV: 'production', READING_STATE_SECRET: secret })).toThrow(
    /READING_STATE_SECRET/,
  )
  try {
    loadServerEnv({ NODE_ENV: 'production', READING_STATE_SECRET: secret })
  } catch (error) {
    expect(String(error)).not.toContain(secret)
  }
})

test('development and test use one temporary secret per process', () => {
  const development = loadServerEnv({ NODE_ENV: 'development' }).readingStateSecret
  const testSecret = loadServerEnv({
    NODE_ENV: 'test',
    READING_STATE_SECRET: '',
  }).readingStateSecret
  expect(development.length).toBeGreaterThanOrEqual(32)
  expect(testSecret).toBe(development)
})
