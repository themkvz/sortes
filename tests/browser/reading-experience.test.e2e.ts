import type { BrowserContextOptions, Page } from 'playwright'
import { expect } from 'remix/assert'
import { createTestServer } from 'remix/node-fetch-server/test'
import { describe, type TestContext, test } from 'remix/test'

import { developerDeck } from '../../app/domain/tarot/decks/developer.ts'
import { type CompletedReading, interpret } from '../../app/domain/tarot/reading.ts'
import { createAppRouter } from '../../app/router.tsx'

const positions = developerDeck.positions
const SENTINELS = /Should I ask|privacy sentinel|acceptance-question|private-question/i

function monitor(target: Page, errors: string[], unexpectedRequests: string[]) {
  target.on('pageerror', (error) => errors.push(error.message))
  target.on('console', (message) => {
    if (message.type() === 'error' && message.text().startsWith('Component error:')) {
      errors.push(message.text())
    }
  })
  target.on('request', (request) => {
    const body = request.postData() ?? ''
    const details = `${request.method()} ${request.url()} ${body}`
    if (request.method() !== 'GET' || SENTINELS.test(decodeURIComponent(details))) {
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

async function noBrowserWrites(target: Page) {
  return target.evaluate(
    () => !localStorage.length && !sessionStorage.length && document.cookie === '',
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

async function verdictFor(target: Page, question: string) {
  const cards = await target.locator('[aria-label="Your spread"] article strong').allTextContents()
  const pairs = positions.map((position, index) => {
    const card = developerDeck.cards.find((candidate) => candidate.name === cards[index])
    if (!card) throw new Error(`No deck card matches rendered face: ${cards[index]}`)
    return { positionId: position.id, cardId: card.id }
  })
  const result = interpret(developerDeck, {
    version: 1,
    deckId: developerDeck.id,
    question,
    spreadId: developerDeck.spreadId,
    pairs,
  } satisfies CompletedReading)
  expect(result.success).toBe(true)
  const verdict = target.locator('[aria-label="Reading result"] p').nth(1)
  expect(await verdict.textContent()).toBe(result.success ? result.value.verdict : '')
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
      const choices = page.getByRole('button', { name: /^Choose hidden card \d+$/ })
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
        } else expect(await choices.count()).toBe(0)
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

  test(
    'rejects invalid drops and Escape cancellation while keeping later click and keyboard actions usable',
    { timeout: 30_000 },
    async (t) => {
      const { page } = await setup(t)
      await page.setViewportSize({ width: 1440, height: 1400 })
      await start(page, 'desktop drag cancellation')
      const choices = page.getByRole('button', { name: /^Choose hidden card \d+$/ })
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
      expect(await page.locator('[data-position] article, [data-reveal]').count()).toBe(0)
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
      const choices = page.getByRole('button', { name: /^Choose hidden card \d+$/ })
      await choices.nth(2).click()
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
        if (step === 0) expect(await choices.nth(5).isDisabled()).toBe(true)
        if (step < 2) {
          await page.waitForFunction(
            (index) => document.activeElement?.getAttribute('data-choice') === String(index),
            (used[step] + 1) % 9,
          )
        }
      }
      expect(await choices.locator(':enabled').count()).toBe(0)
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
      await start(page, 'privacy sentinel question')
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
        const front = page.locator(`[data-front-art][src$="/${card.id}.webp"]`)
        await front.waitFor({ state: 'visible' })
        expect(await front.getAttribute('alt')).toBe('')
        await front.evaluate((image) => (image as HTMLImageElement).decode())
        expect(
          await front.evaluate((image) => (image as HTMLImageElement).naturalWidth),
        ).toBeGreaterThan(0)
        expect(await page.locator('img[data-front-art]').count()).toBe(index + 1)
        expect(after).toContain(card.shortDescription)
        expect(after).toContain(card.meanings[order[index].id].text)
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
        .locator('[aria-label="Your spread"] article')
        .evaluateAll((articles) => articles.map((article) => article.textContent ?? ''))
      expect(faces).toHaveLength(positions.length)
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
      expect(await page.getByRole('button', { name: /Reveal all|Share/i }).count()).toBe(0)
      expect(await noBrowserWrites(page)).toBe(true)
      await page.getByRole('button', { name: 'Ask again' }).focus()
      await page.keyboard.press('Enter')
      await page.waitForFunction(() => document.activeElement?.matches('input'))
      expect(await page.getByRole('textbox', { name: 'YOUR QUESTION' }).inputValue()).toBe('')
      expect(await page.getByRole('button', { name: /^Choose hidden card \d+$/ }).count()).toBe(9)
      expect(await page.locator('[data-verdict]').count()).toBe(0)
    },
  )

  test('reload clears a completed reading', { timeout: 30_000 }, async (t) => {
    const { page } = await setup(t)
    await complete(page, 'reload reset')
    await page.reload()
    await waitIdle(page)
    expect(await page.getByRole('textbox', { name: 'YOUR QUESTION' }).inputValue()).toBe('')
    expect(await page.locator('[data-verdict]').count()).toBe(0)
    expect(await noBrowserWrites(page)).toBe(true)
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
    expect(await noBrowserWrites(touch.page)).toBe(true)
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
        await page.locator('[aria-label="Your spread"] article strong').allTextContents(),
      ).toHaveLength(3)
      await page.getByRole('button', { name: 'Ask again' }).click()
      await page.waitForFunction(() => document.activeElement?.matches('input'))
      expect(await page.locator('[data-verdict]').count()).toBe(0)
      expect(await page.locator('img[data-front-art]').count()).toBe(0)
    },
  )
})
