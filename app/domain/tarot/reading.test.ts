import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizeQuestion } from './reading.ts'

test('trims and NFC-normalizes while preserving interior whitespace/case/punctuation', () => {
  const result = normalizeQuestion('  Should I  rewrite it?  ')
  assert.equal(result.success, true)
  assert.equal(result.success && result.value, 'Should I  rewrite it?')
})

test('composed and decomposed Unicode spellings normalize identically', () => {
  const composedInput = 'é' // LATIN SMALL LETTER E WITH ACUTE (NFC form)
  const decomposedInput = 'é' // 'e' + COMBINING ACUTE ACCENT (NFD form)
  assert.notEqual(composedInput, decomposedInput)

  const composed = normalizeQuestion(composedInput)
  const decomposed = normalizeQuestion(decomposedInput)
  assert.equal(composed.success, true)
  assert.equal(decomposed.success, true)
  assert.equal(composed.success && composed.value, decomposed.success && decomposed.value)
})

test('accepts exactly 160 normalized code points', () => {
  const input = 'a'.repeat(160)
  const result = normalizeQuestion(input)
  assert.equal(result.success, true)
})

test('rejects 161 normalized code points', () => {
  const input = 'a'.repeat(161)
  const result = normalizeQuestion(input)
  assert.deepEqual(result, { success: false, error: 'invalid-question' })
})

test('counts supplementary-plane characters as one code point each', () => {
  const emoji = '\u{1F600}'
  const input = emoji.repeat(160)
  assert.equal([...input].length, 160)
  const result = normalizeQuestion(input)
  assert.equal(result.success, true)

  const tooLong = emoji.repeat(161)
  assert.deepEqual(normalizeQuestion(tooLong), { success: false, error: 'invalid-question' })
})

test('rejects non-string values', () => {
  for (const value of [42, null, undefined, {}, [], true]) {
    assert.deepEqual(normalizeQuestion(value), { success: false, error: 'invalid-question' })
  }
})

test('rejects ill-formed Unicode (unpaired surrogate)', () => {
  const unpaired = 'a\uD800b'
  assert.deepEqual(normalizeQuestion(unpaired), { success: false, error: 'invalid-question' })
})

test('accepts empty and whitespace-only input as the empty string', () => {
  assert.deepEqual(normalizeQuestion(''), { success: true, value: '' })
  assert.deepEqual(normalizeQuestion('   '), { success: true, value: '' })
})
