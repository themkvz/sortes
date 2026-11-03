import { createAssetServer } from 'remix/assets'

const rootDir = process.cwd()
const nodeEnv = process.env.NODE_ENV ?? 'development'
const isDevelopment = nodeEnv === 'development'

export const assets = createAssetServer({
  basePath: '/assets',
  rootDir,

  allowFiles: ['app/routes.ts', 'app/**/public/**', 'app/domain/tarot/**'],
  allowPackages: [
    'remix',
    '@fontsource-variable/newsreader',
    '@fontsource-variable/funnel-sans',
    '@fontsource/ibm-plex-mono',
  ],
  // Self-hosted fonts; Plex Mono's CSS also lists a .woff fallback.
  files: { extensions: ['.woff2', '.woff'] },
  denyFiles: ['app/**/*.test.*'],
  sourceMaps: isDevelopment ? 'external' : undefined,
  minify: !isDevelopment,
  watch: isDevelopment,
  // Content-hashed URLs get a one-year immutable cache; needs watch off, so not in development.
  fingerprint: !isDevelopment,
})

const entry = 'app/actions/public/entry.ts'

export const scriptEntry = await assets.getScriptEntry(entry)

const fontStylesheetPaths = [
  'node_modules/@fontsource-variable/newsreader/opsz.css',
  'node_modules/@fontsource-variable/funnel-sans/index.css',
  'node_modules/@fontsource/ibm-plex-mono/latin-400.css',
  'node_modules/@fontsource/ibm-plex-mono/latin-500.css',
  'node_modules/@fontsource/ibm-plex-mono/latin-600.css',
]

export const fontStylesheets = await Promise.all(
  fontStylesheetPaths.map((path) => assets.getHref(path)),
)
// The heading face is the largest text above the fold, so it is fetched early.
export const displayFontPreload = await assets.getHref(
  'node_modules/@fontsource-variable/newsreader/files/newsreader-latin-opsz-normal.woff2',
)
