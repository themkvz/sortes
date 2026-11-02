import { render } from 'remix/middleware/render'
import { staticFiles } from 'remix/middleware/static'
import { createRouter, type RouterContext } from 'remix/router'

import controller from './actions/controller.tsx'
import { NotFoundPage } from './actions/error-pages.tsx'
import { assets } from './assets.ts'
import { routes } from './routes.ts'

export function createAppRouter() {
  const appRouter = createRouter({
    middleware: [staticFiles('./public', { index: false }), render({ assets })],
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
