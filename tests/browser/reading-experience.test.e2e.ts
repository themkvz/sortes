import type { BrowserContextOptions, Page } from 'playwright'
import { expect } from 'remix/assert'
import { createTestServer } from 'remix/node-fetch-server/test'
import { describe, type TestContext, test } from 'remix/test'

import { developerDeck } from '../../app/domain/tarot/decks/developer.ts'
import { idle, place, reveal, start as startReading } from '../../app/domain/tarot/reading.ts'
import type { ReadingSnapshot } from '../../app/domain/tarot/snapshot.ts'
import { loadServerEnv } from '../../app/env.ts'
import { createReadingKey, openValue } from '../../app/reading-state/seal.ts'
import { createAppRouter } from '../../app/router.tsx'
import { routes } from '../../app/routes.ts'

const positions = developerDeck.positions
const SENTINELS = /Should I ask|privacy sentinel|acceptance-question|private-question/i
const COOKIE_NAME = 'sortes_reading'
const IDLE_GATE = 'Ask your question first'
const SEAL_PATH = routes.readingSeal.href()
const READING_STATE_PATHS = [SEAL_PATH, routes.readingClear.href()]
const COOKIE_POLL_MS = 25
const COOKIE_WAIT_MS = 5000
// The test server runs in this process, so the test can open tokens with the same temporary key.
const readingKey = await createReadingKey(loadServerEnv().readingStateSecret)

function monitor(target: Page, errors: string[], unexpectedRequests: string[]) {
  target.on('pageerror', (error) => errors.push(error.message))
  target.on('console', (message) => {
    if (message.type() === 'error' && message.text().startsWith('Component error:')) {
      errors.push(message.text())
    }
  })
  target.on('request', (request) => {
    const url = new URL(request.url())
    const body = request.postData() ?? ''
    const details = `${request.method()} ${request.url()} ${body}`
    const isReadingState =
      request.method() === 'POST' &&
      url.origin === new URL(target.url()).origin &&
      READING_STATE_PATHS.includes(url.pathname)
    // Only the app's own seal route may receive the question; clear carries no reading.
    const checked = url.pathname === SEAL_PATH && isReadingState ? request.url() : details
    if (
      (request.method() !== 'GET' && !isReadingState) ||
      SENTINELS.test(decodeURIComponent(checked))
    ) {
      unexpectedRequests.push(details)
    }
  })
}

async function setup(t: TestContext) {
  const errors: string[] = []
  const unexpectedRequests: string[] = []
  const page = await t.serve(await createTestServer(createAppRouter().fetch))
  monitor(page, errors, unexpectedRequests)
  await page.goto('/')
  await waitIdle(page)
  await page.unroute('**/cards/card-back.webp')
  t.after(() => {
    expect(errors).toEqual([])
    expect(unexpectedRequests).toEqual([])
  })
  return { page, errors, unexpectedRequests }
}

async function openPage(
  page: Page,
  errors: string[],
  unexpectedRequests: string[],
  options?: BrowserContextOptions,
  waitForReady = true,
) {
  const browser = page.context().browser()
  if (!browser) throw new Error('The test page has no browser')
  const nextContext = await browser.newContext(options)
  const nextPage = await nextContext.newPage()
  monitor(nextPage, errors, unexpectedRequests)
  await nextPage.goto(page.url())
  if (waitForReady) await waitIdle(nextPage)
  return { context: nextContext, page: nextPage }
}

async function waitIdle(target: Page) {
  await target.getByRole('button', { name: 'Surprise me' }).waitFor({ state: 'visible' })
  await target.waitForFunction(() => {
    const button = [...document.querySelectorAll('button')].find(
      (item) => item.textContent?.trim() === 'Surprise me',
    )
    return button && !button.disabled
  })
}

async function start(target: Page, question: string) {
  const input = target.getByRole('textbox', { name: 'YOUR QUESTION' })
  await input.fill(question)
  await target.getByRole('button', { name: 'Ask' }).click()
  await target.waitForFunction(() => !!document.querySelector('input[readonly]'))
}

async function complete(
  target: Page,
  question: string,
  mode: 'click' | 'keyboard' | 'tap' = 'click',
) {
  const input = target.getByRole('textbox', { name: 'YOUR QUESTION' })
  await input.fill(question)
  if (mode === 'keyboard') await input.press('Enter')
  else await target.getByRole('button', { name: 'Ask' }).click()
  for (let index = 0; index < positions.length; index++) {
    const choice = target.getByRole('button', { name: `Choose hidden card ${index + 1}` })
    if (mode === 'tap') await choice.tap()
    else if (mode === 'keyboard') {
      await choice.focus()
      await target.keyboard.press('Space')
    } else await choice.click()
    const slot = target.getByRole('button', { name: `Place card in ${positions[index].label}` })
    if (mode === 'tap') await slot.tap()
    else if (mode === 'keyboard') {
      await slot.focus()
      await target.keyboard.press('Enter')
    } else await slot.click()
  }
  for (const position of positions) {
    const reveal = target.getByRole('button', { name: `Reveal ${position.label} card` })
    if (mode === 'tap') await reveal.tap()
    else if (mode === 'keyboard') {
      await reveal.focus()
      await target.keyboard.press('Space')
    } else await reveal.click()
  }
  await target.locator('[data-verdict]').waitFor()
  return target
}

async function readingCookie(target: Page) {
  return (await target.context().cookies()).find((cookie) => cookie.name === COOKIE_NAME)
}

/** Polls the context's cookie jar, since the seal and clear responses land asynchronously. */
async function waitForCookie(
  target: Page,
  isDone: (cookie: Awaited<ReturnType<typeof readingCookie>>) => boolean | Promise<boolean>,
) {
  const deadline = Date.now() + COOKIE_WAIT_MS
  for (;;) {
    const cookie = await readingCookie(target)
    if (await isDone(cookie)) return cookie
    if (Date.now() > deadline) throw new Error('Timed out waiting for the reading cookie')
    await target.waitForTimeout(COOKIE_POLL_MS)
  }
}

async function noBrowserWrites(target: Page) {
  const isPageEmpty = await target.evaluate(
    () => !localStorage.length && !sessionStorage.length && document.cookie === '',
  )
  return isPageEmpty && (await target.context().cookies()).length === 0
}

/**
 * After a reading starts, the only stored value is the sealed HttpOnly session cookie: scripts
 * cannot read it, browser storage stays empty, and it reveals no question or card.
 */
async function onlySealedReading(target: Page, question: string) {
  await waitForCookie(target, (cookie) => cookie !== undefined)
  const cookies = await target.context().cookies()
  expect(cookies.map(({ name }) => name)).toEqual([COOKIE_NAME])
  const [cookie] = cookies
  expect(cookie.httpOnly).toBe(true)
  expect(cookie.sameSite).toBe('Strict')
  expect(cookie.path).toBe('/')
  expect(cookie.expires).toBe(-1)
  const stored = await target.evaluate(() => ({
    localItems: localStorage.length,
    sessionItems: sessionStorage.length,
    cookie: document.cookie,
  }))
  expect(stored).toEqual({ localItems: 0, sessionItems: 0, cookie: '' })
  const raw = Buffer.from(cookie.value, 'base64url').toString('latin1')
  for (const text of [cookie.value, raw]) {
    expect(text).not.toContain(question)
    for (const card of developerDeck.cards) {
      expect(text).not.toContain(card.name)
      expect(text).not.toContain(card.meanings.context.text)
    }
  }
  for (const card of developerDeck.cards) expect(raw).not.toContain(card.id)
}

/** Opens the sealed `{ n, at, r }` state; `r` is `null` once the reading was cleared. */
async function stateOf(token: string | undefined) {
  const state = token ? await openValue(readingKey, token) : undefined
  return state as { n: number; at: number; r: ReadingSnapshot | null } | undefined
}

async function snapshotOf(token: string | undefined) {
  return (await stateOf(token))?.r ?? undefined
}

/** Only the cleared reading's tombstone cookie is left, and browser storage stays empty. */
async function onlyTombstone(target: Page) {
  const isPageEmpty = await target.evaluate(
    () => !localStorage.length && !sessionStorage.length && document.cookie === '',
  )
  const cookies = await target.context().cookies()
  if (!isPageEmpty || cookies.length !== 1) return false
  return (await stateOf(cookies[0].value))?.r === null
}

/**
 * Runs `action` and waits until the cookie holds the seal for that step (by placed and revealed
 * count). Each step has a unique count, so an older seal that was still in flight cannot match.
 */
