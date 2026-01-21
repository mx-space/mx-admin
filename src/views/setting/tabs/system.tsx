import { cloneDeep, isEmpty } from 'es-toolkit/compat'
import { NForm } from 'naive-ui'
import {
  computed,
  defineComponent,
  onBeforeMount,
  reactive,
  ref,
  toRaw,
  watch,
} from 'vue'
import { toast } from 'vue-sonner'
import type {
  FormDSL,
  FormGroup,
  FormSection,
} from '~/components/config-form/types'
import type { PropType } from 'vue'

import { optionsApi } from '~/api/options'
import { SectionFields } from '~/components/config-form'
import { useStoreRef } from '~/hooks/use-store-ref'
import { UIStore } from '~/stores/ui'
import { deepDiff } from '~/utils'

import styles from '../index.module.css'
import { AIConfigSection } from './sections/ai-config'

export const autosizeableProps = {
  autosize: true,
  clearable: true,
  style: 'min-width: 300px; max-width: 100%',
} as const

const NFormPrefixCls = 'mt-4'
const NFormBaseProps = {
  class: NFormPrefixCls,
  labelPlacement: 'left',
  labelAlign: 'right',
  labelWidth: 150,
  autocomplete: 'chrome-off',
}

export const TabSystem = defineComponent({
  props: {
    activeGroup: {
      type: Object as PropType<FormGroup | null>,
      default: null,
    },
    schema: {
      type: Object as PropType<FormDSL | null>,
      default: null,
    },
  },
  emits: ['update:dirty-info'],
  setup(props, { emit, expose }) {
    let originConfigs: any = {}
    const configs = reactive<Record<string, any>>({})

    // Track which sections have changes
    const sectionDiffs = ref<Record<string, any>>({})
    const isInitializing = ref(true)

    onBeforeMount(async () => {
      await fetchConfig()
    })

    watch(
      () => configs,
      (n) => {
        if (!props.schema) return
        // Skip diff calculation during initialization or if originConfigs is empty
        if (isInitializing.value || Object.keys(originConfigs).length === 0)
          return

        const fullDiff = deepDiff(originConfigs, toRaw(n))

        // Group diffs by section key
        const newSectionDiffs: Record<string, any> = {}
        for (const [key, value] of Object.entries(fullDiff)) {
          if (!isEmpty(value)) {
            newSectionDiffs[key] = value
          }
        }
        sectionDiffs.value = newSectionDiffs
      },
      { deep: true },
    )

    async function saveSection(
      sectionKey: string,
      skipRefetch = false,
      skipMessage = false,
    ) {
      const diff = sectionDiffs.value[sectionKey]
      if (isEmpty(diff)) return

      const sectionConfig = configs[sectionKey]
      if (!sectionConfig) return

      const val = Object.fromEntries(
        Object.entries(diff).map(([k, v]) => {
          if (Array.isArray(v)) {
            return [k, sectionConfig[k]]
          }
          return [k, v]
        }),
      )

      await optionsApi.patch(sectionKey, val)
      if (!skipRefetch) {
        await fetchConfig()
      }
      if (!skipMessage) {
        toast.success('修改成功')
      }
    }

    const fetchConfig = async () => {
      isInitializing.value = true
      const response = await optionsApi.getAll()
      if (!response) {
        isInitializing.value = false
        return
      }

      originConfigs = cloneDeep(response)
      // Clear existing keys and assign new values
      for (const key of Object.keys(configs)) {
        delete configs[key]
      }
      for (const [key, value] of Object.entries(response)) {
        configs[key] = value
      }
      // Reset diffs after fetching new config
      sectionDiffs.value = {}
      isInitializing.value = false
    }

    // Re-fetch when schema changes
    watch(
      () => props.schema,
      async (newSchema) => {
        if (newSchema) {
          await fetchConfig()
        }
      },
    )

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

    // Computed properties for dirty state
    const isDirty = computed(() => {
      return Object.keys(sectionDiffs.value).length > 0
    })

    const unsavedChangesCount = computed(() => {
      return Object.keys(sectionDiffs.value).length
    })

    // Emit dirty info changes to parent
    watch(
      [isDirty, unsavedChangesCount],
      () => {
        emit('update:dirty-info', {
          isDirty: isDirty.value,
          count: unsavedChangesCount.value,
        })
      },
      { immediate: true },
    )

    // Save all sections with changes
    async function saveAll() {
      const sectionKeys = Object.keys(sectionDiffs.value)
      if (sectionKeys.length === 0) return

      try {
        // Save all sections without individual refetch and messages
        await Promise.all(
          sectionKeys.map((key) => saveSection(key, true, true)),
        )

        // Refetch config once after all saves
        await fetchConfig()
        toast.success(`已保存 ${sectionKeys.length} 项修改`)
      } catch (error: any) {
        console.error('Failed to save:', error)
        toast.error(error?.message || '保存失败，请重试')
      }
    }

    // Expose saveAll method to parent
    expose({
      saveAll,
    })

    return () => {
      const { activeGroup } = props

      if (!activeGroup) {
        return <div class="py-12 text-center text-neutral-500">加载中...</div>
      }

      return (
        <div class="flex flex-col gap-6">
          {activeGroup.sections
            .filter((section: FormSection) => !section.hidden)
            .map((section: FormSection) => (
              <div
                key={section.key}
                id={`section-${section.key}`}
                class={styles.sectionCard}
              >
                <div class={styles.sectionCardHeader}>
                  <h3 class={styles.sectionCardTitle}>{section.title}</h3>
                </div>
                <div class={styles.sectionCardBody}>
                  <NForm {...formProps}>
                    {section.key === 'ai' ? (
                      <AIConfigSection
                        value={configs.ai || {}}
                        onUpdate={(value: any) => {
                          configs.ai = value
                        }}
                      />
                    ) : (
                      <SectionFields
                        fields={section.fields}
                        formData={computed(() => configs)}
                        dataKeyPrefix={section.key}
                      />
                    )}
                  </NForm>
                </div>
              </div>
            ))}
        </div>
      )
    }
  },
})
