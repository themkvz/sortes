import type { Handle, RemixNode } from 'remix/component'
import { css } from 'remix/component'
import { ImportMap } from 'remix/component/server'

import { scriptEntry } from '../assets.ts'

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
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,500&family=Funnel+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          />
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
            '--font-display': "'Newsreader', serif",
            '--font-body': "'Funnel Sans', system-ui, sans-serif",
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