async function saveAfter(
  target: Page,
  step: { placed: number; revealed: number },
  action: () => Promise<unknown>,
) {
  await action()
  const cookie = await waitForCookie(target, async (candidate) => {
    const snapshot = await snapshotOf(candidate?.value)
    const entries = Object.values(snapshot?.placements ?? {})
    return (
      !!snapshot &&
      entries.length === step.placed &&
      entries.filter(({ revealed }) => revealed).length === step.revealed
    )
  })
  return cookie?.value ?? ''
}

async function storedSnapshot(target: Page) {
  const snapshot = await snapshotOf((await readingCookie(target))?.value)
  if (!snapshot) throw new Error('Expected a saved reading')
  return snapshot
}

/** Records whether the idle gate is ever inserted while a page loads, from the first byte on. */
async function watchIdleGate(target: Page) {
  await target.addInitScript((gate) => {
    const watched = window as typeof window & { __sawIdleGate?: boolean }
    if (watched.__sawIdleGate !== undefined) return
    watched.__sawIdleGate = false
    new MutationObserver(() => {
      if (document.body?.textContent?.includes(gate)) watched.__sawIdleGate = true
    }).observe(document, { childList: true, subtree: true, characterData: true })
  }, IDLE_GATE)
}

/** The server-rendered page already holds the restored reading, never the idle board. */
async function expectRestoredHtml(target: Page, question: string) {
  const html = await (await target.request.get(new URL('/', target.url()).toString())).text()
  expect(html).not.toContain(IDLE_GATE)
  expect(html).toMatch(new RegExp(`<input[^>]* value="${question}"[^>]* readonly`))
}

/** Reloads and checks the restored reading is there from the first paint until it is ready. */
async function reloadRestored(target: Page, question: string) {
  await expectRestoredHtml(target, question)
  await watchIdleGate(target)
  await target.reload()
  await target.waitForFunction(
    () => document.querySelector('[aria-live="polite"]')?.textContent === 'Reading restored.',
  )
  expect(
    await target.evaluate(
      () => (window as typeof window & { __sawIdleGate?: boolean }).__sawIdleGate,
    ),
  ).toBe(false)
}

async function liveStatus(target: Page) {
  return target.locator('[aria-live="polite"]').first().textContent()
}

async function activeMatches(target: Page, selector: string) {
  await target.waitForFunction((value) => document.activeElement?.matches(value), selector)
}

async function effectCount(target: Page, selector: string) {
  return target
    .locator(selector)
    .evaluateAll((elements) =>
      elements.reduce(
        (sum, element) =>
          sum +
          element.getAnimations({ subtree: true }).length +
          element.querySelectorAll('[data-mode="burst"]').length,
        0,
      ),
    )
}

async function dragChoice(target: Page, choiceIndex: number, x: number, y: number) {
  const choice = target.locator(`[data-choice="${choiceIndex}"]`)
  await choice.scrollIntoViewIfNeeded()
  const bounds = await choice.boundingBox()
  if (!bounds) throw new Error(`Choice ${choiceIndex} is not visible`)
  await target.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
  await target.mouse.down()
  await target.mouse.move(x, y, { steps: 4 })
}

async function centerOf(target: Page, selector: string) {
  const element = target.locator(selector)
  await element.scrollIntoViewIfNeeded()
  const bounds = await element.boundingBox()
  if (!bounds) throw new Error(`${selector} is not visible`)
  return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }
}

async function cardColumnAlignment(target: Page) {
  return target.locator('[data-card-details]').evaluateAll((details) =>
    details.map((detail) => {
      const positionId = detail.getAttribute('data-card-position')
      const slot = [...document.querySelectorAll('[data-position]')].find(
        (candidate) => candidate.getAttribute('data-position') === positionId,
      )
      if (!slot) throw new Error(`No visual slot for card details at ${positionId}`)
      const detailBounds = detail.getBoundingClientRect()
      const slotBounds = slot.getBoundingClientRect()
      return {
        positionId,
        detailX: detailBounds.x,
        detailY: detailBounds.y,
        slotX: slotBounds.x,
      }
    }),
  )
}

async function verdictFor(target: Page, question: string) {
  const faces = await target
    .locator('[aria-label="Your spread"] [data-card-details]')
    .evaluateAll((details) => details.map((detail) => detail.getAttribute('data-card-id')))
  const cards = positions.map((_position, index) => {
    const card = developerDeck.cards.find((candidate) => candidate.id === faces[index])
    if (!card) throw new Error(`No deck card matches rendered face: ${faces[index]}`)
    return card
  })
  // A deck of only the rendered cards and an order-keeping RNG make choice index match position.
  const deck = { ...developerDeck, cards }
  const result = startReading(deck, idle(), question, () => 0.999)
  if (!result.success) throw new Error('Expected successful start')
  let state = result.value
  positions.forEach((position, index) => {
    state = place(deck, state, index, position.id)
  })
  for (const position of positions) state = reveal(deck, state, position.id)
  if (state.status !== 'complete') throw new Error('Expected complete state')
  const verdict = target.locator('[aria-label="Reading result"] p').nth(1)
  expect(await verdict.textContent()).toBe(state.interpretation.verdict)
  expect((await verdict.textContent())?.trim()).not.toBe('')
}

