import { compression } from 'remix/middleware/compression'
import { logger } from 'remix/middleware/logger'
import { render } from 'remix/middleware/render'
import { staticFiles } from 'remix/middleware/static'
import { createRouter, type RouterContext } from 'remix/router'

import controller from './actions/controller.tsx'
import { NotFoundPage } from './actions/not-found-page.tsx'
import { assets } from './assets.ts'
import { securityHeaders } from './middleware/security-headers.ts'
import { routes } from './routes.ts'

// Shared links carry the question in the URL, so request logs keep only the route shape.
const SHARED_READING_PATH = /\/r\/[^\s?]+/g
const STATIC_FILE_CACHE_CONTROL = 'public, max-age=86400' // 1 day; public/ file names are not hashed

export function createAppRouter() {
  const appRouter = createRouter({
    middleware: [
      logger({
        format: '%method %pathname %status %duration ms',
        colors: false,
        log: (message) => console.log(message.replace(SHARED_READING_PATH, '/r/:payload')),
      }),
      compression(),
      securityHeaders(),
      staticFiles('./public', { index: false, cacheControl: STATIC_FILE_CACHE_CONTROL }),
      render({ assets }),
    ],
    defaultHandler: (context) => context.render(<NotFoundPage />, { status: 404 }),
  })

  appRouter.map(routes, controller)

  return appRouter
}

export const router = createAppRouter()

type AppContext = RouterContext<typeof router>

declare module 'remix' {
  interface RouterTypes {
    context: AppContext
  }
}
