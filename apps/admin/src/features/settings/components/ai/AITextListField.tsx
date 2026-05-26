import { X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '~/ui/primitives/button'
import { TextInput } from '~/ui/primitives/text-field'

import { FieldShell } from '../SettingsPrimitives'

export function AITextListField(props: {
  disabled?: boolean
  label: string
  onChange: (value: string[]) => void
  value: string[]
}) {
  const [draft, setDraft] = useState('')

  const add = () => {
    const value = draft.trim().toLowerCase()
    if (!value || props.disabled) return
    if (value.length !== 2) {
      toast.warning('请使用 ISO 639-1 语言代码（2 个字母）')
      return
    }
    if (props.value.includes(value)) {
      toast.warning(`语言 ${value} 已存在`)
      return
    }
    props.onChange([...props.value, value])
    setDraft('')
  }

  return (
    <FieldShell label={props.label}>
      <div className="space-y-2">
        <div className="flex gap-2">
          <TextInput
            className="min-w-0 flex-1"
            disabled={props.disabled}
            maxLength={2}
            onChange={setDraft}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                add()
              }
            }}
            placeholder="如 en, ja, ko"
            value={draft}
          />
          <Button
            disabled={props.disabled || !draft.trim()}
            onClick={add}
            type="button"
            variant="subtle"
          >
            添加
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {props.value.map((item) => (
            <button
              className="rounded bg-neutral-100 px-2 py-1 text-xs text-neutral-600 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-neutral-900 dark:text-neutral-300"
              disabled={props.disabled}
              key={item}
              onClick={() =>
                props.onChange(props.value.filter((value) => value !== item))
              }
              type="button"
            >
              {item.toUpperCase()}
              <X aria-hidden="true" className="ml-1 inline size-3" />
            </button>
          ))}
        </div>
      </div>
    </FieldShell>
  )
}
