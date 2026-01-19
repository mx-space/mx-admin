import { get, set } from 'es-toolkit/compat'
import { marked } from 'marked'
import {
  NDynamicTags,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSpace,
  NSwitch,
  NText,
} from 'naive-ui'
import { computed, defineComponent, ref, watch, watchEffect } from 'vue'
import type { PropType, Ref } from 'vue'
import type { FormField } from './types'

import { useStoreRef } from '~/hooks/use-store-ref'
import { UIStore } from '~/stores/ui'
import { uuid } from '~/utils'

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

    const uiStore = useStoreRef(UIStore)
    const gridCols = computed(() => (uiStore.viewport.value.mobile ? 1 : 2))

    return () => {
      const { field } = props
      const { title, description, ui } = field

      const base = (
        <NFormItem label={title}>
          {description ? (
            <NSpace class="w-full" vertical>
              {renderComponent()}
              <NText class="text-xs" depth={3}>
                <span innerHTML={marked.parse(description) as string} />
              </NText>
            </NSpace>
          ) : (
            renderComponent()
          )}
        </NFormItem>
      )

      if (ui.halfGrid && gridCols.value === 2) {
        return <div class="inline-block w-1/2">{base}</div>
      }

      return base
    }
  },
})
