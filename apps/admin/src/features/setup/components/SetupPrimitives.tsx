import { ChevronLeft } from 'lucide-react'

import { TextInput } from '~/ui/text-field'

import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from '../constants'

export function UrlInput(props: {
  label: string
  onChange: (value: string) => void
  placeholder?: string
  value: string
}) {
  return (
    <TextInput
      autoComplete="url"
      controlClassName={inputClassName}
      label={props.label}
      labelClassName={labelClassName}
      onChange={props.onChange}
      placeholder={props.placeholder}
      type="url"
      value={props.value}
    />
  )
}

export function StepActions(props: {
  canSubmit: boolean
  onPrev: () => void
  submitting: boolean
}) {
  return (
    <div className="mt-6 flex justify-between">
      <button
        className={secondaryButtonClassName}
        onClick={props.onPrev}
        type="button"
      >
        <ChevronLeft aria-hidden="true" className="mr-1 size-4" />
        返回
      </button>
      <button
        className={primaryButtonClassName}
        disabled={!props.canSubmit || props.submitting}
        type="submit"
      >
        下一步
      </button>
    </div>
  )
}
