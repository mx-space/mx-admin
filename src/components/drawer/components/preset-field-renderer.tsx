/**
 * 预设字段渲染器
 * 根据字段类型动态渲染对应的表单控件
 */
import { PlusIcon, XIcon } from 'lucide-vue-next'
import {
  NButton,
  NDynamicTags,
  NInput,
  NInputNumber,
  NSelect,
  NSwitch,
} from 'naive-ui'
import { computed, defineComponent, ref, toRefs, watch } from 'vue'
import type {
  MetaFieldOption,
  MetaPresetChild,
  MetaPresetField,
} from '~/models/meta-preset'
import type { PropType } from 'vue'

import { FormField, SwitchRow } from './ui'

/**
 * 处理 Select 互斥逻辑
 * - 选择 exclusive 选项时，清除其他所有选项
 * - 选择非 exclusive 选项时，清除所有 exclusive 选项
 */
function handleSelectExclusive(
  newValues: any[],
  oldValues: any[],
  options: MetaFieldOption[],
): any[] {
  if (!options || options.length === 0) return newValues

  const exclusiveValues = new Set(
    options.filter((o) => o.exclusive).map((o) => o.value),
  )

  // 找出新增的值
  const addedValues = newValues.filter((v) => !oldValues.includes(v))

  if (addedValues.length === 0) return newValues

  const addedValue = addedValues[0]

  // 如果新增的是互斥选项，清除其他所有
  if (exclusiveValues.has(addedValue)) {
    return [addedValue]
  }

  // 如果新增的不是互斥选项，清除所有互斥选项
  return newValues.filter((v) => !exclusiveValues.has(v))
}

/**
 * 将 meta 值标准化为数组
 */
function normalizeToArray(value: any): any[] {
  if (value === undefined || value === null) return []
  if (Array.isArray(value)) return value
  return [value]
}

/**
 * 将数组值标准化为存储格式
 * 单个值时返回该值，多个值时返回数组
 */
function normalizeFromArray(arr: any[]): any {
  if (arr.length === 0) return undefined
  if (arr.length === 1) return arr[0]
  return arr
}

/**
 * 子字段渲染器（用于 object 类型）
 */
const ChildFieldRenderer = defineComponent({
  props: {
    child: {
      type: Object as PropType<MetaPresetChild>,
      required: true,
    },
    value: {
      type: null as unknown as PropType<any>,
      required: false,
    },
    onChange: {
      type: Function as PropType<(value: any) => void>,
      required: true,
    },
  },
  setup(props) {
    const { child, value, onChange } = toRefs(props)

    return () => {
      const field = child.value

      switch (field.type) {
        case 'text':
          return (
            <NInput
              value={value.value ?? ''}
              onUpdateValue={onChange.value}
              placeholder={field.placeholder}
              size="small"
            />
          )

        case 'textarea':
          return (
            <NInput
              type="textarea"
              value={value.value ?? ''}
              onUpdateValue={onChange.value}
              placeholder={field.placeholder}
              autosize={{ minRows: 2, maxRows: 5 }}
              size="small"
            />
          )

        case 'select':
          return (
            <NSelect
              value={value.value}
              onUpdateValue={onChange.value}
              options={
                field.options?.map((o) => ({
                  label: o.label,
                  value: o.value,
                })) ?? []
              }
              placeholder={field.placeholder || '请选择'}
              clearable
              size="small"
            />
          )

        default:
          return (
            <NInput
              value={value.value ?? ''}
              onUpdateValue={onChange.value}
              placeholder={field.placeholder}
              size="small"
            />
          )
      }
    }
  },
})

/**
 * 多选字段渲染器（支持互斥逻辑和自定义选项）
 * 使用 Select 多选组件替代 Checkbox
 */
