import { cloneDeep, isEmpty } from 'es-toolkit/compat'
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
import { SettingsCard } from '~/layouts/settings-layout'
import { deepDiff } from '~/utils'

import { AIConfigSection } from './sections/ai-config'

export const autosizeableProps = {
  autosize: true,
  clearable: true,
  style: 'min-width: 300px; max-width: 100%',
} as const

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

    const sectionDiffs = ref<Record<string, any>>({})
    const isInitializing = ref(true)

    onBeforeMount(async () => {
      await fetchConfig()
    })

    watch(
      () => configs,
      (n) => {
        if (!props.schema) return
        if (isInitializing.value || Object.keys(originConfigs).length === 0)
          return

        const fullDiff = deepDiff(originConfigs, toRaw(n))

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
      for (const key of Object.keys(configs)) {
        delete configs[key]
      }
      for (const [key, value] of Object.entries(response)) {
        configs[key] = value
      }
      sectionDiffs.value = {}
      isInitializing.value = false
    }

    watch(
      () => props.schema,
      async (newSchema) => {
        if (newSchema) {
          await fetchConfig()
        }
      },
    )

    const isDirty = computed(() => {
      return Object.keys(sectionDiffs.value).length > 0
    })

    const unsavedChangesCount = computed(() => {
      return Object.keys(sectionDiffs.value).length
    })

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

    async function saveAll() {
      const sectionKeys = Object.keys(sectionDiffs.value)
      if (sectionKeys.length === 0) return

      try {
        await Promise.all(
          sectionKeys.map((key) => saveSection(key, true, true)),
        )

        await fetchConfig()
        toast.success(`已保存 ${sectionKeys.length} 项修改`)
      } catch (error: any) {
        console.error('Failed to save:', error)
        toast.error(error?.message || '保存失败，请重试')
      }
    }

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
              <SettingsCard
                key={section.key}
                title={section.title}
                id={`section-${section.key}`}
              >
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
              </SettingsCard>
            ))}
        </div>
      )
    }
  },
})
