import type { ConfigFormField } from '~/api/options'

import { Switch } from '~/ui/switch'

import { renderConfigControl } from './renderConfigControl'

export function ConfigFieldEditor(props: {
  field: ConfigFormField
  onAction: (actionId: string) => void
  onChange: (value: unknown) => void
  value: unknown
}) {
  const { field } = props
  const description = field.description ? (
    <p className="mt-1 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
      {field.description}
    </p>
  ) : null

  const label = (
    <span>
      {field.title}
      {field.required ? <span className="ml-0.5 text-red-500">*</span> : null}
    </span>
  )

  if (field.ui.component === 'switch') {
    return (
      <Switch
        checked={Boolean(props.value)}
        description={description}
        label={label}
        onCheckedChange={props.onChange}
      />
    )
  }

  return (
    <label className="grid gap-2 text-sm md:grid-cols-[12rem_minmax(0,1fr)] md:items-start">
      <span className="pt-2 text-neutral-600 dark:text-neutral-300">
        {label}
        {description}
      </span>
      {renderConfigControl(props)}
    </label>
  )
}