const MultiSelectFieldRenderer = defineComponent({
  props: {
    field: {
      type: Object as PropType<MetaPresetField>,
      required: true,
    },
    value: {
      type: null as unknown as PropType<any>,
      required: false,
    },
    onChange: {
      type: Function as PropType<(value: any) => void>,
      required: true,
    },
  },
  setup(props) {
    const { field, value, onChange } = toRefs(props)

    const currentValues = computed(() => normalizeToArray(value.value))

    const predefinedValues = computed(() => {
      const optionValues = new Set(
        field.value.options?.map((o) => o.value) ?? [],
      )
      return currentValues.value.filter(
        (v) => optionValues.has(v) || typeof v === 'number',
      )
    })

    const customValues = computed(() => {
      const optionValues = new Set(
        field.value.options?.map((o) => o.value) ?? [],
      )
      return currentValues.value.filter(
        (v) => !optionValues.has(v) && typeof v === 'string',
      )
    })

    const customInput = ref('')

    const handlePredefinedChange = (newValues: any[]) => {
      const processed = handleSelectExclusive(
        newValues,
        predefinedValues.value,
        field.value.options ?? [],
      )
      const merged = [...processed, ...customValues.value]
      onChange.value(normalizeFromArray(merged))
    }

    const addCustomValue = () => {
      const trimmed = customInput.value.trim()
      if (!trimmed) return
      if (currentValues.value.includes(trimmed)) {
        customInput.value = ''
        return
      }

      // 添加自定义值时清除互斥选项
      const exclusiveValues = new Set(
        (field.value.options ?? [])
          .filter((o) => o.exclusive)
          .map((o) => o.value),
      )
      const newPredefined = predefinedValues.value.filter(
        (v) => !exclusiveValues.has(v),
      )
      const merged = [...newPredefined, ...customValues.value, trimmed]
      onChange.value(normalizeFromArray(merged))
      customInput.value = ''
    }

    const removeCustomValue = (val: string) => {
      const newCustom = customValues.value.filter((v) => v !== val)
      const merged = [...predefinedValues.value, ...newCustom]
      onChange.value(normalizeFromArray(merged))
    }

    const selectOptions = computed(() => {
      return (
        field.value.options?.map((o) => ({
          label: o.label,
          value: o.value,
        })) ?? []
      )
    })

    return () => (
      <div class="space-y-2">
        <NSelect
          value={predefinedValues.value}
          onUpdateValue={handlePredefinedChange}
          options={selectOptions.value}
          multiple
          clearable
          placeholder="选择选项"
          size="small"
          maxTagCount="responsive"
        />

        {customValues.value.length > 0 && (
          <div class="flex flex-wrap gap-1.5">
            {customValues.value.map((val) => (
              <span
                key={val}
                class="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
              >
                {val}
                <button
                  type="button"
                  class="rounded p-0.5 transition-colors hover:bg-blue-100 dark:hover:bg-blue-800/50"
                  onClick={() => removeCustomValue(val)}
                >
                  <XIcon class="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {field.value.allowCustomOption && (
          <div class="flex gap-2">
            <NInput
              value={customInput.value}
              onUpdateValue={(v) => (customInput.value = v)}
              placeholder="自定义声明..."
              size="small"
              onKeydown={(e: KeyboardEvent) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addCustomValue()
                }
              }}
            />
            <NButton
              size="small"
              onClick={addCustomValue}
              disabled={!customInput.value.trim()}
            >
              <PlusIcon class="size-4" />
            </NButton>
          </div>
        )}
      </div>
    )
  },
})

/**
 * Object 字段渲染器（带开关控制）
 */
const ObjectFieldRenderer = defineComponent({
  props: {
    field: {
      type: Object as PropType<MetaPresetField>,
      required: true,
    },
    value: {
      type: null as unknown as PropType<Record<string, any> | undefined>,
      required: false,
    },
    onChange: {
      type: Function as PropType<
        (value: Record<string, any> | undefined) => void
      >,
      required: true,
    },
  },
  setup(props) {
    const { field, value, onChange } = toRefs(props)

    // 使用独立的启用状态，而不是依赖值的存在
    // 当 value 存在时（包括空对象）认为是启用状态
    const isEnabled = ref(value.value !== undefined)

    watch(
      () => value.value,
      (newVal) => {
        isEnabled.value = newVal !== undefined
      },
    )

    const toggleEnabled = (enabled: boolean) => {
      isEnabled.value = enabled
      if (enabled) {
        onChange.value({})
      } else {
        onChange.value(undefined)
      }
    }

    const updateChildValue = (key: string, childValue: any) => {
      const current = value.value ?? {}
      if (
        childValue === undefined ||
        childValue === null ||
        childValue === ''
      ) {
        const { [key]: _, ...rest } = current
        onChange.value(rest)
      } else {
        onChange.value({ ...current, [key]: childValue })
      }
    }

    return () => (
      <div class="space-y-2">
        <SwitchRow
          label={field.value.label}
          description={field.value.description}
          modelValue={isEnabled.value}
          onUpdate={toggleEnabled}
        />

        {isEnabled.value && field.value.children && (
          <div class="ml-4 space-y-2 border-l-2 border-neutral-200 pl-3 dark:border-neutral-700">
            {field.value.children.map((child) => (
              <div key={child.key} class="space-y-1">
                <label class="text-xs text-neutral-500 dark:text-neutral-400">
                  {child.label}
                </label>
                <ChildFieldRenderer
                  child={child}
                  value={value.value?.[child.key]}
                  onChange={(v) => updateChildValue(child.key, v)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  },
})

/**
 * 主字段渲染器
 */
export const PresetFieldRenderer = defineComponent({
  props: {
    field: {
      type: Object as PropType<MetaPresetField>,
      required: true,
    },
    value: {
      type: null as unknown as PropType<any>,
      required: false,
    },
    onChange: {
      type: Function as PropType<(value: any) => void>,
      required: true,
    },
  },
  setup(props) {
    const { field, value, onChange } = toRefs(props)

    return () => {
      const f = field.value

      // Object 类型特殊处理（自带开关）
      if (f.type === 'object') {
        return (
          <ObjectFieldRenderer
            field={f}
            value={value.value}
            onChange={onChange.value}
          />
        )
      }

      // 其他类型包装在 FormField 中
      return (
        <FormField label={f.label} description={f.description}>
          {renderField()}
        </FormField>
      )

      function renderField() {
        switch (f.type) {
          case 'text':
            return (
              <NInput
                value={value.value ?? ''}
                onUpdateValue={onChange.value}
                placeholder={f.placeholder}
                size="small"
              />
            )

          case 'textarea':
            return (
              <NInput
                type="textarea"
                value={value.value ?? ''}
                onUpdateValue={onChange.value}
                placeholder={f.placeholder}
                autosize={{ minRows: 2, maxRows: 5 }}
                size="small"
              />
            )

          case 'number':
            return (
              <NInputNumber
                value={value.value}
                onUpdateValue={onChange.value}
                placeholder={f.placeholder}
                class="w-full"
                size="small"
              />
            )

          case 'url':
            return (
              <NInput
                value={value.value ?? ''}
                onUpdateValue={onChange.value}
                placeholder={f.placeholder || 'https://...'}
                size="small"
              />
            )

          case 'select':
            return (
              <NSelect
                value={value.value}
                onUpdateValue={onChange.value}
                options={
                  f.options?.map((o) => ({
                    label: o.label,
                    value: o.value,
                  })) ?? []
                }
                placeholder={f.placeholder || '请选择'}
                clearable
                size="small"
              />
            )

          case 'multi-select':
            return (
              <NSelect
                value={value.value ?? []}
                onUpdateValue={onChange.value}
                options={
                  f.options?.map((o) => ({
                    label: o.label,
                    value: o.value,
                  })) ?? []
                }
                placeholder={f.placeholder || '请选择'}
                multiple
                clearable
                size="small"
              />
            )

          case 'checkbox':
            // 使用多选 Select 替代 Checkbox
            return (
              <MultiSelectFieldRenderer
                field={f}
                value={value.value}
                onChange={onChange.value}
              />
            )

          case 'tags':
            return (
              <NDynamicTags
                value={value.value ?? []}
                onUpdateValue={onChange.value}
                size="small"
              />
            )

          case 'boolean':
            return (
              <NSwitch
                value={value.value ?? false}
                onUpdateValue={onChange.value}
                size="small"
              />
            )

          default:
            return (
              <NInput
                value={value.value ?? ''}
                onUpdateValue={onChange.value}
                placeholder={f.placeholder}
                size="small"
              />
            )
        }
      }
    }
  },
})
