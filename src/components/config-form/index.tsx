import {
  NCollapse,
  NCollapseItem,
  NDynamicTags,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSwitch,
} from 'naive-ui'
import type { InjectionKey, PropType, Ref } from 'vue'

import jsonSchema from './mock.json'

export const JSONSchemaFormInjectKey: InjectionKey<{
  schema: any
  definitions: Map<string, any>
}> = Symbol('JSONSchemaFormInject')
export const ConfigForm = defineComponent({
  // props: {
  //   // schema: {
  //   //   type: Object as PropType<any>,
  //   //   required: true,
  //   // },
  //   // onValueChange: {
  //   //   type: Function as PropType<any>,
  //   //   required: true,
  //   // },
  // },

  setup(props) {
    const formData = ref({})
    const definitions = jsonSchema.definitions
    const defintionMap = new Map(Object.entries(definitions))

    provide(JSONSchemaFormInjectKey, {
      schema: jsonSchema,
      definitions: defintionMap,
    })

    return () => {
      return (
        <NCollapse>
          {Object.keys(definitions).map((key) => {
            const schema = definitions[key]

            if (!schema.title) {
              return null
            }

            return (
              <NCollapseItem
                title={schema.title}
                data-schema={JSON.stringify(schema)}
              >
                <NForm>
                  <SchemaSection
                    dataKey={key}
                    formData={formData}
                    schema={schema}
                  />
                </NForm>
              </NCollapseItem>
            )
          })}
        </NCollapse>
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
    const { definitions } = inject(JSONSchemaFormInjectKey, {} as any)

    return () => {
      const { schema, formData, dataKey: key } = props
      return (
        <NForm>
          {Object.keys(schema.properties).map((property) => {
            const current = schema.properties[property]

            if (current.$ref) {
              const nestSchmea = definitions.get(current.$ref.split('/').at(-1))
              console.log(nestSchmea)

              return (
                <SchemaSection
                  dataKey={key}
                  formData={formData}
                  schema={nestSchmea}
                />
              )
            }
            return (
              <ScheamFormItem
                value={formData.value[key]?.[property]}
                onUpdateValue={(val) => {
                  if (formData.value[key]) {
                    formData.value[key][property] = val
                  } else {
                    formData.value[key] = {
                      ...formData.value[key],
                      [property]: val,
                    }
                  }
                }}
                title={current.title}
                type={current.type}
                options={current?.['ui:options']}
              />
            )
          })}
        </NForm>
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
    return () => {
      const { title } = props

      return <NFormItem label={title}>{renderComponent()}</NFormItem>
    }
  },
})
