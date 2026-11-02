import * as assert from 'remix/assert'
import { expect } from 'remix/assert'
import { render } from 'remix/component/test'
import { describe, test } from 'remix/test'

import { ReadingBoard } from './reading-board.tsx'

describe('ReadingBoard initial question', () => {
  test('validates and normalizes questions, then starts once', async (t) => {
    const { $, $$, act, cleanup } = render(<ReadingBoard />)
    t.after(cleanup)
    await act(() => {})

    const input = $('input')
    const ask = $('button[type="submit"]')
    assert.ok(input instanceof HTMLInputElement)
    assert.ok(ask instanceof HTMLButtonElement)

    await act(() => {
      input.value = 'x'.repeat(161)
      input.dispatchEvent(new Event('input', { bubbles: true }))
      ask.click()
    })
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(input.getAttribute('aria-describedby')).toBe($('[role="alert"]')?.id)
    expect($$('button[data-choice]').length).toBe(9)

    await act(() => {
      input.value = `bad-${String.fromCharCode(0xd800)}-question`
      input.dispatchEvent(new Event('input', { bubbles: true }))
      ask.click()
    })
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect($$('button[data-choice]').length).toBe(9)

    const supplementary = '😀'.repeat(160)
    await act(() => {
      input.value = `  ${supplementary}  `
      input.dispatchEvent(new Event('input', { bubbles: true }))
      ask.click()
    })
    expect(input.value).toBe(supplementary)
    expect(input.readOnly).toBe(true)
  })

  test('normalizes NFC, keeps choices stable, supports Surprise me and ignores repeated starts', async (t) => {
    const { $, $$, act, cleanup } = render(<ReadingBoard />)
    t.after(cleanup)
    await act(() => {})

    const input = $('input')
    const ask = $('button[type="submit"]')
    assert.ok(input instanceof HTMLInputElement)
    assert.ok(ask instanceof HTMLButtonElement)
    await act(() => {
      input.value = `  e${String.fromCharCode(0x301)}  `
      input.dispatchEvent(new Event('input', { bubbles: true }))
      ask.click()
    })
    expect(input.value).toBe('é')
    const choices = [...$$('button[data-choice]')].map((button) =>
      button.getAttribute('data-choice'),
    )
    await act(() => {
      $('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })
    expect(input.value).toBe('é')
    expect(
      [...$$('button[data-choice]')].map((button) => button.getAttribute('data-choice')),
    ).toEqual(choices)

    const surpriseBoard = render(<ReadingBoard />)
    const { act: surpriseAct, cleanup: surpriseCleanup } = surpriseBoard
    t.after(surpriseCleanup)
    await surpriseAct(() => {})
    const surpriseInput = surpriseBoard.$('input')
    assert.ok(surpriseInput instanceof HTMLInputElement)
    await surpriseAct(() => surpriseBoard.$('button[type="submit"]')?.click())
    expect(surpriseInput.value).not.toBe('')
    expect(surpriseInput.readOnly).toBe(true)
  })

  test('keeps focus inside the board that starts', async (t) => {
    const firstBoard = render(<ReadingBoard />)
    const secondBoard = render(<ReadingBoard />)
    t.after(firstBoard.cleanup)
    t.after(secondBoard.cleanup)
    await firstBoard.act(() => {})
    await secondBoard.act(() => {})

    const input = secondBoard.$('input')
    const ask = secondBoard.$('button[type="submit"]')
    const firstChoice = firstBoard.$('[data-choice="0"]')
    const secondChoice = secondBoard.$('[data-choice="0"]')
    assert.ok(input instanceof HTMLInputElement)
    assert.ok(ask instanceof HTMLButtonElement)
    assert.ok(firstChoice instanceof HTMLButtonElement)
    assert.ok(secondChoice instanceof HTMLButtonElement)

    await secondBoard.act(() => {
      input.value = 'Start the second board'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      ask.click()
    })

    expect(document.activeElement).toBe(secondChoice)
    expect(document.activeElement).not.toBe(firstChoice)
  })
})
