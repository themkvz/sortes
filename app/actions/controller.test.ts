import { expect } from 'remix/assert'
import { describe, test } from 'remix/test'
import { createAppRouter } from '../router.tsx'
import { routes } from '../routes.ts'

const GOLDEN_TOKEN =
  'eyJ2IjoxLCJkIjoiZGV2ZWxvcGVyIiwicyI6InRocmVlLWNhcmQiLCJxIjoiU2hvdWxkIEkgcmV3cml0ZSBpdD8iLCJjIjpbImxlZ2FjeS1zeXN0ZW0iLCJpbmZpbml0ZS1yZWZhY3RvciIsIm12cCJdfQ'

test('unknown routes return 404 with a link back home', async () => {
  const router = createAppRouter()
  const response = await router.fetch(new Request('http://localhost/does-not-exist'))

  expect(response.status).toBe(404)
  const html = await response.text()
  expect(html).toMatch(/href="\/"/)
})

test('pages send HSTS and link-preview meta tags', async () => {
  const router = createAppRouter()
  const response = await router.fetch(new Request('http://localhost/'))
  const html = await response.text()

  expect(response.headers.get('Strict-Transport-Security')).toBe('max-age=31536000')
  expect(html).toMatch(/<meta name="description" content="[^"]+"/)
  expect(html).toContain('<meta property="og:title" content="Pseudo Tarot"')
  expect(html).toMatch(/<meta property="og:description" content="[^"]+"/)
  expect(html).toContain('<meta name="twitter:card" content="summary"')
})

describe('shared reading route', () => {
  test('renders a valid ordered reading with privacy headers', async () => {
    const router = createAppRouter()
    const response = await router.fetch(
      new Request(`http://localhost${routes.sharedReading.href({ payload: GOLDEN_TOKEN })}`),
    )
    const html = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(response.headers.get('Referrer-Policy')).toBe('no-referrer')
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    expect(html).toContain('Should I rewrite it?')
    expect(html).toContain('The Legacy System')
    expect(html).toContain('The Infinite Refactor')
    expect(html).toContain('The MVP')
    expect(html).toContain('href="/"')
    expect(html).not.toContain('ReadingBoard')
  })

  test('returns a controlled 400 without reflecting an invalid payload', async () => {
    const router = createAppRouter()
    const token = 'bad-token-value'
    const response = await router.fetch(
      new Request(`http://localhost${routes.sharedReading.href({ payload: token })}`),
    )
    const html = await response.text()

    expect(response.status).toBe(400)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(response.headers.get('Referrer-Policy')).toBe('no-referrer')
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    expect(html).toContain('The cards cannot read this timeline.')
    expect(html).toContain('href="/"')
    expect(html).not.toContain(token)
  })

  test('escapes a question in rendered HTML', async () => {
    const payload = JSON.stringify({
      v: 1,
      d: 'developer',
      s: 'three-card',
      q: '<script>alert(1)</script>',
      c: ['legacy-system', 'infinite-refactor', 'mvp'],
    })
    const bytes = new TextEncoder().encode(payload)
    let binary = ''
    for (const byte of bytes) binary += String.fromCharCode(byte)
    const token = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const router = createAppRouter()
    const response = await router.fetch(
      new Request(`http://localhost${routes.sharedReading.href({ payload: token })}`),
    )
    const html = await response.text()

    expect(response.status).toBe(200)
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).not.toContain('<script>alert(1)</script>')
  })
})
