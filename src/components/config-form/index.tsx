import { get, set } from 'es-toolkit/compat'
import { marked } from 'marked'
import { NDynamicTags, NInput, NInputNumber, NSelect, NSwitch } from 'naive-ui'
import { defineComponent, ref, watch, watchEffect } from 'vue'
import type { PropType, Ref } from 'vue'
import type { FormField } from './types'

import { SettingsItem } from '~/layouts/settings-layout'
import { uuid } from '~/utils'

/**
 * Check if a field should be shown based on showWhen conditions.
 * When the condition is not met, the field and all its nested children are hidden.
 */
function shouldShowField(
  field: FormField,
  formData: Ref<any>,
  sectionPrefix: string,
): boolean {
  const { showWhen } = field.ui
  if (!showWhen) return true

  for (const [key, expected] of Object.entries(showWhen)) {
    const actualValue = get(formData.value, `${sectionPrefix}.${key}`)
    if (Array.isArray(expected)) {
      if (!expected.includes(actualValue)) return false
    } else {
      if (actualValue !== expected) return false
    }
  }
  return true
}

export const SectionFields = defineComponent({
  props: {
    fields: {
      type: Array as PropType<FormField[]>,
      required: true,
    },
    formData: {
      type: Object as PropType<Ref<any>>,
      required: true,
    },
    dataKeyPrefix: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    return () => {
      const { fields, formData, dataKeyPrefix } = props

      return (
        <>
          {fields
            .filter((field) => !field.ui.hidden)
            .filter((field) => shouldShowField(field, formData, dataKeyPrefix))
            .map((field) => {
              const fieldPath = `${dataKeyPrefix}.${field.key}`

              // Handle nested fields (object type)
              if (field.fields && field.fields.length > 0) {
                return (
                  <SectionFields
                    fields={field.fields}
                    formData={formData}
                    dataKeyPrefix={fieldPath}
                  />
                )
              }

              return (
                <FormFieldItem
                  key={fieldPath}
                  field={field}
                  value={get(formData.value, fieldPath, undefined)}
                  onUpdateValue={(val) => {
                    const parentPath = dataKeyPrefix
                    if (get(formData.value, parentPath)) {
                      set(formData.value, fieldPath, val)
                    } else {
                      set(formData.value, parentPath, {
                        ...get(formData.value, parentPath, {}),
                        [field.key]: val,
                      })
                    }
                  }}
                />
              )
            })}
        </>
      )
    }
  },
})

export const FormFieldItem = defineComponent({
  props: {
    field: {
      type: Object as PropType<FormField>,
      required: true,
    },
    value: {
      type: Object as any,
      required: false,
    },
    onUpdateValue: {
      type: Function as PropType<(value: any) => void>,
      required: true,
    },
  },
  setup(props) {
    const innerValue = ref(props.value)

    watch(
      () => props.value,
      (newVal) => {
        innerValue.value = newVal
      },
    )

    watchEffect(() => {
      props.onUpdateValue(innerValue.value)
    })

    const renderComponent = () => {
      const { field } = props
      const { ui } = field

      switch (ui.component) {
        case 'input':
          return (
            <NInput
              inputProps={{ id: uuid() }}
              value={innerValue.value}
              onUpdateValue={(val) => {
                innerValue.value = val
              }}
              placeholder={ui.placeholder}
              clearable
            />
          )

        case 'password':
          return (
            <NInput
              inputProps={{ id: uuid() }}
              value={innerValue.value}
              onUpdateValue={(val) => {
                innerValue.value = val
              }}
              type="password"
              showPasswordOn="click"
              placeholder={ui.placeholder}
              clearable
            />
          )

        case 'textarea':
          return (
            <NInput
              inputProps={{ id: uuid() }}
              value={innerValue.value}
              onUpdateValue={(val) => {
                innerValue.value = val
              }}
              type="textarea"
              autosize={{ maxRows: 5, minRows: 3 }}
              placeholder={ui.placeholder}
              clearable
            />
          )

        case 'number':
          return (
            <NInputNumber
              value={innerValue.value}
              onUpdateValue={(val) => {
                innerValue.value = val
              }}
              placeholder={ui.placeholder}
            />
          )

        case 'switch':
          return (
            <NSwitch
              value={innerValue.value}
              onUpdateValue={(val) => {
                innerValue.value = val
              }}
            />
          )

        case 'select':
          return (
            <NSelect
              value={innerValue.value}
              onUpdateValue={(val) => {
                innerValue.value = val
              }}
              options={ui.options}
              filterable
              placeholder={ui.placeholder}
            />
          )

        case 'tags':
          return (
            <NDynamicTags
              value={innerValue.value}
              onUpdateValue={(val) => {
                innerValue.value = val
              }}
            />
          )

        default:
          return null
      }
    }

    return () => {
      const { field } = props
      const { title, description } = field

      return (
        <SettingsItem title={title}>
          {{
            default: () => renderComponent(),
            description: description
              ? () => <span innerHTML={marked.parse(description) as string} />
              : undefined,
          }}
        </SettingsItem>
      )
    }
  },
})
