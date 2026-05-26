import { KeyboardEvent, useEffect, useState } from 'react'

export function InlineTextEdit(props: {
  disabled: boolean
  label: string
  onCommit: (value: string) => void
  placeholder: string
  value: string
}) {
  const [value, setValue] = useState(props.value)

  useEffect(() => {
    setValue(props.value)
  }, [props.value])

  const commit = () => {
    const nextValue = value.trim()
    if (nextValue !== props.value) props.onCommit(nextValue)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur()
      return
    }
    if (event.key === 'Escape') {
      setValue(props.value)
      event.currentTarget.blur()
    }
  }

  return (
    <label className="inline-flex items-center gap-1">
      <span className="text-neutral-400 dark:text-neutral-500">
        {props.label}
      </span>
      <input
        aria-label={props.label}
        className="outline-hidden h-7 w-20 rounded border border-neutral-200 bg-white px-2 text-xs text-neutral-700 transition-colors placeholder:text-neutral-400 focus:border-neutral-400 disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:focus:border-neutral-600"
        disabled={props.disabled}
        onBlur={commit}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={props.placeholder}
        value={value}
      />
    </label>
  )
}
