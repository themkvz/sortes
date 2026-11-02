import { expect } from 'remix/assert'
import { test } from 'remix/test'

import { createAppRouter } from '../router.tsx'

test('unknown routes return 404 with a link back home', async () => {
  const router = createAppRouter()
  const response = await router.fetch(new Request('http://localhost/does-not-exist'))

  expect(response.status).toBe(404)
  const html = await response.text()
  expect(html).toMatch(/href="\/"/)
})
