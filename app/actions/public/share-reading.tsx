import type { Handle } from 'remix/component'
import { on, ref } from 'remix/component'

import type { SharedReading } from '../../domain/tarot/share.ts'
import { encodeSharedReading } from '../../domain/tarot/share.ts'
import { routes } from '../../routes.ts'
import {
  buttonStyle,
  shareDialogActionsStyle,
  shareDialogStyle,
  shareUrlOutputStyle,
  shareUrlStyle,
} from './reading-board.styles.ts'

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
        mix={[buttonStyle, on('click', () => dialog?.showModal())]}
      >
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
          <button type="button" mix={[buttonStyle, on('click', () => dialog?.close())]}>
            Cancel
          </button>
          <button
            id={`${handle.id}-share`}
            type="button"
            mix={[
              buttonStyle,
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
