import { render } from 'remix/middleware/render'
import { staticFiles } from 'remix/middleware/static'
import { createRouter, type Middleware, type MiddlewareContext } from 'remix/router'

import controller from './actions/controller.tsx'
import { NotFoundPage } from './actions/error-pages.tsx'
import { assets } from './assets.ts'
import { routes } from './routes.ts'

const renderMiddleware = render({ assets })
type AppContext = MiddlewareContext<[typeof renderMiddleware]>

declare module 'remix/router' {
  interface RouterTypes {
    context: AppContext
  }
}

function errorBoundary(): Middleware {
  return async (_context, next) => {
    try {
      return await next()
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error(error)
      }
      return new Response('Internal Server Error', { status: 500 })
    }
  }
}

export function createAppRouter() {
  const appRouter = createRouter<AppContext>({
    middleware: [errorBoundary(), staticFiles('./public', { index: false }), renderMiddleware],
    defaultHandler: (context) => context.render(<NotFoundPage />, { status: 404 }),
  })

  appRouter.map(routes, controller)

  return appRouter
}

export const router = createAppRouter()
