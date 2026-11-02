import * as assert from 'remix/assert'
import { test } from 'remix/test'

import { createAppRouter } from './router.tsx'

test('does not serve test, environment, or server files', async () => {
  const router = createAppRouter()

  for (const path of [
    '/assets/app/env.ts',
    '/assets/app/domain/tarot/reading.test.ts',
    '/assets/server.ts',
  ]) {
    const response = await router.fetch(new Request(`http://localhost${path}`))

    assert.equal(response.status, 404, path)
  }
})
