import * as http from 'node:http'
import { createRequestListener } from 'remix/node-fetch-server'
import { loadServerEnv } from './app/env.ts'
import { router } from './app/router.tsx'

let env: ReturnType<typeof loadServerEnv>
try {
  env = loadServerEnv()
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}

const server = http.createServer(
  createRequestListener(async (request) => {
    try {
      return await router.fetch(request)
    } catch (error) {
      if (!(request.signal.aborted && error === request.signal.reason)) {
        console.error(error)
      }
      return new Response('Internal Server Error', { status: 500 })
    }
  }),
)

server.listen(env.port, env.host, () => {
  console.log(`Server listening on http://${env.host}:${env.port}`)
})

let shuttingDown = false

function shutdown() {
  if (shuttingDown) {
    return
  }

  shuttingDown = true
  server.close(() => process.exit(0))
  server.closeAllConnections()
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
