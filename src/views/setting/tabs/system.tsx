import { HeaderActionButton } from 'components/button/rounded-button'
import { ConfigForm } from 'components/config-form'
import { CheckCircleOutlinedIcon } from 'components/icons'
import { useStoreRef } from 'hooks/use-store-ref'
import { useLayout } from 'layouts/content'
import { camelCase, cloneDeep, isEmpty, merge } from 'lodash-es'
import { UIStore } from 'stores/ui'
import { RESTManager, deepDiff } from 'utils'
import {
  defineComponent,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  toRaw,
  watch,
} from 'vue'

const NFormPrefixCls = 'mt-6'
const NFormBaseProps = {
  class: NFormPrefixCls,
  labelPlacement: 'left',
  labelAlign: 'right',
  labelWidth: 150,
  autocomplete: 'chrome-off',
}

export const autosizeableProps = {
  autosize: true,
  clearable: true,
  style: 'min-width: 300px; max-width: 100%',
} as const
export const TabSystem = defineComponent(() => {
  const { setHeaderButtons: setHeaderButton } = useLayout()

  onMounted(() => {
    setHeaderButton(
      <HeaderActionButton
        disabled={true}
        onClick={save}
        icon={<CheckCircleOutlinedIcon />}
      ></HeaderActionButton>,
    )
  })

  onBeforeUnmount(() => {
    setHeaderButton(null)
  })

  const schema = ref()

  onBeforeMount(async () => {
    schema.value = await RESTManager.api.config.jsonschema.get({
      transform: false,
    })
    await fetchConfig()
  })

  let originConfigs: any = {}
  const configs = reactive({})
  const diff = ref({} as any)

  watch(
    () => configs,
    (n) => {
      diff.value = deepDiff(originConfigs, toRaw(n))
    },
    { deep: true },
  )
  watch(
    () => diff.value,
    (n) => {
      let canSave = false
      if (isEmpty(n)) {
        canSave = false
      } else {
        canSave = true
      }
      setHeaderButton(
        <HeaderActionButton
          disabled={!canSave}
          icon={<CheckCircleOutlinedIcon />}
          onClick={save}
        ></HeaderActionButton>,
      )
    },
  )

  async function save() {
    if (isEmpty(diff.value)) {
      return
    }

    const entries = Object.entries(diff.value) as [string, any][]

    for await (const [key, value] of entries) {
      const val = Object.fromEntries(
        Object.entries(value).map(([k, v]) => {
          if (Array.isArray(v)) {
            return [k, configs[key][k]]
          }
          return [k, v]
        }),
      )

      await RESTManager.api.options(key).patch({
        data: val,
      })
    }

    await fetchConfig()
    message.success('修改成功')
  }

  const fetchConfig = async () => {
    let response = (await RESTManager.api.options.get()) as any
    response = merge(schema.value.default, response) as any

    originConfigs = cloneDeep(response)

    Object.assign(configs, response)
  }

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
  return () => (
    <Fragment>
      <div class="pt-4"></div>

      {schema.value && (
        <ConfigForm
          initialValue={configs}
          getKey={(key) => {
            return key
              .split('.')
              .map((kk) => camelCase(kk))
              .join('.')
              .replace('Dto', '')
          }}
          schema={schema.value}
        />
      )}
    </Fragment>
  )
})