describe('reading experience', () => {
  test(
    'places mouse-dragged cards once, keeps identity hidden, and preserves the reveal gate',
    { timeout: 30_000 },
    async (t) => {
      const { page } = await setup(t)
      page.setDefaultTimeout(2_000)
      await page.setViewportSize({ width: 1440, height: 1400 })
      await start(page, 'desktop drag placement')
      // Placed cards leave the deck, so address choices by their stable index, not list position.
      const choices = { nth: (index: number) => page.locator(`[data-choice="${index}"]`) }
      await choices.nth(0).click()
      const dropOrder = [2, 0, 1]
      const sourceIndexes = [4, 6, 8]
      for (let step = 0; step < dropOrder.length; step++) {
        const target = await centerOf(page, `[data-position="${positions[dropOrder[step]].id}"]`)
        await dragChoice(page, sourceIndexes[step], target.x, target.y)
        await page.locator('[data-drag-preview]').waitFor({ state: 'visible', timeout: 2_000 })
        if (step === 0) {
          const viewport = page.viewportSize()
          if (!viewport) throw new Error('The drag test requires a fixed viewport')
          await page.mouse.move(viewport.width - 1, viewport.height - 1)
          const edgeBounds = await page.locator('[data-drag-preview]').evaluate((element) => {
            const rect = element.getBoundingClientRect()
            return { right: rect.right, bottom: rect.bottom }
          })
          expect(edgeBounds.right).toBeLessThanOrEqual(viewport.width)
          expect(edgeBounds.bottom).toBeLessThanOrEqual(viewport.height)
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth),
          ).toBeLessThanOrEqual(viewport.width)
          await page.mouse.move(target.x, target.y)
        }
        expect(await page.locator('[data-drag-preview]').getAttribute('aria-hidden')).toBe('true')
        expect(await page.locator('[data-position][data-drop-target]').count()).toBe(1)
        const boardText = (await page.locator('body').textContent()) ?? ''
        for (const card of developerDeck.cards) expect(boardText).not.toContain(card.name)
        expect(await page.locator('[data-reveal]').count()).toBe(step)
        await page.mouse.up()
        await page.locator('[data-drag-preview]').waitFor({ state: 'detached', timeout: 2_000 })
        if (step < 2) {
          expect(await choices.nth(sourceIndexes[step]).isDisabled()).toBe(true)
          expect(await choices.nth(0).getAttribute('aria-pressed')).toBe('false')
        } else expect(await page.locator('[data-choice]').count()).toBe(0)
        expect(await page.locator('[data-reveal]').count()).toBe(step + 1)
        if (step < 2) {
          await page.waitForFunction(
            (index) => document.activeElement?.getAttribute('data-choice') === String(index),
            (sourceIndexes[step] + 1) % 9,
            { timeout: 2_000 },
          )
        }
      }
      expect(await page.locator('[data-reveal]:not(:disabled)').count()).toBe(3)
      expect(await page.locator('[data-verdict]').count()).toBe(0)
      expect(
        await page
          .locator('[data-reveal]')
          .first()
          .evaluate((el) => document.activeElement === el),
      ).toBe(true)
    },
  )

  test('keeps the deck compact, ordered, and reachable at layout boundaries', async (t) => {
    const { page } = await setup(t)
    page.setDefaultTimeout(2_000)
    await start(page, 'deck layout boundaries')
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.mouse.move(0, 0)
    // Starting focuses the first choice with a smooth scroll; measure after it settles.
    await page.waitForFunction(() => {
      const y = window.scrollY
      return new Promise((resolve) => setTimeout(() => resolve(window.scrollY === y), 150))
    })
    const firstChoice = page.locator('[data-choice="0"]')
    const beforeHover = await firstChoice.boundingBox()
    if (!beforeHover) throw new Error('The first desktop choice is not visible')
    await firstChoice.hover()
    const duringHover = await firstChoice.boundingBox()
    if (!duringHover) throw new Error('The first desktop choice disappeared on hover')
    expect(Math.abs(duringHover.x - beforeHover.x)).toBeLessThanOrEqual(1)
    expect(Math.abs(duringHover.y - beforeHover.y)).toBeLessThanOrEqual(1)
    expect(Math.abs(duringHover.width - beforeHover.width)).toBeLessThanOrEqual(1)
    expect(Math.abs(duringHover.height - beforeHover.height)).toBeLessThanOrEqual(1)
    expect(Math.abs(duringHover.height / duringHover.width - 116 / 82)).toBeLessThan(0.05)

    for (const width of [1440, 1024, 1023, 768, 767, 390, 320]) {
      await page.setViewportSize({ width, height: 900 })
      const boxes = await page.locator('[data-choice]').evaluateAll((choices) =>
        choices.map((choice) => {
          const { x, y, width, height } = choice.getBoundingClientRect()
          return { tagName: choice.tagName, x, y, width, height }
        }),
      )
      expect(boxes).toHaveLength(9)
      expect(boxes.every(({ tagName }) => tagName === 'BUTTON')).toBe(true)
      expect(boxes.every(({ width: itemWidth, height }) => itemWidth >= 48 && height >= 48)).toBe(
        true,
      )
      for (let index = 0; index < boxes.length; index++) {
        for (const other of boxes.slice(index + 1)) {
          expect(
            boxes[index].x + boxes[index].width <= other.x ||
              other.x + other.width <= boxes[index].x ||
              boxes[index].y + boxes[index].height <= other.y ||
              other.y + other.height <= boxes[index].y,
          ).toBe(true)
        }
      }
      const cardHeight = boxes.reduce((total, box) => total + box.height, 0) / boxes.length
      if (width < 1024) {
        const rowTops: number[] = []
        for (const { y } of [...boxes].sort((a, b) => a.y - b.y)) {
          if (rowTops.every((top) => Math.abs(top - y) > cardHeight / 2)) rowTops.push(y)
        }
        expect(rowTops).toHaveLength(3)
      } else {
        const tops = boxes.map(({ y }) => y)
        expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(cardHeight / 2)
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      )
    }

    const question = page.getByRole('textbox', { name: 'YOUR QUESTION' })
    await question.focus()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Shift+Tab')
    const focus = await question.evaluate((input) => {
      const style = getComputedStyle(input)
      const parse = (value: string) => value.match(/[\d.]+/g)?.map(Number) ?? []
      const luminance = (color: string) => {
        const channels = parse(color)
          .slice(0, 3)
          .map((channel) => {
            const linear = channel / 255
            return linear <= 0.04045 ? linear / 12.92 : ((linear + 0.055) / 1.055) ** 2.4
          })
        return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
      }
      const border = luminance(style.borderTopColor)
      const background = luminance(style.backgroundColor)
      return {
        visible: input.matches(':focus-visible'),
        contrast: (Math.max(border, background) + 0.05) / (Math.min(border, background) + 0.05),
      }
    })
    expect(focus.visible).toBe(true)
    expect(focus.contrast).toBeGreaterThanOrEqual(3)
  })

  test(
    'rejects invalid drops and Escape cancellation while keeping later click and keyboard actions usable',
    { timeout: 30_000 },
    async (t) => {
      const { page } = await setup(t)
      await page.setViewportSize({ width: 1440, height: 1400 })
      await start(page, 'desktop drag cancellation')
      // Placed cards leave the deck, so address choices by their stable index, not list position.
      const choices = { nth: (index: number) => page.locator(`[data-choice="${index}"]`) }
      const jitter = await centerOf(page, '[data-choice="0"]')
      await page.mouse.move(jitter.x, jitter.y)
      await page.mouse.down()
      await page.mouse.move(jitter.x + 2, jitter.y + 1)
      await page.mouse.up()
      expect(await choices.nth(0).getAttribute('aria-pressed')).toBe('true')
      await page.keyboard.press('Escape')
      await page.mouse.move(jitter.x, jitter.y)
      await page.mouse.down()
      await page.keyboard.press('Escape')
      await page.mouse.up()
      expect(await choices.nth(0).getAttribute('aria-pressed')).toBe('false')
      expect(await page.locator('[data-reveal]').count()).toBe(0)
      expect(await page.locator('[data-drag-preview]').count()).toBe(0)
      await choices.nth(0).focus()
      await page.keyboard.press('Space')
      expect(await choices.nth(0).getAttribute('aria-pressed')).toBe('true')
      await page.keyboard.press('Escape')
      await choices.nth(1).click()
      const first = await centerOf(page, `[data-position="${positions[0].id}"]`)
      await dragChoice(page, 4, first.x, first.y)
      expect(await page.locator('[data-drop-target]').count()).toBe(1)
      await page.mouse.move(8, 8, { steps: 3 })
      expect(await page.locator('[data-position] [data-card-details], [data-reveal]').count()).toBe(
        0,
      )
      await page.mouse.up()
      expect(await choices.nth(1).getAttribute('aria-pressed')).toBe('true')
      expect(await page.locator('[data-drag-preview]').count()).toBe(0)

      const interrupt = await centerOf(page, '[data-choice="5"]')
      await page.mouse.move(interrupt.x, interrupt.y)
      await page.mouse.down()
      await page.mouse.move(first.x, first.y, { steps: 3 })
      await page.evaluate(() =>
        window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1 })),
      )
      await page.mouse.up()
      expect(await choices.nth(1).getAttribute('aria-pressed')).toBe('true')
      expect(await page.locator('[data-drag-preview]').count()).toBe(0)

      await page.mouse.move(interrupt.x, interrupt.y)
      await page.mouse.down()
      await page.mouse.move(first.x, first.y, { steps: 3 })
      await page.locator('[data-choice="5"]').evaluate((element) => {
        const source = element as HTMLButtonElement
        source.releasePointerCapture(1)
      })
      await page.mouse.up()
      expect(await choices.nth(1).getAttribute('aria-pressed')).toBe('true')
      expect(await page.locator('[data-drag-preview]').count()).toBe(0)

      await page.mouse.move(interrupt.x, interrupt.y)
      await page.mouse.down()
      await page.mouse.move(first.x, first.y, { steps: 3 })
      await page.evaluate(() => window.dispatchEvent(new Event('blur')))
      await page.mouse.up()
      expect(await choices.nth(1).getAttribute('aria-pressed')).toBe('true')
      expect(await page.locator('[data-drag-preview]').count()).toBe(0)

      const sourceCenter = await centerOf(page, '[data-choice="5"]')
      await page.mouse.move(sourceCenter.x, sourceCenter.y)
      await page.mouse.down()
      await page.mouse.move(first.x, first.y, { steps: 3 })
      await page.keyboard.press('Escape')
      await page.mouse.up()
      expect(await choices.nth(1).getAttribute('aria-pressed')).toBe('false')
      expect(await page.locator('[data-reveal]').count()).toBe(0)
      expect(await page.locator('[data-drag-preview]').count()).toBe(0)

      await choices.nth(2).click()
      await page.getByRole('button', { name: `Place card in ${positions[0].label}` }).click()
      await choices.nth(1).click()
      const occupied = await centerOf(page, `[data-position="${positions[0].id}"]`)
      await dragChoice(page, 4, occupied.x, occupied.y)
      await page.mouse.up()
      expect(await choices.nth(1).getAttribute('aria-pressed')).toBe('true')
      expect(await page.locator('[data-reveal]').count()).toBe(1)
      await choices.nth(1).click()
      await choices.nth(3).focus()
      await page.keyboard.press('Space')
      await page.getByRole('button', { name: `Place card in ${positions[1].label}` }).click()
      expect(await page.locator('[data-reveal]').count()).toBe(2)
    },
  )

  test(
    'keeps a mouse drag when touch pointer capture is lost on the source',
    { timeout: 30_000 },
    async (t) => {
      const { page, errors, unexpectedRequests } = await setup(t)
      page.setDefaultTimeout(2_000)
      const hybrid = await openPage(page, errors, unexpectedRequests, { hasTouch: true })
      t.after(() => hybrid.context.close())
      const target = hybrid.page
      target.setDefaultTimeout(2_000)
      await target.setViewportSize({ width: 1440, height: 1400 })
      await start(target, 'hybrid pointer drag')
      const sourcePoint = await centerOf(target, '[data-choice="5"]')
      const destination = await centerOf(target, `[data-position="${positions[0].id}"]`)
      await target.mouse.move(sourcePoint.x, sourcePoint.y)
      await target.mouse.down()
      await target.mouse.move(destination.x, destination.y, { steps: 3 })
      await target.locator('[data-drag-preview]').waitFor({ state: 'visible' })
      await target.touchscreen.tap(sourcePoint.x, sourcePoint.y)
      await target.locator('[data-drag-preview]').waitFor({ state: 'visible' })
      expect(await target.locator('[data-drop-target]').count()).toBe(1)
      await target.mouse.up()
      expect(
        await target
          .getByRole('button', { name: `Hidden card in ${positions[0].label} card` })
          .isDisabled(),
      ).toBe(true)
      expect(
        await target
          .locator('[data-choice="6"]')
          .evaluate((element) => document.activeElement === element),
      ).toBe(true)
    },
  )

  test(
    'replaces a pending choice, supports Escape, and places cards once with focus recovery',
    { timeout: 30_000 },
    async (t) => {
      const { page } = await setup(t)
      await start(page, 'placement flow')
      // Placed cards leave the deck, so address choices by their stable index, not list position.
      const choices = { nth: (index: number) => page.locator(`[data-choice="${index}"]`) }
      await choices.nth(2).click()
      expect(await choices.nth(2).getAttribute('data-selected')).not.toBeNull()
      expect(await choices.nth(2).locator('[data-badge="selected"]').count()).toBe(1)
      expect(await choices.nth(3).locator('*').count()).toBe(0)
      await choices.nth(5).click()
      expect(await choices.nth(2).isEnabled()).toBe(true)
      expect(await choices.nth(5).getAttribute('aria-pressed')).toBe('true')
      await page.keyboard.press('Escape')
      expect(await choices.nth(5).getAttribute('aria-pressed')).toBe('false')
      const order = [2, 0, 1]
      const used = [5, 6, 7]
      for (let step = 0; step < order.length; step++) {
        const choice = choices.nth(used[step])
        if (step === 0) {
          await choice.focus()
          await page.keyboard.press('Space')
        } else await choice.click()
        const slot = page.getByRole('button', {
          name: `Place card in ${positions[order[step]].label}`,
        })
        if (step === 1) {
          expect(
            await page
              .getByRole('button', { name: `Hidden card in ${positions[2].label} card` })
              .isDisabled(),
          ).toBe(true)
        }
        await slot.focus()
        await page.keyboard.press('Enter')
        if (step === 0) {
          expect(await choices.nth(5).isDisabled()).toBe(true)
          expect(await choices.nth(5).getAttribute('data-picked')).not.toBeNull()
          expect(await choices.nth(5).locator('[data-badge="placed"]').count()).toBe(1)
          await choices.nth(5).waitFor({ state: 'hidden' })
          expect(
            await page.locator('[data-reveal]').first().locator('[data-badge="placed"]').count(),
          ).toBe(1)
          expect(await page.locator('[data-reveal]').first().isDisabled()).toBe(true)
        }
        if (step === 2) {
          expect(
            await page
              .locator('[data-reveal]')
              .first()
              .locator('[data-badge="revealable"]')
              .count(),
          ).toBe(1)
          expect(await page.locator('[data-reveal]:not(:disabled)').count()).toBe(3)
        }
        if (step < 2) {
          await page.waitForFunction(
            (index) => document.activeElement?.getAttribute('data-choice') === String(index),
            (used[step] + 1) % 9,
          )
        }
      }
      expect(await page.locator('[data-choice]:enabled').count()).toBe(0)
      expect(await page.locator('[data-reveal]').count()).toBe(3)
      expect(
        await page
          .locator('[data-reveal]')
          .first()
          .evaluate((el) => document.activeElement === el),
      ).toBe(true)
      expect(await page.getByRole('heading', { name: 'Verdict' }).count()).toBe(0)
    },
  )

  test(
    'reveals only selected identities, permits noncanonical order, and renders the exact verdict',
    { timeout: 30_000 },
    async (t) => {
      const { page } = await setup(t)
      await page.evaluate(() => {
        const animate = Element.prototype.animate
        Object.defineProperty(window, '__revealAnimations', { value: [] })
        Object.defineProperty(window, '__revealedFrames', { value: [] })
        // One animation per reveal: the whole card turns over.
        Element.prototype.animate = function (...args) {
          const animation = animate.apply(this, args)
          ;(window as typeof window & { __revealAnimations: Animation[] }).__revealAnimations.push(
            animation,
          )
          animation.pause()
          return animation
        }
      })
      await start(page, 'privacy sentinel question')
      expect(await page.getByRole('button', { name: 'Share', exact: true }).count()).toBe(0)
      const choices = page.getByRole('button', { name: /^Choose hidden card \d+$/ })
      for (let index = 0; index < 3; index++) {
        await choices.nth(index + 4).click()
        await page.getByRole('button', { name: `Place card in ${positions[index].label}` }).click()
      }
      const initial = await page.locator('body').textContent()
      const initialLabels = await page
        .locator('[aria-label], [aria-description], [title]')
        .evaluateAll((elements) =>
          elements
            .map((element) =>
              ['aria-label', 'aria-description', 'title']
                .map((name) => element.getAttribute(name))
                .join(' '),
            )
            .join(' '),
        )
      for (const card of developerDeck.cards) {
        expect(initial).not.toContain(card.name)
        expect(initial).not.toContain(card.shortDescription)
        expect(initialLabels).not.toContain(card.name)
        for (const position of positions) {
          expect(initial).not.toContain(card.meanings[position.id].text)
        }
      }
      expect(await page.locator('img[data-front-art]').count()).toBe(0)
      const order = [positions[2], positions[0], positions[1]]
      const revealed = new Map<string, (typeof developerDeck.cards)[number]>()
      for (let index = 0; index < order.length; index++) {
        const before = (await page.locator('body').textContent()) ?? ''
        await page.getByRole('button', { name: `Reveal ${order[index].label} card` }).click()
        const after = (await page.locator('body').textContent()) ?? ''
        const exposed = developerDeck.cards.filter(
          (card) => !before.includes(card.name) && after.includes(card.name),
        )
        expect(exposed).toHaveLength(1)
        const card = exposed[0]
        revealed.set(order[index].id, card)
        const details = page.locator(`[data-card-details][data-card-position="${order[index].id}"]`)
        await details.waitFor()
        expect(await details.getAttribute('data-card-id')).toBe(card.id)
        const heading = details.getByRole('heading')
        expect(await heading.count()).toBe(1)
        expect(await heading.textContent()).toContain(card.name)
        expect(await heading.textContent()).toContain(order[index].label)
        expect(await page.getByText(card.shortDescription, { exact: true }).count()).toBe(1)
        expect(
          await page.getByText(card.meanings[order[index].id].text, { exact: true }).count(),
        ).toBe(1)
        expect(await page.locator('[data-card-details]').count()).toBe(index + 1)
        const front = page.locator(`[data-front-art][src$="/${card.id}.webp"]`)
        await front.waitFor({ state: 'visible' })
        expect(
          await page.evaluate(
            () =>
              (window as typeof window & { __revealAnimations: Animation[] }).__revealAnimations
                .length,
          ),
        ).toBe(index + 1)
        expect(await front.getAttribute('alt')).toBe('')
        await front.evaluate((image) => (image as HTMLImageElement).decode())
        expect(
          await front.evaluate((image) => (image as HTMLImageElement).naturalWidth),
        ).toBeGreaterThan(0)
        expect(await page.locator('img[data-front-art]').count()).toBe(index + 1)
        expect(
          await page.evaluate((src) => {
            const current = document.querySelector(`[data-front-art][src$="/${src}"]`)
            const frames = (window as typeof window & { __revealedFrames: Element[] })
              .__revealedFrames
            if (current && !frames.includes(current)) frames.push(current)
            return frames.every((frame) => frame.isConnected && document.contains(frame))
          }, `${card.id}.webp`),
        ).toBe(true)
        if (index === 2) {
          expect(
            await page
              .locator('[data-verdict]')
              .evaluate((element) => document.activeElement === element),
          ).toBe(true)
        } else {
          expect(
            await page
              .locator('[data-reveal]:not(:disabled)')
              .first()
              .evaluate((element) => document.activeElement === element),
          ).toBe(true)
        }
        if (index === 0) {
          await page.evaluate(() => {
            Object.defineProperty(window, '__resizeFront', {
              value: document.querySelector('[data-front-art]'),
            })
          })
          await page.setViewportSize({ width: 767, height: 900 })
          expect(await page.locator('[data-card-details]').count()).toBe(1)
          expect(
            await page.evaluate(
              () =>
                (window as typeof window & { __resizeFront: Element }).__resizeFront ===
                document.querySelector('[data-front-art]'),
            ),
          ).toBe(true)
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          ).toBe(true)
          expect(
            await page.evaluate(
              () =>
                (window as typeof window & { __revealAnimations: Animation[] }).__revealAnimations
                  .length,
            ),
          ).toBe(1)
          await page.setViewportSize({ width: 1024, height: 900 })
          expect(await page.locator('[data-card-details]').count()).toBe(1)
          expect(
            await page.evaluate(
              () =>
                (window as typeof window & { __resizeFront: Element }).__resizeFront ===
                document.querySelector('[data-front-art]'),
            ),
          ).toBe(true)
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          ).toBe(true)
          const partialAlignment = await cardColumnAlignment(page)
          expect(partialAlignment).toHaveLength(1)
          expect(
            Math.abs(partialAlignment[0].detailX - partialAlignment[0].slotX),
          ).toBeLessThanOrEqual(1)
          expect(
            await page.evaluate(
              () =>
                (window as typeof window & { __revealAnimations: Animation[] }).__revealAnimations
                  .length,
            ),
          ).toBe(1)
          await page.emulateMedia({ reducedMotion: 'reduce' })
          await page.waitForFunction(() =>
            (
              window as typeof window & { __revealAnimations: Animation[] }
            ).__revealAnimations.every((animation) => animation.playState === 'idle'),
          )
          expect(
            await page.evaluate(() =>
              (
                window as typeof window & { __revealAnimations: Animation[] }
              ).__revealAnimations.every((animation) => animation.playState === 'idle'),
            ),
          ).toBe(true)
          await page.emulateMedia({ reducedMotion: 'no-preference' })
        }
        expect(after).toContain(card.shortDescription)
        expect(after).toContain(card.meanings[order[index].id].text)
        expect(await details.textContent()).toContain(order[index].label)
        if (index < 2) {
          expect(await page.locator('[data-verdict]').count()).toBe(0)
          const domText = await page.locator('body').textContent()
          const ariaText = await page
            .locator('[aria-label], [aria-description], [title]')
            .evaluateAll((elements) =>
              elements
                .map((element) =>
                  ['aria-label', 'aria-description', 'title']
                    .map((name) => element.getAttribute(name))
                    .join(' '),
                )
                .join(' '),
            )
          const visibleText = [...revealed.values()].flatMap((revealedCard) => [
            revealedCard.shortDescription,
            ...positions.map((position) => revealedCard.meanings[position.id].text),
          ])
          for (const hiddenCard of developerDeck.cards.filter(
            (item) => ![...revealed.values()].some((visible) => visible.id === item.id),
          )) {
            expect(domText).not.toContain(hiddenCard.name)
            expect(ariaText).not.toContain(hiddenCard.name)
            const hiddenText = [
              hiddenCard.shortDescription,
              ...positions.map((position) => hiddenCard.meanings[position.id].text),
            ]
            for (const text of hiddenText) {
              if (visibleText.includes(text)) continue
              expect(domText).not.toContain(text)
              expect(ariaText).not.toContain(text)
            }
          }
          const nextReveal = page.locator('[data-reveal]:not(:disabled)').first()
          expect(await nextReveal.evaluate((element) => document.activeElement === element)).toBe(
            true,
          )
        }
      }
      expect(await page.getByRole('heading', { name: 'Verdict' }).count()).toBe(1)
      expect(
        await page.locator('[data-verdict]').evaluate((el) => document.activeElement === el),
      ).toBe(true)
      await verdictFor(page, 'privacy sentinel question')
      expect(await page.getByRole('button', { name: 'Ask again' }).count()).toBe(1)
      expect(await page.locator('[aria-label="Reading result"] p').first().textContent()).toBe(
        'privacy sentinel question',
      )
      const faces = await page
        .locator('[aria-label="Your spread"] [data-card-details]')
        .evaluateAll((details) => details.map((detail) => detail.textContent ?? ''))
      expect(faces).toHaveLength(positions.length)
      expect(
        await page
          .locator('[aria-label="Your spread"] [data-card-details]')
          .evaluateAll((details) =>
            details.map((detail) => detail.getAttribute('data-card-position')),
          ),
      ).toEqual(positions.map((position) => position.id))
      const finalAlignment = await cardColumnAlignment(page)
      expect(finalAlignment).toHaveLength(positions.length)
      expect(
        Math.max(...finalAlignment.map(({ detailY }) => detailY)) -
          Math.min(...finalAlignment.map(({ detailY }) => detailY)),
      ).toBeLessThanOrEqual(1)
      for (const { detailX, slotX } of finalAlignment) {
        expect(Math.abs(detailX - slotX)).toBeLessThanOrEqual(1)
      }
      const frontIds = await page
        .locator('[aria-label="Your spread"] img[data-front-art]')
        .evaluateAll((images) =>
          images.map((image) => (image as HTMLImageElement).src.split('/').at(-1)),
        )
      expect(frontIds).toEqual(positions.map((position) => `${revealed.get(position.id)?.id}.webp`))
      for (const position of positions) {
        const card = revealed.get(position.id)
        if (!card) throw new Error(`No revealed card recorded for ${position.id}`)
        expect(faces[positions.indexOf(position)]).toContain(card.name)
        expect(faces[positions.indexOf(position)]).toContain(card.meanings[position.id].text)
      }
      expect(await page.getByRole('button', { name: /Reveal all/i }).count()).toBe(0)
      expect(await page.getByRole('button', { name: 'Share' }).count()).toBe(1)
      await onlySealedReading(page, 'privacy sentinel question')
      expect(
        await page.evaluate(
          () =>
            (window as typeof window & { __revealAnimations: Animation[] }).__revealAnimations
              .length,
        ),
      ).toBe(3)
      await page.getByRole('button', { name: 'Ask again' }).focus()
      await page.keyboard.press('Enter')
      await page.waitForFunction(() => document.activeElement?.matches('input'))
      expect(await page.getByRole('textbox', { name: 'YOUR QUESTION' }).inputValue()).toBe('')
      expect(await page.getByRole('button', { name: /^Choose hidden card \d+$/ }).count()).toBe(9)
      expect(await page.locator('[data-verdict]').count()).toBe(0)
      await start(page, 'fresh reading after motion')
      for (let index = 0; index < 3; index++) {
        await page.getByRole('button', { name: `Choose hidden card ${index + 1}` }).click()
        await page.getByRole('button', { name: `Place card in ${positions[index].label}` }).click()
      }
      await page.getByRole('button', { name: `Reveal ${positions[0].label} card` }).click()
      expect(
        await page.evaluate(
          () =>
            (window as typeof window & { __revealAnimations: Animation[] }).__revealAnimations
              .length,
        ),
      ).toBe(4)
    },
  )

  test(
    'a delayed older seal during Reveal all does not replace the completed reading',
    { timeout: 30_000 },
    async (t) => {
      const { page } = await setup(t)
      const question = 'delayed reveal all seal'
      await saveAfter(page, { placed: 0, revealed: 0 }, () => start(page, question))
      for (let index = 0; index < 3; index++) {
        await page.getByRole('button', { name: `Choose hidden card ${index + 1}` }).click()
        await saveAfter(page, { placed: index + 1, revealed: 0 }, () =>
          page.getByRole('button', { name: `Place card in ${positions[index].label}` }).click(),
        )
      }
      // The first Reveal all seal that is not the final one reaches the server, but its response
      // is held until the reading is complete on screen.
      let releaseHeld!: () => void
      const held = new Promise<void>((resolve) => {
        releaseHeld = resolve
      })
      let heldDone: Promise<void> | undefined
      await page.route('**/reading-state/seal', async (route) => {
        const { snapshot } = route.request().postDataJSON() as { snapshot: ReadingSnapshot }
        const revealed = Object.values(snapshot.placements).filter((item) => item.revealed)
        if (revealed.length === 0 || revealed.length === 3 || heldDone) return route.continue()
        heldDone = (async () => {
          const response = await route.fetch()
          await held
          await route.fulfill({ response }).catch(() => {})
        })()
        await heldDone
      })
      await page.getByRole('button', { name: 'Reveal all' }).click()
      await page.locator('[data-verdict]').waitFor()
      expect(heldDone).toBeDefined()
      releaseHeld()
      // One write is in flight at a time, so the completed reading is sealed after the held one.
      await saveAfter(page, { placed: 3, revealed: 3 }, async () => heldDone)
      await page.unroute('**/reading-state/seal')

      const saved = await storedSnapshot(page)
      expect(Object.values(saved.placements).every(({ revealed }) => revealed)).toBe(true)
      await reloadRestored(page, question)
      expect(await page.locator('[data-verdict]').count()).toBe(1)
      await verdictFor(page, question)
    },
  )

  test('reveal all turns the remaining cards and completes the reading', async (t) => {
    const { page } = await setup(t)
    await start(page, 'reveal all question')
    expect(await page.locator('[data-reveal-all]').count()).toBe(0)
    for (let index = 0; index < 3; index++) {
      await page.locator('[data-choice]:not([data-picked])').first().click()
      await page.getByRole('button', { name: `Place card in ${positions[index].label}` }).click()
    }
    await page.getByRole('button', { name: `Reveal ${positions[1].label} card` }).click()
    expect(await page.locator('[data-verdict]').count()).toBe(0)
    await page.getByRole('button', { name: 'Reveal all' }).click()
    await page.locator('[data-verdict]').waitFor()
    expect(await page.locator('[data-card-details]').count()).toBe(3)
    expect(await page.locator('[data-reveal-all]').count()).toBe(0)
    await page.waitForFunction(() => document.activeElement?.matches('[data-verdict]'))
  })

  test('restores a reading after a reload while choosing', { timeout: 30_000 }, async (t) => {
    const { page } = await setup(t)
    const question = 'reload while choosing'
    await saveAfter(page, { placed: 0, revealed: 0 }, () => start(page, question))
    await onlySealedReading(page, question)
    await page.getByRole('button', { name: 'Choose hidden card 3' }).click()
    await saveAfter(page, { placed: 1, revealed: 0 }, () =>
      page.getByRole('button', { name: `Place card in ${positions[1].label}` }).click(),
    )
    const saved = await storedSnapshot(page)
    expect(saved.placements).toEqual({ [positions[1].id]: { choice: 2, revealed: false } })

    // Hold the browser modules back, so the page shows only what the server rendered.
    await expectRestoredHtml(page, question)
    await watchIdleGate(page)
    let releaseModules!: () => void
    const modulesReleased = new Promise<void>((resolve) => {
      releaseModules = resolve
    })
    await page.route('**/assets/**', async (route) => {
      await modulesReleased
      await route.continue()
    })
    await page.reload({ waitUntil: 'commit' })
    await page.locator('input[readonly]').waitFor()
    expect(await page.getByRole('textbox', { name: 'YOUR QUESTION' }).inputValue()).toBe(question)
    expect(await page.locator('[data-choice][data-picked]').count()).toBe(1)
    expect(await page.locator('button[type="submit"]').isDisabled()).toBe(true)
    expect(await page.locator('[data-choice]:not(:disabled)').count()).toBe(0)
    expect(await liveStatus(page)).toBe('Preparing the deck…')
    releaseModules()
    await page.waitForFunction(
      () => document.querySelector('[aria-live="polite"]')?.textContent === 'Reading restored.',
    )
    await page.unroute('**/assets/**')
    expect(
      await page.evaluate(
        () => (window as typeof window & { __sawIdleGate?: boolean }).__sawIdleGate,
      ),
    ).toBe(false)

    const input = page.getByRole('textbox', { name: 'YOUR QUESTION' })
    expect(await input.inputValue()).toBe(question)
    expect(await input.getAttribute('readonly')).not.toBe(null)
    expect(
      await page
        .locator('[data-choice][data-picked]')
        .evaluateAll((choices) => choices.map((choice) => choice.getAttribute('data-choice'))),
    ).toEqual(['2'])
    expect(await page.locator('[data-choice]:not(:disabled)').count()).toBe(8)
    expect(await page.locator(`[data-position="${positions[1].id}"] [data-reveal]`).count()).toBe(1)
    await activeMatches(page, '[data-choice="0"]')

    await page.getByRole('button', { name: 'Choose hidden card 1' }).click()
    await page.getByRole('button', { name: `Place card in ${positions[0].label}` }).click()
    await page.getByRole('button', { name: 'Choose hidden card 2' }).click()
    await page.getByRole('button', { name: `Place card in ${positions[2].label}` }).click()
    await page.getByRole('button', { name: 'Reveal all' }).click()
    await page.locator('[data-verdict]').waitFor()
    expect(
      await page
        .locator('[aria-label="Your spread"] [data-card-details]')
        .evaluateAll((details) => details.map((detail) => detail.getAttribute('data-card-id'))),
    ).toEqual([saved.choices[0], saved.choices[2], saved.choices[1]])
    await verdictFor(page, question)
  })

  test('restores revealed cards settled after a reload during reveals', async (t) => {
    const { page } = await setup(t)
    await page.addInitScript(() => {
      const animate = Element.prototype.animate
      const animations: Animation[] = []
      Object.defineProperty(window, '__revealAnimations', { value: animations })
      Element.prototype.animate = function (...args) {
        const animation = animate.apply(this, args)
        animations.push(animation)
        return animation
      }
    })
    const animationCount = () =>
      page.evaluate(
        () =>
          (window as typeof window & { __revealAnimations: Animation[] }).__revealAnimations.length,
      )
    await start(page, 'reload during reveals')
    for (let index = 0; index < 3; index++) {
      await page.getByRole('button', { name: `Choose hidden card ${index + 1}` }).click()
      await page.getByRole('button', { name: `Place card in ${positions[index].label}` }).click()
    }
    await saveAfter(page, { placed: 3, revealed: 1 }, () =>
      page.getByRole('button', { name: `Reveal ${positions[1].label} card` }).click(),
    )
    const saved = await storedSnapshot(page)
    const revealedId = saved.choices[1]

    await reloadRestored(page, 'reload during reveals')
    expect(
      await page
        .locator('[data-card-details]')
        .evaluateAll((details) => details.map((detail) => detail.getAttribute('data-card-id'))),
    ).toEqual([revealedId])
    expect(await page.locator('[data-reveal]:not(:disabled)').count()).toBe(2)
    expect(await page.locator('[data-verdict]').count()).toBe(0)
    expect(await effectCount(page, '[data-front-frame]')).toBe(0)
    expect(await animationCount()).toBe(0)
    await activeMatches(page, `[data-position="${positions[0].id}"] [data-reveal]`)
    const body = (await page.locator('body').textContent()) ?? ''
    for (const hiddenId of [saved.choices[0], saved.choices[2]]) {
      const hidden = developerDeck.cards.find((card) => card.id === hiddenId)
      expect(body).not.toContain(hidden?.name)
    }

    await page.getByRole('button', { name: `Reveal ${positions[0].label} card` }).click()
    expect(await animationCount()).toBe(1)
    expect(
      await effectCount(page, `[data-position="${positions[0].id}"] [data-front-frame]`),
    ).toBeGreaterThan(0)
    expect(await page.locator('[data-verdict]').count()).toBe(0)
  })

  test(
    'restores a completed reading without replaying effects, and Ask again clears it',
    { timeout: 30_000 },
    async (t) => {
      const { page } = await setup(t)
      const question = 'reload after completion'
      await saveAfter(page, { placed: 3, revealed: 3 }, () => complete(page, question))
      await onlySealedReading(page, question)
      const verdict = await page.locator('[data-result-verdict]').textContent()
      const faces = () =>
        page
          .locator('[aria-label="Your spread"] [data-card-details]')
          .evaluateAll((details) => details.map((detail) => detail.getAttribute('data-card-id')))
      const before = await faces()

      await reloadRestored(page, question)
      expect(await page.getByRole('textbox', { name: 'YOUR QUESTION' }).inputValue()).toBe(question)
      expect(await faces()).toEqual(before)
      expect(await page.locator('[data-result-verdict]').textContent()).toBe(verdict)
      await verdictFor(page, question)
      expect(await page.getByRole('button', { name: 'Share', exact: true }).count()).toBe(1)
      expect(await page.getByRole('button', { name: 'Ask again' }).count()).toBe(1)
      expect(await page.locator('[aria-label="Reading result"] [data-restored]').count()).toBe(1)
      expect(await effectCount(page, '[data-front-frame], [aria-label="Reading result"]')).toBe(0)
      await activeMatches(page, '[data-verdict]')

      await page.getByRole('button', { name: 'Ask again' }).click()
      await activeMatches(page, 'input')
      await waitForCookie(page, async (cookie) => (await stateOf(cookie?.value))?.r === null)
      expect(await onlyTombstone(page)).toBe(true)
      await page.reload()
      await waitIdle(page)
      // The watcher from the restore above does see the idle gate once nothing is saved.
      expect(
        await page.evaluate(
          () => (window as typeof window & { __sawIdleGate?: boolean }).__sawIdleGate,
        ),
      ).toBe(true)
      expect(await page.getByRole('textbox', { name: 'YOUR QUESTION' }).inputValue()).toBe('')
      expect(await page.locator('[data-verdict]').count()).toBe(0)
      expect(await onlyTombstone(page)).toBe(true)
    },
  )

  test('restores the reading after leaving and returning with back and forward', async (t) => {
    const { page } = await setup(t)
    const question = 'back and forward return'
    await start(page, question)
    await page.getByRole('button', { name: 'Choose hidden card 5' }).click()
    await saveAfter(page, { placed: 1, revealed: 0 }, () =>
      page.getByRole('button', { name: `Place card in ${positions[0].label}` }).click(),
    )
    const restoredBoard = async () => {
      await page.waitForFunction(
        (value) => document.querySelector<HTMLInputElement>('input[readonly]')?.value === value,
        question,
      )
      expect(
        await page
          .locator('[data-choice][data-picked]')
          .evaluateAll((choices) => choices.map((choice) => choice.getAttribute('data-choice'))),
      ).toEqual(['4'])
      expect(await page.locator('[data-reveal]').count()).toBe(1)
    }
    await page.goto('/does-not-exist')
    await page.goBack()
    await restoredBoard()
    await page.goForward()
    await page.goBack()
    await restoredBoard()
  })

  test('starts fresh and clears the cookie when it is tampered with or removed', async (t) => {
    const { page } = await setup(t)
    for (const change of ['tamper', 'remove'] as const) {
      await saveAfter(page, { placed: 0, revealed: 0 }, () => start(page, `${change} saved token`))
      const cookie = await readingCookie(page)
      if (!cookie) throw new Error('Expected a reading cookie')
      const context = page.context()
      if (change === 'remove') await context.clearCookies()
      else {
        const edited = cookie.value[20] === 'A' ? 'B' : 'A'
        const value = `${cookie.value.slice(0, 20)}${edited}${cookie.value.slice(21)}`
        await context.addCookies([{ ...cookie, value }])
      }
      await page.reload()
      await waitIdle(page)
      await waitForCookie(page, (current) => current === undefined)
      expect(await page.getByRole('textbox', { name: 'YOUR QUESTION' }).inputValue()).toBe('')
      expect(await page.locator('input[readonly]').count()).toBe(0)
      expect(await liveStatus(page)).toBe('The deck is ready.')
      expect(await noBrowserWrites(page)).toBe(true)
    }
  })

  test('another tab shares the saved reading while the first tab keeps it', async (t) => {
    const { page, errors, unexpectedRequests } = await setup(t)
    // The default test page owns its context, so both tabs share a context opened here.
    const first = await openPage(page, errors, unexpectedRequests)
    t.after(() => first.context.close())
    const question = 'first tab reading'
    await saveAfter(first.page, { placed: 0, revealed: 0 }, () => start(first.page, question))
    const other = await first.context.newPage()
    monitor(other, errors, unexpectedRequests)
    await expectRestoredHtml(first.page, question)
    await watchIdleGate(other)
    await other.goto(first.page.url())
    await other.waitForFunction(
      () => document.querySelector('[aria-live="polite"]')?.textContent === 'Reading restored.',
    )
    expect(
      await other.evaluate(
        () => (window as typeof window & { __sawIdleGate?: boolean }).__sawIdleGate,
      ),
    ).toBe(false)
    expect(await other.getByRole('textbox', { name: 'YOUR QUESTION' }).inputValue()).toBe(question)
    await onlySealedReading(other, question)
    expect(await first.page.getByRole('textbox', { name: 'YOUR QUESTION' }).inputValue()).toBe(
      question,
    )
    await onlySealedReading(first.page, question)
  })

  test('saves nothing for an unstarted question or an unplaced selection', async (t) => {
    const { page } = await setup(t)
    await page.getByRole('textbox', { name: 'YOUR QUESTION' }).fill('private-question never asked')
    await page.reload()
    await waitIdle(page)
    expect(await page.getByRole('textbox', { name: 'YOUR QUESTION' }).inputValue()).toBe('')
    expect(await noBrowserWrites(page)).toBe(true)

    const token = await saveAfter(page, { placed: 0, revealed: 0 }, () =>
      start(page, 'pending selection only'),
    )
    const seals: string[] = []
    page.on('request', (request) => {
      if (new URL(request.url()).pathname === SEAL_PATH) seals.push(request.url())
    })
    await page.getByRole('button', { name: 'Choose hidden card 4' }).click()
    await page.waitForTimeout(100)
    expect(seals).toEqual([])
    expect((await readingCookie(page))?.value).toBe(token)
    await reloadRestored(page, 'pending selection only')
    expect(await page.locator('[data-choice][aria-pressed="true"]').count()).toBe(0)
    expect(await page.locator('[data-choice]:not(:disabled)').count()).toBe(9)
  })

  test('requires consent before creating a link and copies only after confirmation', async (t) => {
    const { page } = await setup(t)
    expect(await page.getByRole('button', { name: 'Share', exact: true }).count()).toBe(0)
    await page.evaluate(() => {
      const writes: string[] = []
      Object.defineProperty(window, '__clipboardWrites', { value: writes })
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: async (value: string) => writes.push(value) },
      })
    })
    await complete(page, 'share consent question')
    const share = page.getByRole('button', { name: 'Share', exact: true })
    await share.click()
    const dialog = page.getByRole('dialog')
    await dialog
      .getByText(
        'Your question will be included in the shared link. Anyone with the link can read it.',
      )
      .waitFor()
    const warningId = await dialog.getAttribute('aria-describedby')
    expect(warningId).not.toBeNull()
    expect(await page.locator(`#${warningId}`).textContent()).toBe(
      'Your question will be included in the shared link. Anyone with the link can read it.',
    )
    expect(await page.getByLabel('Share link').count()).toBe(0)
    expect(
      await page.evaluate(
        () => (window as Window & { __clipboardWrites?: string[] }).__clipboardWrites,
      ),
    ).toEqual([])
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    expect(await share.evaluate((element) => document.activeElement === element)).toBe(true)

    await share.click()
    await page.keyboard.press('Escape')
    await dialog.waitFor({ state: 'hidden' })
    expect(
      await page.evaluate(
        () => (window as Window & { __clipboardWrites?: string[] }).__clipboardWrites,
      ),
    ).toEqual([])
    expect(await share.evaluate((element) => document.activeElement === element)).toBe(true)

    await share.click()
    await dialog.getByRole('button', { name: 'Share anyway' }).click()
    const field = page.getByLabel('Share link')
    await field.waitFor()
    await page.waitForFunction(
      () => document.querySelector('[role="status"]')?.textContent === 'Link copied.',
    )
    const copied = await page.evaluate(
      () => (window as Window & { __clipboardWrites?: string[] }).__clipboardWrites ?? [],
    )
    expect(copied).toEqual([await field.inputValue()])
    expect(new URL(copied[0]).origin).toBe(new URL(page.url()).origin)
    expect(new URL(copied[0]).pathname).toMatch(/^\/r\//)
  })

  test('shows a selectable URL when clipboard access rejects or is absent', async (t) => {
    for (const clipboard of ['rejected', 'absent'] as const) {
      const { page, errors, unexpectedRequests } = await setup(t)
      await page.evaluate((mode) => {
        if (mode === 'absent') {
          Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
        } else {
          Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText: () => Promise.reject(new Error('denied')) },
          })
        }
      }, clipboard)
      await complete(page, `share clipboard ${clipboard}`)
      await page.getByRole('button', { name: 'Share', exact: true }).click()
      await page.getByRole('button', { name: 'Share anyway' }).click()
      const field = page.getByLabel('Share link')
      await field.waitFor()
      await page.waitForFunction(
        () =>
          document.querySelector('[role="status"]')?.textContent ===
          'Could not copy. Select and copy the link below.',
      )
      expect(await field.isEditable()).toBe(false)
      expect(await field.inputValue()).toContain('/r/')
      expect(errors).toEqual([])
      expect(unexpectedRequests).toEqual([])
    }
  })

  test('serves shared results without JavaScript and recovers from invalid links', async (t) => {
    const { page, errors, unexpectedRequests } = await setup(t)
    await complete(page, 'shared server rendered question')
    await page.getByRole('button', { name: 'Share', exact: true }).click()
    await page.getByRole('button', { name: 'Share anyway' }).click()
    const sharedUrl = await page.getByLabel('Share link').inputValue()
    const noJs = await openPage(
      page,
      errors,
      unexpectedRequests,
      { javaScriptEnabled: false, viewport: { width: 320, height: 900 } },
      false,
    )
    t.after(() => noJs.context.close())
    await noJs.page.route('**/cards/developer/fronts/*.webp', (route) => route.abort())
    const response = await noJs.page.goto(sharedUrl)
    expect(response?.status()).toBe(200)
    await noJs.page.getByText('shared server rendered question').waitFor()
    expect(await noJs.page.locator('[data-position]').count()).toBe(3)
    expect(
      await noJs.page
        .locator('[aria-label="Your spread"] [data-card-details]')
        .evaluateAll((details) =>
          details.map((detail) => detail.getAttribute('data-card-position')),
        ),
    ).toEqual(positions.map((position) => position.id))
    expect(
      await noJs.page
        .locator('[aria-label="Your spread"] [data-card-details]')
        .evaluateAll((details) =>
          details.every((detail) => detail.querySelector('h1, h2, h3, h4, h5, h6')),
        ),
    ).toBe(true)
    expect(await noJs.page.locator('[data-front-art]').count()).toBe(3)
    expect(await noJs.page.getByRole('link', { name: 'Start a new reading' }).count()).toBe(1)
    expect(await noJs.page.getByRole('button', { name: 'Share' }).count()).toBe(0)
    expect(await noJs.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    )
    const invalid = await noJs.page.request.get(new URL('/r/not-valid', sharedUrl).toString())
    expect(invalid.status()).toBe(400)
    const invalidBody = await invalid.text()
    expect(invalidBody).toContain('The cards cannot read this timeline.')
    expect(invalidBody).toContain('href="/"')
    expect(invalidBody).not.toContain('not-valid')
    expect(errors).toEqual([])
    expect(unexpectedRequests).toEqual([])
  })

  test('restart discards a pending clipboard result and requires fresh confirmation', async (t) => {
    const { page } = await setup(t)
    await page.evaluate(() => {
      let resolveCopy!: () => void
      const pending = new Promise<void>((resolve) => (resolveCopy = resolve))
      Object.defineProperty(window, '__resolveCopy', { value: resolveCopy })
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: () => pending },
      })
    })
    await complete(page, 'pending shared question')
    await page.getByRole('button', { name: 'Share', exact: true }).click()
    await page.getByRole('button', { name: 'Share anyway' }).click()
    await page.getByLabel('Share link').waitFor()
    await page.getByRole('button', { name: 'Ask again' }).click()
    expect(await page.getByLabel('Share link').count()).toBe(0)
    await page.evaluate(() => (window as Window & { __resolveCopy?: () => void }).__resolveCopy?.())
    await page.waitForTimeout(20)
    expect(await page.getByLabel('Share link').count()).toBe(0)
    await complete(page, 'new private reading')
    expect(await page.getByLabel('Share link').count()).toBe(0)
    expect(await page.getByRole('button', { name: 'Share', exact: true }).count()).toBe(1)
  })

  for (const width of [1440, 390, 320]) {
    test(
      `supports keyboard flow at ${width} px with reduced motion`,
      { timeout: 30_000 },
      async (t) => {
        const { page } = await setup(t)
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await page.setViewportSize({ width, height: 900 })
        await complete(page, `acceptance-question-keyboard-${width}`, 'keyboard')
        await verdictFor(page, `acceptance-question-keyboard-${width}`)
        const readableBlocks = await page.locator('[data-card-details]').evaluateAll((details) =>
          details.map((detail) => {
            const style = getComputedStyle(detail.querySelector('p') ?? detail)
            const width = detail.getBoundingClientRect().width
            const availableWidth = detail.parentElement?.getBoundingClientRect().width ?? 0
            return {
              fontSize: Number.parseFloat(style.fontSize),
              lineHeight: Number.parseFloat(style.lineHeight) / Number.parseFloat(style.fontSize),
              widthRatio: width / availableWidth,
            }
          }),
        )
        expect(readableBlocks).toHaveLength(3)
        if (width < 768) {
          expect(
            readableBlocks.every(
              ({ fontSize, lineHeight, widthRatio }) =>
                fontSize >= 16 && lineHeight >= 1.45 && widthRatio >= 0.8,
            ),
          ).toBe(true)
        }
        expect(
          await page
            .locator('[data-front-frame]')
            .evaluateAll((frames) =>
              frames.every((frame) => frame.getAnimations({ subtree: true }).length === 0),
            ),
        ).toBe(true)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        )
      },
    )
  }

  test('supports touch and no-JavaScript entry', { timeout: 30_000 }, async (t) => {
    const { page, errors, unexpectedRequests } = await setup(t)
    const touch = await openPage(page, errors, unexpectedRequests, {
      viewport: { width: 390, height: 844 },
      hasTouch: true,
    })
    t.after(() => touch.context.close())
    await complete(touch.page, 'acceptance-question-tap', 'tap')
    await verdictFor(touch.page, 'acceptance-question-tap')
    await onlySealedReading(touch.page, 'acceptance-question-tap')
    const noJs = await openPage(
      page,
      errors,
      unexpectedRequests,
      { javaScriptEnabled: false },
      false,
    )
    t.after(() => noJs.context.close())
    expect((await noJs.page.request.get(noJs.page.url())).status()).toBe(200)
    expect(await noJs.page.locator('body').textContent()).toContain(
      'This reading experience requires JavaScript.',
    )
    expect(await noJs.page.getByRole('button', { name: 'Surprise me' }).isDisabled()).toBe(true)
    expect(await noBrowserWrites(noJs.page)).toBe(true)
  })

  test(
    'uses shared card-back artwork and completes when the image request fails',
    { timeout: 30_000 },
    async (t) => {
      const { page } = await setup(t)
      await page.addInitScript(() => {
        Object.defineProperty(Element.prototype, 'animate', { value: undefined })
      })
      // This journey checks artwork, not restore: seals set no cookie, so each reload is fresh.
      await page.route('**/reading-state/seal', (route) =>
        route.fulfill({ json: { ok: true }, headers: { 'Cache-Control': 'no-store' } }),
      )
      const choices = page.getByRole('button', { name: /^Choose hidden card \d+$/ })
      await start(page, 'card back fallback')
      for (let index = 0; index < 3; index++) {
        await choices.nth(index).click()
        await page.getByRole('button', { name: `Place card in ${positions[index].label}` }).click()
      }
      const backgrounds = await page
        .locator('[data-reveal]')
        .evaluateAll((elements) =>
          elements.map((element) => getComputedStyle(element).backgroundImage),
        )
      expect(
        backgrounds.every(
          (background) =>
            background === backgrounds[0] && background.includes('/cards/card-back.webp'),
        ),
      ).toBe(true)
      expect(
        (await page.request.get(new URL('/cards/card-back.webp', page.url()).toString())).status(),
      ).toBe(200)
      await page.reload()
      await waitIdle(page)
      await page.route('**/cards/card-back.webp', (route) => route.abort())
      let finishFrontRequests!: () => void
      const frontRequestsReleased = new Promise<void>((resolve) => {
        finishFrontRequests = resolve
      })
      let pendingFrontRequests = 0
      await page.route('**/cards/developer/fronts/*.webp', async (route) => {
        pendingFrontRequests++
        await frontRequestsReleased
        await route.abort()
      })
      await page.reload()
      await waitIdle(page)
      const fallbackColor = await page
        .getByRole('button', { name: /^Choose hidden card 1$/ })
        .evaluate((element) => getComputedStyle(element).backgroundColor)
      expect(fallbackColor).not.toBe('rgba(0, 0, 0, 0)')
      expect(fallbackColor).not.toBe('transparent')
      await complete(page, 'acceptance-question-fallback')
      await verdictFor(page, 'acceptance-question-fallback')
      expect(pendingFrontRequests).toBe(3)
      const frameBounds = await page.locator('[data-front-frame]').evaluateAll((frames) =>
        frames.map((frame) => {
          const bounds = frame.getBoundingClientRect()
          return { width: bounds.width, height: bounds.height }
        }),
      )
      expect(frameBounds).toHaveLength(3)
      expect(frameBounds.every(({ width, height }) => width > 0 && height > 0)).toBe(true)
      expect(
        frameBounds.every(({ width, height }) => Math.abs(height / width - 116 / 82) < 0.15),
      ).toBe(true)
      finishFrontRequests()
      await page.waitForFunction(() =>
        [...document.querySelectorAll('img[data-front-art]')].every(
          (image) => (image as HTMLImageElement).complete,
        ),
      )
      expect(
        await page
          .locator('[aria-label="Your spread"] img[data-front-art]')
          .evaluateAll((images) =>
            images.every((image) => (image as HTMLImageElement).naturalWidth === 0),
          ),
      ).toBe(true)
      expect(
        await page
          .locator('img[data-front-art]')
          .evaluateAll((images) =>
            images.every((image) => getComputedStyle(image).display === 'none'),
          ),
      ).toBe(true)
      expect(
        await page
          .locator('[aria-label="Your spread"] [data-card-details] :is(h1, h2, h3, h4, h5, h6)')
          .allTextContents(),
      ).toHaveLength(3)
      await page.getByRole('button', { name: 'Ask again' }).click()
      await page.waitForFunction(() => document.activeElement?.matches('input'))
      expect(await page.locator('[data-verdict]').count()).toBe(0)
      expect(await page.locator('img[data-front-art]').count()).toBe(0)
    },
  )
})
