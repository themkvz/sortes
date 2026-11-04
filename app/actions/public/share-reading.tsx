import type { Handle } from 'remix/component'
import { css, on, ref } from 'remix/component'

import type { SharedReading } from '../../domain/tarot/share.ts'
import { encodeSharedReading } from '../../domain/tarot/share.ts'
import { routes } from '../../routes.ts'
import { Icon } from './icons.tsx'
import * as styles from './reading.styles.ts'

const PRIVACY_WARNING =
  'Your question will be included in the shared link. Anyone with the link can read it.'

export function ShareReading(handle: Handle<{ reading: SharedReading }>) {
  let dialog: HTMLDialogElement | undefined
  let url = ''
  let status = ''

  return () => (
    <>
      <button
        id={`${handle.id}-share-trigger`}
        type="button"
        mix={[styles.buttonStyle, styles.iconButtonStyle, on('click', () => dialog?.showModal())]}
      >
        <Icon name="link-2" size={18} />
        Share
      </button>
      <dialog
        aria-labelledby={`${handle.id}-title`}
        aria-describedby={`${handle.id}-warning`}
        mix={[
          shareDialogStyle,
          ref((node) => {
            dialog = node
          }),
          on('close', () => document.getElementById(`${handle.id}-share-trigger`)?.focus()),
        ]}
      >
        <h2 id={`${handle.id}-title`}>Share this reading?</h2>
        <p id={`${handle.id}-warning`}>{PRIVACY_WARNING}</p>
        <div mix={shareDialogActionsStyle}>
          <button
            type="button"
            mix={[
              styles.buttonStyle,
              styles.secondaryButtonStyle,
              on('click', () => dialog?.close()),
            ]}
          >
            Cancel
          </button>
          <button
            id={`${handle.id}-share`}
            type="button"
            mix={[
              styles.buttonStyle,
              on('click', async () => {
                const payload = encodeSharedReading(handle.props.reading)
                url = new URL(routes.sharedReading.href({ payload }), window.location.origin).href
                status = ''
                dialog?.close()
                handle.update()
                try {
                  if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
                  await navigator.clipboard.writeText(url)
                  if (handle.signal.aborted) return
                  status = 'Link copied.'
                } catch {
                  if (handle.signal.aborted) return
                  status = 'Could not copy. Select and copy the link below.'
                }
                handle.update()
              }),
            ]}
          >
            Share anyway
          </button>
        </div>
      </dialog>
      {url && (
        <div mix={shareUrlOutputStyle}>
          <label htmlFor={`${handle.id}-url`}>Share link</label>
          <input id={`${handle.id}-url`} readOnly value={url} mix={shareUrlStyle} />
          <p role="status" aria-live="polite">
            {status}
          </p>
        </div>
      )}
    </>
  )
}

const shareDialogStyle = css({
  boxSizing: 'border-box',
  width: 'min(30rem, calc(100vw - 32px))',
  maxWidth: 'none',
  margin: 'auto',
  border: 'none',
  borderRadius: 'var(--radius-panel)',
  padding: '32px',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-body)',
  // A dialog truly floats, so it is the one surface here that earns a shadow.
  boxShadow: '0 24px 64px #000000b3',
  '@media (max-width: 599px)': { padding: '24px' },
  '& h2': {
    margin: 0,
    fontFamily: 'var(--font-display)',
    fontSize: '28px',
    fontWeight: 400,
    lineHeight: 1.15,
  },
  '& > p': {
    margin: '12px 0 28px',
    fontSize: '16px',
    lineHeight: 1.5,
    color: 'var(--color-text-muted)',
  },
  '&::backdrop': { background: 'rgba(5, 7, 6, 0.8)' },
})
const shareDialogActionsStyle = css({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px',
  '@media (max-width: 599px)': {
    flexDirection: 'column-reverse',
    '& > button': { width: '100%' },
  },
})
const shareUrlStyle = css({
  boxSizing: 'border-box',
  width: '100%',
  minWidth: 0,
  height: '48px',
  marginTop: '8px',
  padding: '10px',
  border: '1px solid var(--color-teal)',
  borderRadius: 'var(--radius-control)',
  background: 'var(--color-table)',
  color: 'var(--color-text)',
  font: 'inherit',
  '&:focus-visible': { outline: '2px solid var(--color-focus)', outlineOffset: '2px' },
})
const shareUrlOutputStyle = css({ flexBasis: '100%', minWidth: 0 })
