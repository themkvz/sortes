import { loadServerEnv } from './app/env.ts'
import { router } from './app/router.tsx'

let env: ReturnType<typeof loadServerEnv>
try {
  env = loadServerEnv()
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}

const server = Bun.serve({
  hostname: env.host,
  port: env.port,
  fetch: async (request) => {
    try {
      return await router.fetch(request)
    } catch (error) {
      if (!(request.signal.aborted && error === request.signal.reason)) {
        console.error(error)
      }
      return new Response('Internal Server Error', { status: 500 })
    }
  },
})

console.log(`Server listening on http://${env.host}:${env.port}`)

let shuttingDown = false

async function shutdown() {
  if (shuttingDown) {
    return
  }

  shuttingDown = true
  await server.stop(true)
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
