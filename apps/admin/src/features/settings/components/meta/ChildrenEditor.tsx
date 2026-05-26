import { Plus, Trash2 } from 'lucide-react'
import type { MetaFieldType, MetaPresetChild } from '~/models/meta-preset'

import { Button } from '~/ui/primitives/button'
import { SelectField } from '~/ui/primitives/select'
import { TextInput } from '~/ui/primitives/text-field'

import { fieldTypeOptions } from '../../constants'

export function ChildrenEditor(props: {
  childrenFields: MetaPresetChild[]
  onChange: (children: MetaPresetChild[]) => void
}) {
  const update = (index: number, patch: Partial<MetaPresetChild>) => {
    props.onChange(
      props.childrenFields.map((child, itemIndex) =>
        itemIndex === index ? { ...child, ...patch } : child,
      ),
    )
  }

  return (
    <section className="rounded border border-neutral-200 p-3 dark:border-neutral-800">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium">对象子字段</h3>
        <Button
          onClick={() =>
            props.onChange([
              ...props.childrenFields,
              { key: '', label: '', type: 'text' },
            ])
          }
          type="button"
          variant="subtle"
        >
          <Plus aria-hidden="true" className="size-4" />
          添加子字段
        </Button>
      </div>
      <div className="space-y-2">
        {props.childrenFields.map((child, index) => (
          <div
            className="grid gap-2 md:grid-cols-[1fr_1fr_10rem_auto]"
            key={index}
          >
            <TextInput
              onChange={(key) => update(index, { key })}
              placeholder="key"
              value={child.key}
            />
            <TextInput
              onChange={(label) => update(index, { label })}
              placeholder="显示名称"
              value={child.label}
            />
            <SelectField<MetaFieldType>
              aria-label="字段类型"
              onValueChange={(type) => update(index, { type })}
              options={fieldTypeOptions}
              value={child.type}
            />
            <Button
              onClick={() =>
                props.onChange(
                  props.childrenFields.filter(
                    (_, itemIndex) => itemIndex !== index,
                  ),
                )
              }
              type="button"
              variant="subtle"
            >
              <Trash2 aria-hidden="true" className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </section>
  )
}
