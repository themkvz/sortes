import type { Handle, RemixNode } from 'remix/component'
import { css } from 'remix/component'
import { ImportMap } from 'remix/component/server'

import { displayFontPreload, fontStylesheets, scriptEntry } from '../assets.ts'

export interface DocumentProps {
  children?: RemixNode
  title?: string
}

export function Document(handle: Handle<DocumentProps>) {
  return () => {
    const { children, title = 'Pseudo Tarot' } = handle.props
    const { href, importMap, preloads } = scriptEntry

    return (
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="color-scheme" content="dark" />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <title>{title}</title>
          <link
            rel="preload"
            href={displayFontPreload}
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
          {fontStylesheets.map((stylesheetHref) => (
            <link key={stylesheetHref} rel="stylesheet" href={stylesheetHref} />
          ))}
          <ImportMap value={importMap} />
          {preloads.map((preloadHref) => (
            <link key={preloadHref} rel="modulepreload" href={preloadHref} />
          ))}
          <script type="module" src={href}></script>
        </head>
        <body
          mix={css({
            '--color-table': '#0A0D0C',
            '--color-surface': '#141815',
            '--color-border': '#333B35',
            '--color-control-border': '#626861',
            '--color-text': '#F3EDDF',
            '--color-text-muted': '#AAA69B',
            '--color-amber': '#F1A64B',
            '--color-teal': '#68B5A2',
            '--color-focus': '#87D7C3',
            '--color-card-face': '#EEE2C7',
            '--color-card-ink': '#272922',
            '--color-card-back': '#17352E',
            '--color-selected-surface': '#1D3831',
            '--font-display': "'Newsreader Variable', serif",
            '--font-body': "'Funnel Sans Variable', system-ui, sans-serif",
            '--font-mono': "'IBM Plex Mono', monospace",
            '--radius-control': '6px',
            '--radius-card': '12px',
            '--radius-panel': '16px',
            margin: 0,
            background:
              'radial-gradient(115% 105% at 50% 42%, #18231D 0%, #0A0D0C 100%), var(--color-table)',
            color: 'var(--color-text)',
            fontFamily: 'var(--font-body)',
            '@media (prefers-reduced-motion: reduce)': {
              '& *': {
                animationDuration: '0.001ms',
                transitionDuration: '0.001ms',
              },
            },
          })}
        >
          {children}
        </body>
      </html>
    )
  }
}
