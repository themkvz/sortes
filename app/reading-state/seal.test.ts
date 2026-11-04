import { expect } from 'remix/assert'
import { test } from 'remix/test'

import { developerDeck } from '../domain/tarot/decks/developer.ts'
import { createReadingKey, openValue, sealValue } from './seal.ts'

const QUESTION = 'Should I rewrite the billing service?'
const value = {
  v: 1,
  q: QUESTION,
  choices: developerDeck.cards.slice(0, 9).map(({ id }) => id),
}

const keyA = await createReadingKey('reading-state-test-secret-a-0123456789')
const keyB = await createReadingKey('reading-state-test-secret-b-0123456789')

function rewrite(token: string, edit: (bytes: Buffer) => void) {
  const bytes = Buffer.from(token, 'base64url')
  edit(bytes)
  return bytes.toString('base64url')
}

test('a sealed token opens with the same key and hides the question and card IDs', async () => {
  const token = await sealValue(keyA, value)
  expect(await openValue(keyA, token)).toEqual(value)

  const raw = Buffer.from(token, 'base64url').toString('latin1')
  expect(raw).not.toContain(QUESTION)
  expect(raw).not.toContain('billing')
  for (const card of developerDeck.cards) {
    expect(raw).not.toContain(card.id)
    expect(token).not.toContain(card.name)
  }
})

test('every seal uses a fresh IV', async () => {
  expect(await sealValue(keyA, value)).not.toBe(await sealValue(keyA, value))
})

test('a tampered token, a different key or an unsupported version fails', async () => {
  const token = await sealValue(keyA, value)
  const last = Buffer.from(token, 'base64url').length - 1
  const edits = [
    (bytes: Buffer) => (bytes[last] ^= 1), // authentication tag
    (bytes: Buffer) => (bytes[5] ^= 1), // IV
    (bytes: Buffer) => (bytes[0] = 2), // version
  ]
  for (const edit of edits) expect(await openValue(keyA, rewrite(token, edit))).toBe(undefined)
  expect(await openValue(keyB, token)).toBe(undefined)
})

test('malformed tokens fail without throwing', async () => {
  for (const token of ['', 'not base64url!', 'AQ', 'A'.repeat(40), `AQ${'A'.repeat(40)}`]) {
    expect(await openValue(keyA, token)).toBe(undefined)
  }
})
