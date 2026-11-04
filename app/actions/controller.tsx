import { createController } from 'remix/router'

import { assets } from '../assets.ts'
import { decodeSharedReading } from '../domain/tarot/share.ts'
import { clearReadingState, savedReading, sealReadingState } from '../reading-state/actions.ts'
import { routes } from '../routes.ts'
import { HomePage } from './home-page.tsx'
import { InvalidSharedReadingPage, SharedReadingPage } from './shared-reading-page.tsx'

const sharedReadingHeaders = {
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
}

export default createController(routes, {
  actions: {
    async assets(context) {
      return (await assets.fetch(context.request)) ?? new Response('Not Found', { status: 404 })
    },
    async home(context) {
      const { snapshot, headers } = await savedReading(context.request)
      return context.render(<HomePage restored={snapshot} />, { headers })
    },
    readingClear(context) {
      return clearReadingState(context.request)
    },
    readingSeal(context) {
      return sealReadingState(context.request)
    },
    sharedReading(context) {
      const result = decodeSharedReading(context.params.payload)
      return result.success
        ? context.render(<SharedReadingPage reading={result.value} />, {
            headers: sharedReadingHeaders,
          })
        : context.render(<InvalidSharedReadingPage />, {
            status: 400,
            headers: sharedReadingHeaders,
          })
    },
  },
})
