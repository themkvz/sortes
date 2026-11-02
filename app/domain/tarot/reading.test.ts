import { expect } from 'remix/assert'
import { test } from 'remix/test'

import { normalizeQuestion } from './reading.ts'

test('trims and NFC-normalizes while preserving interior whitespace/case/punctuation', () => {
  const result = normalizeQuestion('  Should I  rewrite it?  ')
  if (!result.success) throw new Error('Expected successful normalization')
  expect(result.value).toBe('Should I  rewrite it?')
})

test('composed and decomposed Unicode spellings normalize identically', () => {
  const composedInput = 'é' // LATIN SMALL LETTER E WITH ACUTE (NFC form)
  const decomposedInput = 'é' // 'e' + COMBINING ACUTE ACCENT (NFD form)
  expect(composedInput).not.toBe(decomposedInput)

  const composed = normalizeQuestion(composedInput)
  const decomposed = normalizeQuestion(decomposedInput)
  if (!composed.success) throw new Error('Expected composed input to normalize')
  if (!decomposed.success) throw new Error('Expected decomposed input to normalize')
  expect(composed.value).toBe(decomposed.value)
})

test('accepts exactly 160 normalized code points', () => {
  const input = 'a'.repeat(160)
  const result = normalizeQuestion(input)
  expect(result.success).toBe(true)
})

test('rejects 161 normalized code points', () => {
  const input = 'a'.repeat(161)
  const result = normalizeQuestion(input)
  expect(result).toEqual({ success: false, error: 'invalid-question' })
})

test('counts supplementary-plane characters as one code point each', () => {
  const emoji = '\u{1F600}'
  const input = emoji.repeat(160)
  expect([...input].length).toBe(160)
  const result = normalizeQuestion(input)
  expect(result.success).toBe(true)

  const tooLong = emoji.repeat(161)
  expect(normalizeQuestion(tooLong)).toEqual({ success: false, error: 'invalid-question' })
})

test('rejects non-string values', () => {
  for (const value of [42, null, undefined, {}, [], true]) {
    expect(normalizeQuestion(value)).toEqual({ success: false, error: 'invalid-question' })
  }
})

test('rejects ill-formed Unicode (unpaired surrogate)', () => {
  const unpaired = 'a\uD800b'
  expect(normalizeQuestion(unpaired)).toEqual({ success: false, error: 'invalid-question' })
})

test('accepts empty and whitespace-only input as the empty string', () => {
  expect(normalizeQuestion('')).toEqual({ success: true, value: '' })
  expect(normalizeQuestion('   ')).toEqual({ success: true, value: '' })
})
