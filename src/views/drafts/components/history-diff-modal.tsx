import { ArrowLeftRight, ChevronDown, GitCompare, X } from 'lucide-vue-next'
import { NButton, NModal, NPopover, NSpin, NTooltip } from 'naive-ui'
import { computed, defineComponent, ref, watch } from 'vue'
import type { DraftHistoryListItem, DraftModel } from '~/models/draft'
import type { PropType } from 'vue'

import { draftsApi } from '~/api/drafts'
import { DiffPreview } from '~/components/draft/diff-preview'
import { RelativeTime } from '~/components/time/relative-time'

interface VersionOption {
  version: number | 'current'
  title: string
  savedAt: string
  isCurrent?: boolean
}

const VersionSelector = defineComponent({
  name: 'VersionSelector',
  props: {
    value: {
      type: [Number, String] as PropType<number | 'current'>,
      required: true,
    },
    options: {
      type: Array as PropType<VersionOption[]>,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    onSelect: {
      type: Function as PropType<(version: number | 'current') => void>,
      required: true,
    },
  },
  setup(props) {
    const showDropdown = ref(false)

    const selectedOption = computed(() =>
      props.options.find((opt) => opt.version === props.value),
    )

    const getVersionLabel = (version: number | 'current') => {
      if (version === 'current') return '当前版本'
      return `v${version}`
    }

    return () => (
      <NPopover
        show={showDropdown.value}
        onUpdateShow={(v) => (showDropdown.value = v)}
        trigger="click"
        placement="bottom-start"
        raw
      >
        {{
          trigger: () => (
            <button
              type="button"
              class="flex min-w-[180px] items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-left transition-colors hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-neutral-600"
            >
              <div class="min-w-0 flex-1">
                <div class="text-xs text-neutral-400 dark:text-neutral-500">
                  {props.label}
                </div>
                <div class="mt-0.5 flex items-center gap-2">
                  <span class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {getVersionLabel(props.value)}
                  </span>
                  {selectedOption.value?.isCurrent && (
                    <span class="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                      最新
                    </span>
                  )}
                </div>
              </div>
              <ChevronDown class="size-4 flex-shrink-0 text-neutral-400" />
            </button>
          ),
          default: () => (
            <div class="max-h-[300px] w-[220px] overflow-y-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
              {props.options.map((opt) => (
                <button
                  key={opt.version}
                  type="button"
                  class={[
                    'flex w-full items-start gap-2 px-3 py-2 text-left transition-colors',
                    props.value === opt.version
                      ? 'bg-blue-50 dark:bg-blue-950/30'
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-700/50',
                  ]}
                  onClick={() => {
                    props.onSelect(opt.version)
                    showDropdown.value = false
                  }}
                >
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <span
                        class={[
                          'text-sm font-medium',
                          props.value === opt.version
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-neutral-900 dark:text-neutral-100',
                        ]}
                      >
                        {getVersionLabel(opt.version)}
                      </span>
                      {opt.isCurrent && (
                        <span class="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                          最新
                        </span>
                      )}
                    </div>
                    <p class="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
                      {opt.title || '无标题'}
                    </p>
                    <p class="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
                      <RelativeTime time={opt.savedAt} />
                    </p>
                  </div>
                  {props.value === opt.version && (
                    <div class="mt-1 size-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                  )}
                </button>
              ))}
            </div>
          ),
        }}
      </NPopover>
    )
  },
})

export const HistoryDiffModal = defineComponent({
  name: 'HistoryDiffModal',
  props: {
    show: {
      type: Boolean,
      required: true,
    },
    draftId: {
      type: String,
      required: true,
    },
    currentDraft: {
      type: Object as PropType<DraftModel | null>,
      default: null,
    },
    historyList: {
      type: Array as PropType<DraftHistoryListItem[]>,
      default: () => [],
    },
    initialCompareVersion: {
      type: Number,
      default: undefined,
    },
    onClose: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },
  setup(props) {
    const leftVersion = ref<number | 'current'>('current')
    const rightVersion = ref<number | 'current'>(1)

    const leftContent = ref<{ title: string; text: string } | null>(null)
    const rightContent = ref<{ title: string; text: string } | null>(null)
    const isLoadingLeft = ref(false)
    const isLoadingRight = ref(false)

    // Build version options list
    const versionOptions = computed<VersionOption[]>(() => {
      const list: VersionOption[] = []

      // Current version
      if (props.currentDraft) {
        list.push({
          version: 'current',
          title: props.currentDraft.title,
          savedAt: props.currentDraft.updated,
          isCurrent: true,
        })
      }

      // History versions (sorted by version desc)
      const sortedHistory = [...props.historyList].sort(
        (a, b) => b.version - a.version,
      )
      for (const item of sortedHistory) {
        // Skip if same as current draft version
        if (props.currentDraft && item.version === props.currentDraft.version) {
          continue
        }
        list.push({
          version: item.version,
          title: item.title,
          savedAt: item.savedAt,
        })
      }

      return list
    })

    // Load version content
    const loadVersionContent = async (
      version: number | 'current',
    ): Promise<{ title: string; text: string } | null> => {
      if (version === 'current' && props.currentDraft) {
        return {
          title: props.currentDraft.title,
          text: props.currentDraft.text,
        }
      }

      if (typeof version === 'number') {
        try {
          const data = await draftsApi.getHistoryVersion(props.draftId, version)
          return {
            title: data.title,
            text: data.text,
          }
        } catch (error) {
          console.error('Failed to load version:', error)
          return null
        }
      }

      return null
    }

    // Initialize versions when modal opens
    watch(
      () => props.show,
      async (show) => {
        if (show) {
          // Default: compare current with the specified or first history version
          leftVersion.value = 'current'
          rightVersion.value =
            props.initialCompareVersion ??
            versionOptions.value.find((v) => v.version !== 'current')
              ?.version ??
            'current'

          // Load contents
          isLoadingLeft.value = true
          isLoadingRight.value = true

          const [left, right] = await Promise.all([
            loadVersionContent(leftVersion.value),
            loadVersionContent(rightVersion.value),
          ])

          leftContent.value = left
          rightContent.value = right
          isLoadingLeft.value = false
          isLoadingRight.value = false
        }
      },
      { immediate: true },
    )

    // Handle version changes
    const handleLeftVersionChange = async (version: number | 'current') => {
      leftVersion.value = version
      isLoadingLeft.value = true
      leftContent.value = await loadVersionContent(version)
      isLoadingLeft.value = false
    }

    const handleRightVersionChange = async (version: number | 'current') => {
      rightVersion.value = version
      isLoadingRight.value = true
      rightContent.value = await loadVersionContent(version)
      isLoadingRight.value = false
    }

    // Swap versions
    const handleSwapVersions = async () => {
      const tempVersion = leftVersion.value
      leftVersion.value = rightVersion.value
      rightVersion.value = tempVersion

      const tempContent = leftContent.value
      leftContent.value = rightContent.value
      rightContent.value = tempContent
    }

    const isLoading = computed(
      () => isLoadingLeft.value || isLoadingRight.value,
    )

    const hasNoDiff = computed(() => {
      if (!leftContent.value || !rightContent.value) return false
      return leftContent.value.text === rightContent.value.text
    })

    return () => (
      <NModal
        show={props.show}
        onUpdateShow={(show) => {
          if (!show) props.onClose()
        }}
        closeOnEsc
        transformOrigin="center"
      >
        <div
          class="flex h-[700px] w-[1000px] max-w-[95vw] flex-col rounded-xl bg-white shadow-xl dark:bg-neutral-900"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div class="flex flex-shrink-0 items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
            <div class="flex items-center gap-3">
              <div class="flex size-9 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
                <GitCompare class="size-5 text-neutral-600 dark:text-neutral-400" />
              </div>
              <div>
                <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  版本差异对比
                </h2>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                  选择两个版本进行内容对比
                </p>
              </div>
            </div>
            <button
              type="button"
              class="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
              onClick={props.onClose}
              aria-label="关闭"
            >
              <X class="size-5" />
            </button>
          </div>

          {/* Version Selectors */}
          <div class="flex flex-shrink-0 items-center justify-center gap-4 border-b border-neutral-200 bg-neutral-50 px-5 py-4 dark:border-neutral-800 dark:bg-neutral-900/50">
            <VersionSelector
              value={leftVersion.value}
              options={versionOptions.value}
              label="基准版本 (旧)"
              onSelect={handleLeftVersionChange}
            />

            <NTooltip>
              {{
                trigger: () => (
                  <NButton quaternary circle onClick={handleSwapVersions}>
                    {{
                      icon: () => (
                        <ArrowLeftRight class="size-4 text-neutral-500" />
                      ),
                    }}
                  </NButton>
                ),
                default: () => '交换版本',
              }}
            </NTooltip>

            <VersionSelector
              value={rightVersion.value}
              options={versionOptions.value}
              label="对比版本 (新)"
              onSelect={handleRightVersionChange}
            />
          </div>

          {/* Diff Content */}
          <div class="min-h-0 flex-1 overflow-hidden p-5">
            {isLoading.value ? (
              <div class="flex h-full items-center justify-center">
                <NSpin size="large" />
              </div>
            ) : hasNoDiff.value ? (
              <div class="flex h-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900/50">
                <div class="flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <GitCompare class="size-6 text-green-600 dark:text-green-400" />
                </div>
                <div class="text-center">
                  <p class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    两个版本内容相同
                  </p>
                  <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    选择不同的版本进行对比
                  </p>
                </div>
              </div>
            ) : leftContent.value && rightContent.value ? (
              <div class="h-full overflow-hidden rounded-lg">
                <DiffPreview
                  oldFile={{
                    name: `v${leftVersion.value === 'current' ? props.currentDraft?.version : leftVersion.value}.md`,
                    contents: leftContent.value.text,
                  }}
                  newFile={{
                    name: `v${rightVersion.value === 'current' ? props.currentDraft?.version : rightVersion.value}.md`,
                    contents: rightContent.value.text,
                  }}
                />
              </div>
            ) : (
              <div class="flex h-full items-center justify-center text-neutral-400">
                无法加载版本内容
              </div>
            )}
          </div>

          {/* Footer */}
          <div class="flex flex-shrink-0 items-center justify-between border-t border-neutral-200 px-5 py-4 dark:border-neutral-800">
            <div class="text-xs text-neutral-500 dark:text-neutral-400">
              {leftContent.value && rightContent.value && !hasNoDiff.value && (
                <span>
                  {(() => {
                    const oldLen = leftContent.value.text.length
                    const newLen = rightContent.value.text.length
                    const diff = newLen - oldLen
                    if (diff > 0) {
                      return (
                        <span class="text-green-600 dark:text-green-400">
                          +{diff} 字
                        </span>
                      )
                    } else if (diff < 0) {
                      return (
                        <span class="text-red-600 dark:text-red-400">
                          {diff} 字
                        </span>
                      )
                    }
                    return <span>内容长度相同</span>
                  })()}
                </span>
              )}
            </div>
            <NButton onClick={props.onClose}>关闭</NButton>
          </div>
        </div>
      </NModal>
    )
  },
})
