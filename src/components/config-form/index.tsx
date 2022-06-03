import { useStoreRef } from 'hooks/use-store-ref'
import { get, set } from 'lodash-es'
import {
  NCollapse,
  NCollapseItem,
  NDynamicTags,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSpace,
  NSwitch,
  NText,
} from 'naive-ui'
import { UIStore } from 'stores/ui'
import type { ComputedRef, InjectionKey, PropType, Ref } from 'vue'

const NFormPrefixCls = 'mt-6'
const NFormBaseProps = {
  class: NFormPrefixCls,
  labelPlacement: 'left',
  labelAlign: 'right',
  labelWidth: 150,
  autocomplete: 'chrome-off',
}

export const JSONSchemaFormInjectKey: InjectionKey<{
  schema: ComputedRef<any>
  definitions: ComputedRef<Map<string, any>>
  getKey: (key: string) => string
}> = Symbol('JSONSchemaFormInject')
export const ConfigForm = defineComponent({
  props: {
    schema: {
      type: Object as PropType<KV>,
      required: true,
    },
    onValueChange: {
      type: Function as PropType<(val: any) => any>,
      required: true,
    },
    initialValue: {
      type: Object as PropType<KV>,
      required: true,
    },

    getKey: {
      type: Function as PropType<(key: string) => string>,
      required: false,
      default: (key: string) => key,
    },
  },

  setup(props) {
    const formData = ref(props.initialValue)

    const definitions = computed(() => props.schema.definitions)
    const defintionMap = computed(
      () => new Map(Object.entries(props.schema.definitions)),
    )

    provide(JSONSchemaFormInjectKey, {
      schema: props.schema,
      definitions: defintionMap,
      getKey: props.getKey,
    })

    const definitionsKeys = computed(() => Object.keys(definitions.value))

    const expandedNames = ref<string[]>([definitionsKeys.value[0]])
    const uiStore = useStoreRef(UIStore)

    const formProps = reactive(NFormBaseProps) as any
    watch(
      () => uiStore.viewport.value.mobile,
      (n) => {
        if (n) {
          formProps.labelPlacement = 'top'
          formProps.labelAlign = 'left'
        } else {
          formProps.labelPlacement = 'left'
          formProps.labelAlign = 'right'
        }
      },
      { immediate: true },
    )

    return () => {
      const { schema } = props
      return (
        <>
          <NCollapse
            accordion
            defaultExpandedNames={expandedNames.value}
            displayDirective="if"
          >
            {definitionsKeys.value.map((key) => {
              const schema = definitions.value[key]

              if (!schema.title) {
                return null
              }

              return (
                <NCollapseItem
                  title={schema.title}
                  data-schema={JSON.stringify(schema)}
                >
                  <NForm {...formProps}>
                    <SchemaSection
                      dataKey={props.getKey(key)}
                      formData={formData}
                      schema={schema}
                    />
                  </NForm>
                </NCollapseItem>
              )
            })}
          </NCollapse>
          {schema.ps.length ? (
            <NSpace vertical>
              {schema.ps.map((text) => {
                return (
                  <NText class="ml-4 mt-8 text-xs inline-block" depth={3}>
                    {text}
                  </NText>
                )
              })}
            </NSpace>
          ) : null}
        </>
      )
    }
  },
})

const SchemaSection = defineComponent({
  props: {
    schema: {
      type: Object as PropType<any>,
      required: true,
    },
    formData: {
      type: Object as PropType<Ref<any>>,
      required: true,
    },
    dataKey: {
      type: String as PropType<string>,
      required: true,
    },
  },
  setup(props) {
    const { definitions, getKey } = inject(JSONSchemaFormInjectKey, {} as any)

    return () => {
      const { schema, formData, dataKey: key } = props

      if (!schema) {
        return null
      }
      return (
        <>
          {Object.keys(schema.properties).map((property) => {
            const current = schema.properties[property]

            if (current.$ref) {
              const nestSchmea = definitions.value.get(
                current.$ref.split('/').at(-1),
              )

              return (
                <SchemaSection
                  dataKey={`${getKey(key)}.${property}`}
                  formData={formData}
                  schema={nestSchmea}
                />
              )
            }

            return (
              <ScheamFormItem
                value={get(
                  formData.value,
                  `${getKey(key)}.${property}`,
                  undefined,
                )}
                onUpdateValue={(val) => {
                  if (get(formData.value, getKey(key))) {
                    set(formData.value, `${getKey(key)}.${property}`, val)
                  } else {
                    set(formData.value, getKey(key), {
                      ...get(formData.value, getKey(key), {}),
                      [property]: val,
                    })
                  }
                }}
                title={current.title}
                type={current.type}
                options={current?.['ui:options']}
              />
            )
          })}
        </>
      )
    }
  },
})

const ScheamFormItem = defineComponent({
  props: {
    type: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    options: {
      type: Object,
      default: () => ({}),
    },

    value: {
      type: Object as any,
      required: true,
    },
    onUpdateValue: {
      type: Function as PropType<(value: any) => void>,
      required: true,
    },
  },
  setup(props) {
    const innerValue = ref(props.value)

    watchEffect(() => {
      props.onUpdateValue(innerValue.value)
    })

    const renderComponent = () => {
      const { options } = props

      switch (props.type) {
        case 'url':
        case 'string': {
          const { showPassword } = options
          return (
            <NInput
              value={innerValue.value}
              onUpdateValue={(val) => {
                innerValue.value = val
              }}
              type={showPassword ? 'password' : 'text'}
            ></NInput>
          )
        }
        case 'array': {
          return (
            <NDynamicTags
              value={innerValue.value}
              onUpdateValue={(val) => {
                innerValue.value = val
              }}
            ></NDynamicTags>
          )
        }
        case 'boolean': {
          return (
            <NSwitch
              value={innerValue.value}
              onUpdateValue={(val) => {
                innerValue.value = val
              }}
            ></NSwitch>
          )
        }

        case 'integer': {
          return (
            <NInputNumber
              value={innerValue.value}
              onUpdateValue={(val) => {
                innerValue.value = val
              }}
            />
          )
        }
        default:
          return null
      }
    }

    const uiStore = useStoreRef(UIStore)
    const gridCols = computed(() => (uiStore.viewport.value.mobile ? 1 : 2))
    return () => {
      const { title, options, description } = props

      const base = (
        <>
          <NFormItem label={title}>
            {description ? (
              <NSpace vertical>
                {renderComponent()}

                <NText class="text-xs" depth={3}>
                  {description}
                </NText>
              </NSpace>
            ) : (
              renderComponent()
            )}
          </NFormItem>
        </>
      )

      if (options.halfGrid && gridCols.value === 2) {
        return <div class={'w-1/2 inline-block'}>{base}</div>
      }

      return base
    }
  },
})
