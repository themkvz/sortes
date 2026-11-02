import * as assert from 'remix/assert'
import { test } from 'remix/test'

const childScript = `
  const { router } = await import('./app/router.tsx')
  let streamController
  router.get('/__shutdown-drain', () => new Response(new ReadableStream({
    start(controller) {
      streamController = controller
      controller.enqueue(new TextEncoder().encode('start'))
    },
  })))
  router.get('/__boom', () => {
    throw new Error('secret stack detail')
  })
  process.on('SIGTERM', () => setTimeout(() => {
    streamController.enqueue(new TextEncoder().encode('end'))
    streamController.close()
  }, 50))
  await import('./server.ts')
`

test(
  'the Bun adapter hides route errors and drains active responses on SIGTERM',
  { timeout: 10000 },
  async (t) => {
    const portProbe = Bun.serve({ port: 0, fetch: () => new Response() })
    const port = portProbe.port
    await portProbe.stop()

    const child = Bun.spawn([process.execPath, '--eval', childScript], {
      cwd: process.cwd(),
      env: { ...process.env, HOST: '127.0.0.1', PORT: String(port), NODE_ENV: 'test' },
      stdout: 'pipe',
      stderr: 'pipe',
    })
    const output = child.stdout.getReader()
    const watchdog = setTimeout(() => child.kill('SIGKILL'), 5000)
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined
    t.after(() => {
      clearTimeout(watchdog)
      if (child.exitCode === null) child.kill('SIGKILL')
    })

    try {
      let started = ''
      while (!started.includes('Server listening')) {
        const chunk = await output.read()
        if (chunk.done) throw new Error(`Server exited before listening: ${started}`)
        started += new TextDecoder().decode(chunk.value)
      }

      const errorResponse = await fetch(`http://127.0.0.1:${port}/__boom`)
      const errorBody = await errorResponse.text()
      assert.equal(errorResponse.status, 500)
      assert.equal(errorBody, 'Internal Server Error')
      assert.doesNotMatch(errorBody, /secret stack detail|\.tsx?:\d+/)

      const response = await fetch(`http://127.0.0.1:${port}/__shutdown-drain`)
      if (!response.body) throw new Error('Expected a streaming response')
      reader = response.body.getReader()
      const first = await reader.read()
      assert.equal(new TextDecoder().decode(first.value), 'start')
      child.kill('SIGTERM')

      const remainder = await reader.read()
      assert.equal(new TextDecoder().decode(remainder.value), 'end')
      assert.equal(await child.exited, 0)
    } finally {
      clearTimeout(watchdog)
      try {
        await reader?.cancel()
      } finally {
        if (child.exitCode === null) child.kill('SIGKILL')
        await child.exited
        await output.cancel()
      }
    }
  },
)
