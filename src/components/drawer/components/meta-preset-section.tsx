/**
 * 元数据预设字段区块
 * 提供预设字段表单和自定义 JSON 编辑的标签页切换
 */
import { isObject } from 'es-toolkit/compat'
import { ChevronDownIcon } from 'lucide-vue-next'
import {
  NButton,
  NCollapse,
  NCollapseItem,
  NDynamicInput,
  NModal,
  NSkeleton,
  NTabPane,
  NTabs,
} from 'naive-ui'
import { defineComponent, onMounted, ref, watch } from 'vue'
import type { MetaPresetField, MetaPresetScope } from '~/models/meta-preset'
import type { PropType } from 'vue'

import { metaPresetsApi } from '~/api/meta-presets'
import { JSONHighlight } from '~/components/json-highlight'
import { JSONParseReturnOriginal } from '~/utils/json'

import { JSONEditor } from './json-editor'
import { PresetFieldRenderer } from './preset-field-renderer'

/**
 * 元数据预设字段区块组件
 */
export const MetaPresetSection = defineComponent({
  props: {
    /**
     * 元数据对象
     */
    meta: {
      type: Object as PropType<Record<string, any> | undefined>,
      required: false,
    },
    /**
     * 更新元数据
     */
    onUpdateMeta: {
      type: Function as PropType<
        (meta: Record<string, any> | undefined) => void
      >,
      required: true,
    },
    /**
     * 适用范围
     */
    scope: {
      type: String as PropType<MetaPresetScope>,
      default: 'both',
    },
  },
  setup(props) {
    const activeTab = ref<'preset' | 'json'>('preset')

    const presets = ref<MetaPresetField[]>([])
    const loading = ref(true)
    const error = ref<string | null>(null)

    const showJSONEditorModal = ref(false)

    const keyValuePairs = ref<{ key: string; value: string }[]>([])
    let inUpdatedKeyValue = false

    const loadPresets = async () => {
      try {
        loading.value = true
        error.value = null
        const data = await metaPresetsApi.getAll({
          scope: props.scope,
          enabledOnly: true,
        })
        presets.value = Array.isArray(data) ? data : ((data as any)?.data ?? [])
      } catch (e: any) {
        error.value = e.message || '加载预设字段失败'
        presets.value = []
      } finally {
        loading.value = false
      }
    }

    onMounted(loadPresets)

    watch(() => props.scope, loadPresets)

    watch(
      () => props.meta,
      () => {
        if (inUpdatedKeyValue) {
          inUpdatedKeyValue = false
          return
        }

        if (props.meta && isObject(props.meta)) {
          keyValuePairs.value = Object.entries(props.meta).reduce(
            (acc, [key, value]): { key: string; value: string }[] => {
              return [
                ...acc,
                {
                  key,
                  value: JSON.stringify(value),
                },
              ]
            },
            [] as { key: string; value: string }[],
          )
        } else {
          keyValuePairs.value = []
        }
      },
      { flush: 'post', deep: true, immediate: true },
    )

    watch(
      () => keyValuePairs.value,
      () => {
        inUpdatedKeyValue = true
        const newMeta = keyValuePairs.value.reduce(
          (acc, { key, value }) => {
            if (!key || value === undefined || value === '') return acc
            return { ...acc, [key]: JSONParseReturnOriginal(value) }
          },
          {} as Record<string, any>,
        )
        props.onUpdateMeta(
          Object.keys(newMeta).length > 0 ? newMeta : undefined,
        )
      },
    )

    const isEmptyValue = (val: any): boolean => {
      if (val === undefined || val === null || val === '') return true
      if (
        typeof val === 'object' &&
        !Array.isArray(val) &&
        Object.keys(val).length === 0
      )
        return true
      return false
    }

    const updateFieldValue = (key: string, value: any) => {
      const currentMeta = props.meta ?? {}
      if (isEmptyValue(value)) {
        const { [key]: _, ...rest } = currentMeta
        props.onUpdateMeta(Object.keys(rest).length > 0 ? rest : undefined)
      } else {
        props.onUpdateMeta({ ...currentMeta, [key]: value })
      }
    }

    const expanded = ref(false)

    return () => (
      <div class="space-y-3">
        <button
          type="button"
          class="flex w-full items-center justify-between rounded-lg border border-neutral-200 px-3 py-2.5 text-left transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800/50"
          onClick={() => (expanded.value = !expanded.value)}
          aria-expanded={expanded.value}
        >
          <span class="text-sm text-neutral-600 dark:text-neutral-300">
            自定义 Meta 数据
            {props.meta && Object.keys(props.meta).length > 0 && (
              <span class="ml-2 text-xs text-neutral-400">
                ({Object.keys(props.meta).length} 项)
              </span>
            )}
          </span>
          <div class="flex items-center gap-2">
            <NButton
              size="tiny"
              quaternary
              type="primary"
              onClick={(e: MouseEvent) => {
                e.stopPropagation()
                showJSONEditorModal.value = true
              }}
            >
              JSON 编辑
            </NButton>
            <ChevronDownIcon
              class={[
                'size-4 text-neutral-400 transition-transform',
                expanded.value && 'rotate-180',
              ]}
            />
          </div>
        </button>

        {expanded.value && (
          <div class="rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
            {loading.value ? (
              <div class="space-y-3">
                <NSkeleton height="32px" />
                <NSkeleton height="32px" />
                <NSkeleton height="32px" />
              </div>
            ) : error.value ? (
              <div class="text-sm text-red-500">{error.value}</div>
            ) : (
              <NTabs
                size="small"
                value={activeTab.value}
                onUpdateValue={(v) =>
                  (activeTab.value = v as 'preset' | 'json')
                }
                type="segment"
                animated
              >
                <NTabPane name="preset" tab="预设字段">
                  <div class="mt-4 space-y-4 p-2">
                    {presets.value.length === 0 ? (
                      <div class="py-4 text-center text-sm text-neutral-400">
                        暂无可用的预设字段
                      </div>
                    ) : (
                      presets.value.map((field) => (
                        <PresetFieldRenderer
                          key={field.id}
                          field={field}
                          value={props.meta?.[field.key]}
                          onChange={(v) => updateFieldValue(field.key, v)}
                        />
                      ))
                    )}
                  </div>
                </NTabPane>

                <NTabPane name="json" tab="自定义 JSON">
                  <div class="mt-4 space-y-3 p-2">
                    <NDynamicInput
                      preset="pair"
                      value={keyValuePairs.value}
                      keyPlaceholder="字段名"
                      valuePlaceholder="字段值"
                      onUpdateValue={(value: any[]) => {
                        keyValuePairs.value = value
                      }}
                    />

                    {props.meta && Object.keys(props.meta).length > 0 && (
                      <NCollapse accordion>
                        <NCollapseItem title="预览 JSON">
                          <JSONHighlight
                            class="max-w-full overflow-auto rounded-lg bg-neutral-50 p-3 text-xs dark:bg-neutral-800/50"
                            code={JSON.stringify(props.meta, null, 2)}
                          />
                        </NCollapseItem>
                      </NCollapse>
                    )}
                  </div>
                </NTabPane>
              </NTabs>
            )}
          </div>
        )}

        <NModal
          show={showJSONEditorModal.value}
          onUpdateShow={(show) => {
            showJSONEditorModal.value = show
          }}
          zIndex={2222}
          preset="card"
          closable
          closeOnEsc={false}
          title="编辑附加字段"
          onClose={() => {
            showJSONEditorModal.value = false
          }}
          class="w-[unset]"
        >
          <JSONEditor
            value={props.meta ? JSON.stringify(props.meta, null, 2) : ''}
            onFinish={(jsonString: string) => {
              try {
                inUpdatedKeyValue = false
                const parsed = JSON.parse(jsonString || '{}')
                props.onUpdateMeta(
                  Object.keys(parsed).length > 0 ? parsed : undefined,
                )
                showJSONEditorModal.value = false
              } catch (error: any) {
                message.error(error.message)
              }
            }}
          />
        </NModal>
      </div>
    )
  },
})
