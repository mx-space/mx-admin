import { GitCompare, X } from 'lucide-vue-next'
import { NButton, NModal, NScrollbar, NSpin, NSplit } from 'naive-ui'
import { computed, defineComponent, ref, watch } from 'vue'
import type { DraftModel } from '~/models/draft'
import type { PropType } from 'vue'

import { useQuery } from '@tanstack/vue-query'

import { draftsApi } from '~/api/drafts'

import { DiffPreview } from './diff-preview'
import { VersionListItem } from './version-list-item'

export interface PublishedContent {
  title: string
  text: string
  updated: string
}

export const DraftRecoveryModal = defineComponent({
  name: 'DraftRecoveryModal',
  props: {
    show: {
      type: Boolean,
      required: true,
    },
    onClose: {
      type: Function as PropType<() => void>,
      required: true,
    },
    draft: {
      type: Object as PropType<DraftModel>,
      required: true,
    },
    publishedContent: {
      type: Object as PropType<PublishedContent>,
      required: true,
    },
    onRecover: {
      type: Function as PropType<
        (version: number | 'published', versionData?: DraftModel) => void
      >,
      required: true,
    },
  },
  setup(props) {
    const selectedVersion = ref<number | 'published'>('published')
    const selectedVersionContent = ref<{ title: string; text: string } | null>(
      null,
    )

    // Get draft history
    const { data: historyData, isLoading: historyLoading } = useQuery({
      queryKey: ['drafts', 'history', () => props.draft.id],
      queryFn: () => draftsApi.getHistory(props.draft.id),
      enabled: () => props.show,
      select: (res: any) =>
        Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [],
    })

    // Compute version list: current draft + history + published
    const versionList = computed(() => {
      const list: Array<{
        version: number | 'published' | 'current'
        title: string
        savedAt: string
        isCurrent?: boolean
      }> = []

      // Current draft (latest version)
      list.push({
        version: 'current',
        title: props.draft.title,
        savedAt: props.draft.updated,
        isCurrent: true,
      })

      // History versions (excluding current)
      if (historyData.value) {
        const sortedHistory = [...historyData.value].sort(
          (a, b) => b.version - a.version,
        )
        for (const item of sortedHistory) {
          if (item.version !== props.draft.version) {
            list.push({
              version: item.version,
              title: item.title,
              savedAt: item.savedAt,
            })
          }
        }
      }

      // Published version as baseline
      list.push({
        version: 'published',
        title: props.publishedContent.title,
        savedAt: props.publishedContent.updated,
      })

      return list
    })

    // Default select current draft
    watch(
      () => props.show,
      (show) => {
        if (show) {
          selectedVersion.value = props.draft.version
          selectedVersionContent.value = {
            title: props.draft.title,
            text: props.draft.text,
          }
        }
      },
      { immediate: true },
    )

    // Load version content when selection changes
    const handleSelectVersion = async (
      version: number | 'published' | 'current',
    ) => {
      const actualVersion =
        version === 'current' ? props.draft.version : version
      selectedVersion.value = actualVersion

      if (version === 'published') {
        selectedVersionContent.value = {
          title: props.publishedContent.title,
          text: props.publishedContent.text,
        }
      } else if (version === 'current') {
        selectedVersionContent.value = {
          title: props.draft.title,
          text: props.draft.text,
        }
      } else {
        // Load specific history version
        try {
          const versionData = await draftsApi.getHistoryVersion(
            props.draft.id,
            version,
          )
          selectedVersionContent.value = {
            title: versionData.title,
            text: versionData.text,
          }
        } catch (error) {
          console.error('Failed to load version:', error)
        }
      }
    }

    // Calculate diff stats (word count changes)
    const calcDiffStats = (oldText: string, newText: string) => {
      const oldLen = oldText.length
      const newLen = newText.length
      return {
        added: Math.max(0, newLen - oldLen),
        removed: Math.max(0, oldLen - newLen),
      }
    }

    // Diff stats for current selection
    const diffStats = computed(() => {
      if (!selectedVersionContent.value) return null
      const currentText = selectedVersionContent.value.text
      const publishedText = props.publishedContent.text
      const diff = currentText.length - publishedText.length
      return { diff, isSame: currentText === publishedText }
    })

    // Selected version label
    const selectedVersionLabel = computed(() => {
      if (selectedVersion.value === 'published') return '已发布'
      if (selectedVersion.value === props.draft.version) return '当前草稿'
      return `v${selectedVersion.value}`
    })

    const handleUsePublished = () => {
      props.onRecover('published')
      props.onClose()
    }

    const handleRecoverSelected = async () => {
      if (selectedVersion.value === 'published') {
        props.onRecover('published')
      } else {
        // Load the full version data and pass it
        const version =
          selectedVersion.value === props.draft.version
            ? props.draft.version
            : (selectedVersion.value as number)
        try {
          const versionData = await draftsApi.getHistoryVersion(
            props.draft.id,
            version,
          )
          props.onRecover(version, versionData)
        } catch {
          // If loading fails, use current draft data
          props.onRecover(version, props.draft)
        }
      }
      props.onClose()
    }

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
          class="flex h-[600px] w-[900px] max-w-[90vw] flex-col overflow-hidden rounded-xl bg-white shadow-xl dark:bg-neutral-900"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div class="flex flex-shrink-0 items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
            <div>
              <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                检测到未保存的草稿
              </h2>
              <p class="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                选择要恢复的版本，与已发布内容进行对比
              </p>
            </div>
            <button
              type="button"
              class="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
              onClick={props.onClose}
              aria-label="关闭"
            >
              <X class="size-5" />
            </button>
          </div>

          {/* Body - Split View */}
          <div class="min-h-0 flex-1">
            {historyLoading.value ? (
              <div class="flex h-full items-center justify-center">
                <NSpin size="large" />
              </div>
            ) : (
              <NSplit
                direction="horizontal"
                defaultSize={0.3}
                min={0.25}
                max={0.4}
                class="h-full"
              >
                {{
                  1: () => (
                    <div class="flex h-full flex-col border-r border-neutral-200 dark:border-neutral-800">
                      {/* Version list header */}
                      <div class="flex items-center gap-2 border-b border-neutral-200 px-4 py-2.5 dark:border-neutral-800">
                        <GitCompare class="size-4 text-neutral-500" />
                        <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          版本列表
                        </span>
                        <span class="text-xs text-neutral-400">
                          ({versionList.value.length})
                        </span>
                      </div>

                      {/* Version list */}
                      <NScrollbar class="flex-1">
                        <div class="divide-y divide-neutral-100 dark:divide-neutral-800">
                          {versionList.value.map((item) => (
                            <VersionListItem
                              key={
                                item.version === 'published'
                                  ? 'published'
                                  : item.version === 'current'
                                    ? 'current'
                                    : item.version
                              }
                              version={item.version}
                              title={item.title}
                              savedAt={item.savedAt}
                              isSelected={
                                item.version === 'current'
                                  ? selectedVersion.value ===
                                    props.draft.version
                                  : selectedVersion.value === item.version
                              }
                              isCurrent={item.isCurrent}
                              diffStats={
                                item.version !== 'published'
                                  ? calcDiffStats(
                                      props.publishedContent.text,
                                      item.version === 'current'
                                        ? props.draft.text
                                        : selectedVersionContent.value?.text ||
                                            props.draft.text,
                                    )
                                  : undefined
                              }
                              onClick={() => handleSelectVersion(item.version)}
                            />
                          ))}
                        </div>
                      </NScrollbar>
                    </div>
                  ),
                  2: () => (
                    <div class="flex h-full flex-col bg-neutral-50 dark:bg-neutral-950">
                      {/* Diff header */}
                      <div class="flex flex-shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 py-2.5 dark:border-neutral-800 dark:bg-neutral-900">
                        <div class="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                          <span>已发布</span>
                          <span class="text-neutral-400">→</span>
                          <span>{selectedVersionLabel.value}</span>
                        </div>

                        {diffStats.value && !diffStats.value.isSame && (
                          <div class="text-xs text-neutral-500">
                            {diffStats.value.diff > 0
                              ? `+${diffStats.value.diff}`
                              : diffStats.value.diff}{' '}
                            字
                          </div>
                        )}
                      </div>

                      {/* Diff content */}
                      <div class="min-h-0 flex-1 overflow-hidden">
                        {selectedVersionContent.value ? (
                          diffStats.value?.isSame ? (
                            <div class="flex h-full flex-col items-center justify-center gap-3 bg-white dark:bg-neutral-900">
                              <div class="flex size-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                                <GitCompare class="size-6 text-neutral-500 dark:text-neutral-400" />
                              </div>
                              <div class="text-center">
                                <p class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                  与已发布版本内容相同
                                </p>
                                <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                                  选择其他版本进行对比
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div class="h-full overflow-hidden">
                              <DiffPreview
                                oldFile={{
                                  name: 'published.md',
                                  contents: props.publishedContent.text,
                                }}
                                newFile={{
                                  name: 'draft.md',
                                  contents: selectedVersionContent.value.text,
                                }}
                              />
                            </div>
                          )
                        ) : (
                          <div class="flex h-full items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-white text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900">
                            选择一个版本查看差异
                          </div>
                        )}
                      </div>
                    </div>
                  ),
                  'resize-trigger': () => (
                    <div class="group relative h-full w-0 cursor-col-resize">
                      <div class="absolute left-1/2 top-1/2 h-8 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-300 transition-colors group-hover:bg-neutral-400 dark:bg-neutral-700 dark:group-hover:bg-neutral-600" />
                    </div>
                  ),
                }}
              </NSplit>
            )}
          </div>

          {/* Footer */}
          <div class="flex flex-shrink-0 items-center justify-end gap-2 border-t border-neutral-200 px-5 py-4 dark:border-neutral-800">
            <NButton onClick={handleUsePublished}>使用已发布版本</NButton>
            <NButton
              type="primary"
              onClick={handleRecoverSelected}
              disabled={selectedVersion.value === 'published'}
            >
              恢复选中的草稿版本
            </NButton>
          </div>
        </div>
      </NModal>
    )
  },
})
