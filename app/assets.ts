import { createAssetServer } from 'remix/assets'

const rootDir = process.cwd()
const nodeEnv = process.env.NODE_ENV ?? 'development'
const isDevelopment = nodeEnv === 'development'

export const assets = createAssetServer({
  basePath: '/assets',
  rootDir,

  allowFiles: ['app/routes.ts', 'app/**/public/**', 'app/domain/tarot/**'],
  allowPackages: ['remix'],
  denyFiles: ['app/**/*.test.*'],
  sourceMaps: isDevelopment ? 'external' : undefined,
  minify: !isDevelopment,
  watch: isDevelopment,
})

const entry = 'app/actions/public/entry.ts'

export const scriptEntry = await assets.getScriptEntry(entry)
