import { camelCase, cloneDeep, isEmpty, merge } from 'es-toolkit/compat'
import {
  CircleCheck as CheckCircleOutlinedIcon,
  Settings as SettingsIcon,
} from 'lucide-vue-next'
import {
  defineComponent,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  toRaw,
  watch,
} from 'vue'

import { optionsApi } from '~/api/options'
import { HeaderActionButton } from '~/components/button/rounded-button'
import { ConfigForm } from '~/components/config-form'
import { useStoreRef } from '~/hooks/use-store-ref'
import { useLayout } from '~/layouts/content'
import { UIStore } from '~/stores/ui'
import { deepDiff } from '~/utils'

import styles from '../index.module.css'
import { AIConfigSection } from './sections/ai-config'

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
  const { setActions: setHeaderButton } = useLayout()

  onMounted(() => {
    setHeaderButton(
      <HeaderActionButton
        disabled={true}
        onClick={save}
        icon={<CheckCircleOutlinedIcon />}
      />,
    )
  })

  onBeforeUnmount(() => {
    setHeaderButton(null)
  })

  const schema = ref()

  onBeforeMount(async () => {
    schema.value = await optionsApi.getJsonSchema()
    await fetchConfig()
  })

  let originConfigs: any = {}
  const configs = reactive<Record<string, any>>({})
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
        />,
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

      await optionsApi.patch(key, val)
    }

    await fetchConfig()
    message.success('修改成功')
  }

  const fetchConfig = async () => {
    let response = (await optionsApi.getAll()) as any
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
    <div class={styles.tabContent}>
      {/* Header */}
      <div class={styles.sectionHeader}>
        <div>
          <h2 class={styles.sectionTitle}>
            <SettingsIcon class="mr-2 inline-block size-5" aria-hidden="true" />
            系统设置
          </h2>
          <p class={styles.sectionSubtitle}>
            配置站点信息、SEO 设置、邮件服务等
          </p>
        </div>
      </div>

      {/* Config Form Container */}
      <div class={styles.card}>
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
            v-slots={{
              AIDto: () => (
                <AIConfigSection
                  value={configs.ai || {}}
                  onUpdate={(value: any) => {
                    configs.ai = value
                  }}
                />
              ),
            }}
          />
        )}
      </div>
    </div>
  )
})
