import { test } from 'bun:test'
import assert from 'node:assert/strict'

import { loadServerEnv } from './env.ts'

test('defaults succeed without any env vars set', () => {
  const env = loadServerEnv({})
  assert.equal(env.mode, 'development')
  assert.equal(env.port, 44100)
  assert.equal(env.host, '0.0.0.0')
})

test('rejects an out-of-range port with an actionable message', () => {
  assert.throws(() => loadServerEnv({ PORT: '999999' }), /PORT/)
})

test('rejects a non-numeric port', () => {
  assert.throws(() => loadServerEnv({ PORT: 'abc' }), /PORT/)
})

test('rejects an unsupported NODE_ENV value', () => {
  assert.throws(() => loadServerEnv({ NODE_ENV: 'staging' }), /NODE_ENV/)
})

test('accepts a valid explicit production configuration', () => {
  const env = loadServerEnv({ NODE_ENV: 'production', PORT: '8080', HOST: '127.0.0.1' })
  assert.deepEqual(env, { host: '127.0.0.1', port: 8080, mode: 'production' })
})
