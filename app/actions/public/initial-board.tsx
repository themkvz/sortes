import { clientEntry, css, type Handle, on } from 'remix/ui'

export const QuestionForm = clientEntry(import.meta.url, function QuestionForm(handle: Handle) {
  let question = ''

  return () => {
    const trimmed = question.trim()
    const actionLabel = trimmed === '' ? 'Surprise me' : 'Ask'

    return (
      <div>
        <label htmlFor={handle.id} mix={labelStyle}>
          YOUR QUESTION
        </label>
        <div mix={rowStyle}>
          <input
            id={handle.id}
            type="text"
            value={question}
            placeholder="What should I ask?"
            mix={[
              inputStyle,
              on('input', (event) => {
                question = event.currentTarget.value
                handle.update()
              }),
            ]}
          />
          <button type="button" disabled aria-disabled="true" mix={buttonStyle}>
            {actionLabel}
          </button>
        </div>
        <p mix={hintStyle}>Reading isn't available in this preview yet.</p>
      </div>
    )
  }
})

const labelStyle = css({
  display: 'block',
  fontFamily: 'var(--font-mono)',
  fontSize: '10px',
  letterSpacing: '0.08em',
  color: 'var(--color-text-muted)',
  marginBottom: '8px',
})

const rowStyle = css({
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap',
})

const inputStyle = css({
  flex: '1 1 240px',
  minWidth: 0,
  height: '48px',
  padding: '0 14px',
  fontFamily: 'var(--font-body)',
  fontSize: '14px',
  color: 'var(--color-text)',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-control)',
  '&::placeholder': { color: 'var(--color-text-muted)' },
  '&:focus-visible': { outline: '2px solid var(--color-focus)', outlineOffset: '2px' },
})

const buttonStyle = css({
  appearance: 'none',
  border: 'none',
  flex: '0 0 auto',
  minWidth: '140px',
  height: '48px',
  padding: '0 20px',
  fontFamily: 'var(--font-body)',
  fontSize: '15px',
  fontWeight: 500,
  color: 'var(--color-card-ink)',
  background: 'var(--color-amber)',
  borderRadius: 'var(--radius-control)',
  cursor: 'not-allowed',
  opacity: 0.55,
  '&:focus-visible': { outline: '2px solid var(--color-focus)', outlineOffset: '2px' },
})

const hintStyle = css({
  margin: '10px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: '12px',
  color: 'var(--color-text-muted)',
})
