import { test } from 'bun:test'
import assert from 'node:assert/strict'

import { createAppRouter } from '../router.tsx'
import { routes } from '../routes.ts'

test('GET / renders the initial board with the required elements', async () => {
  const router = createAppRouter()
  const response = await router.fetch(new Request(`http://localhost${routes.home.href()}`))

  assert.equal(response.status, 200)
  const html = await response.text()
  assert.match(html, /Pseudo Tarot/)
  assert.match(html, /CONTEXT/)
  assert.match(html, /PROBLEM/)
  assert.match(html, /ADVICE/)
  assert.match(html, /9 CARDS WAITING FOR YOUR QUESTION/)
})

test('unknown routes return 404 with a link back home', async () => {
  const router = createAppRouter()
  const response = await router.fetch(new Request('http://localhost/does-not-exist'))

  assert.equal(response.status, 404)
  const html = await response.text()
  assert.match(html, /href="\/"/)
})

test('unexpected action failures return a generic 500 without a stack trace', async () => {
  const router = createAppRouter()
  router.get('/__boom', () => {
    throw new Error('boom')
  })

  const response = await router.fetch(new Request('http://localhost/__boom'))

  assert.equal(response.status, 500)
  const text = await response.text()
  assert.equal(text, 'Internal Server Error')
  assert.doesNotMatch(text, /\.tsx?:\d+/)
})
