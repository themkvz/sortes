import * as assert from 'remix/assert'
import { test } from 'remix/test'

import { developerDeck } from './domain/tarot/decks/developer.ts'
import { createAppRouter } from './router.tsx'

test('ships a nonempty WebP front for every developer card', async () => {
  for (const card of developerDeck.cards) {
    const file = Bun.file(
      new URL(`../public/cards/developer/fronts/${card.id}.webp`, import.meta.url),
    )
    assert.equal(await file.exists(), true, card.id)
    const bytes = new Uint8Array(await file.arrayBuffer())
    assert.ok(bytes.length > 12, card.id)
    assert.equal(new TextDecoder().decode(bytes.subarray(0, 4)), 'RIFF', card.id)
    assert.equal(new TextDecoder().decode(bytes.subarray(8, 12)), 'WEBP', card.id)
  }
})

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
