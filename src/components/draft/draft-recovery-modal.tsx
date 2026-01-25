import { X } from 'lucide-vue-next'
import { NButton, NModal, NSpin } from 'naive-ui'
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
          class="flex h-[600px] w-[900px] max-w-[90vw] flex-col rounded-xl bg-white shadow-xl dark:bg-neutral-900"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div class="flex flex-shrink-0 items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
            <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              检测到未保存的草稿
            </h2>
            <button
              type="button"
              class="rounded-lg p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
              onClick={props.onClose}
              aria-label="关闭"
            >
              <X class="size-5" />
            </button>
          </div>

          {/* Body - Split View */}
          <div class="flex min-h-0 flex-1">
            {/* Left: Version List */}
            <div class="w-60 flex-shrink-0 overflow-y-auto border-r border-neutral-200 p-4 dark:border-neutral-800">
              <h3 class="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                版本列表
              </h3>
              {historyLoading.value ? (
                <div class="flex items-center justify-center py-8">
                  <NSpin size="small" />
                </div>
              ) : (
                <div class="space-y-2">
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
                          ? selectedVersion.value === props.draft.version
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
              )}
            </div>

            {/* Right: Diff Preview */}
            <div class="min-w-0 flex-1 p-4">
              <h3 class="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                与已发布版本的差异
              </h3>
              <div class="h-[calc(100%-2rem)]">
                {selectedVersionContent.value ? (
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
                ) : (
                  <div class="flex h-full items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900">
                    选择一个版本查看差异
                  </div>
                )}
              </div>
            </div>
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
