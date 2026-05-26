import { GripVertical, Lock } from 'lucide-react'
import type { MetaPresetField } from '~/models/meta-preset'

import { Button } from '~/ui/button'
import { Switch } from '~/ui/switch'

import { fieldTypeLabels, scopeLabels } from '../../constants'
import { SmallBadge } from '../SettingsPrimitives'

export function MetaPresetRow(props: {
  onDelete: (id: string) => void
  onEdit: (id: string) => void
  onToggle: (preset: MetaPresetField) => void
  preset: MetaPresetField
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {!props.preset.isBuiltin ? (
        <GripVertical aria-hidden="true" className="size-4 text-neutral-300" />
      ) : (
        <Lock aria-hidden="true" className="size-4 text-neutral-300" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-neutral-950 dark:text-neutral-50">
            {props.preset.label}
          </span>
          <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs text-neutral-500 dark:bg-neutral-900">
            {props.preset.key}
          </code>
          <SmallBadge>{fieldTypeLabels[props.preset.type]}</SmallBadge>
          <SmallBadge>{scopeLabels[props.preset.scope]}</SmallBadge>
          {props.preset.isBuiltin ? <SmallBadge>内置</SmallBadge> : null}
        </div>
        {props.preset.description ? (
          <p className="mt-1 truncate text-sm text-neutral-500">
            {props.preset.description}
          </p>
        ) : null}
      </div>
      <Switch
        checked={props.preset.enabled}
        className="border-0 px-0 py-0"
        label=""
        onCheckedChange={() => props.onToggle(props.preset)}
      />
      {!props.preset.isBuiltin ? (
        <>
          <Button
            onClick={() => props.onEdit(props.preset.id)}
            type="button"
            variant="subtle"
          >
            编辑
          </Button>
          <Button
            onClick={() => props.onDelete(props.preset.id)}
            type="button"
            variant="subtle"
          >
            删除
          </Button>
        </>
      ) : null}
    </div>
  )
}
