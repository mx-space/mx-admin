import {
  Book as BookIcon,
  ChevronLeft,
  Code as CodeIcon,
  File as FileIcon,
  GitCompare,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-vue-next'
import {
  NButton,
  NEmpty,
  NPopconfirm,
  NScrollbar,
  NSpin,
  NSplit,
  NTooltip,
} from 'naive-ui'
import { computed, defineComponent, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import type { DraftHistoryListItem, DraftModel } from '~/models/draft'
import type { PropType } from 'vue'

import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import { draftsApi } from '~/api/drafts'
import { DiffPreview } from '~/components/draft/diff-preview'
import { useMasterDetailLayout } from '~/components/layout'
import { RelativeTime } from '~/components/time/relative-time'
import { DraftRefType } from '~/models/draft'
import { RouteName } from '~/router/name'

const refTypeConfig = {
  [DraftRefType.Post]: {
    label: '文章',
    icon: CodeIcon,
    editRoute: RouteName.EditPost,
  },
  [DraftRefType.Note]: {
    label: '手记',
    icon: BookIcon,
    editRoute: RouteName.EditNote,
  },
  [DraftRefType.Page]: {
    label: '页面',
    icon: FileIcon,
    editRoute: RouteName.EditPage,
  },
}

interface VersionItem {
  version: number
  title: string
  savedAt: string
  isCurrent: boolean
  isFullSnapshot?: boolean
  refVersion?: number
  baseVersion?: number
}

const VersionListItem = defineComponent({
  name: 'VersionListItem',
  props: {
    item: {
      type: Object as PropType<VersionItem>,
      required: true,
    },
    isSelected: {
      type: Boolean,
      default: false,
    },
    onClick: {
      type: Function as PropType<() => void>,
      required: true,
    },
    onRestore: {
      type: Function as PropType<() => void>,
    },
    restoreLoading: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    return () => (
      <div
        class={[
          'group flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors',
          props.isSelected
            ? 'bg-neutral-100 dark:bg-neutral-800'
            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/30',
        ]}
        onClick={props.onClick}
      >
        {/* 版本信息 */}
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              v{props.item.version}
            </span>
            {props.item.isCurrent && (
              <span class="rounded bg-neutral-200 px-1.5 py-0.5 text-xs text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                当前
              </span>
            )}
            {props.item.isFullSnapshot !== undefined && (
              <span
                class={[
                  'rounded px-1.5 py-0.5 text-xs',
                  props.item.isFullSnapshot
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
                ]}
                title={
                  props.item.isFullSnapshot
                    ? '全量快照，存储完整内容'
                    : '增量存储，仅保存与上一全量版本的差异'
                }
              >
                {props.item.isFullSnapshot ? '全量' : '增量'}
              </span>
            )}
            {props.item.refVersion !== undefined && (
              <span
                class="rounded bg-purple-100 px-1.5 py-0.5 text-xs text-purple-700 dark:bg-purple-900/50 dark:text-purple-400"
                title={`内容与 v${props.item.refVersion} 相同，无需存储`}
              >
                = v{props.item.refVersion}
              </span>
            )}
            {props.item.baseVersion !== undefined &&
              !props.item.isFullSnapshot && (
                <span
                  class="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400"
                  title={`基于 v${props.item.baseVersion} 的增量`}
                >
                  基于 v{props.item.baseVersion}
                </span>
              )}
            <span class="text-xs text-neutral-400 dark:text-neutral-500">
              <RelativeTime time={props.item.savedAt} />
            </span>
          </div>
          <p class="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
            {props.item.title || '无标题'}
          </p>
        </div>

        {/* 右侧：时间和恢复按钮 */}
        <div class="flex flex-shrink-0 items-center gap-2">
          {/* 恢复按钮 */}
          {!props.item.isCurrent && props.onRestore && (
            <NPopconfirm
              positiveText="取消"
              negativeText="恢复"
              onNegativeClick={props.onRestore}
            >
              {{
                trigger: () => (
                  <NTooltip>
                    {{
                      trigger: () => (
                        <NButton
                          size="tiny"
                          quaternary
                          loading={props.restoreLoading}
                          class="opacity-0 group-hover:opacity-100"
                          onClick={(e: MouseEvent) => e.stopPropagation()}
                        >
                          {{
                            icon: () => (
                              <RotateCcw class="h-3.5 w-3.5 text-neutral-500" />
                            ),
                          }}
                        </NButton>
                      ),
                      default: () => '恢复此版本',
                    }}
                  </NTooltip>
                ),
                default: () => (
                  <span>确定要恢复到版本 {props.item.version}？</span>
                ),
              }}
            </NPopconfirm>
          )}
        </div>
      </div>
    )
  },
})

export const DraftDetail = defineComponent({
  name: 'DraftDetail',
  props: {
    draft: {
      type: Object as PropType<DraftModel>,
      required: true,
    },
    isMobile: {
      type: Boolean,
      default: false,
    },
    onBack: {
      type: Function as PropType<() => void>,
    },
    onDelete: {
      type: Function as PropType<(id: string) => void>,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const config = computed(() => refTypeConfig[props.draft.refType])
    const { isMobile: isInnerMobile } = useMasterDetailLayout()

    // 内部面板状态：在移动端用于切换版本列表和 diff 预览
    const showDiffPanel = ref(false)

    // 选中的版本（用于与当前版本对比）
    const selectedVersion = ref<number | null>(null)
    const selectedContent = ref<string>('')
    const isLoadingContent = ref(false)

    // 获取版本历史
    const { data: historyData, isLoading: historyLoading } = useQuery({
      queryKey: ['drafts', 'history', () => props.draft.id],
      queryFn: () => draftsApi.getHistory(props.draft.id),
      select: (res: any) =>
        Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [],
    })

    // 构建版本列表
    const versionList = computed<VersionItem[]>(() => {
      if (!historyData.value) return []

      const sortedHistory = [
        ...(historyData.value as DraftHistoryListItem[]),
      ].sort((a, b) => b.version - a.version)

      return sortedHistory.map((item, index) => ({
        version: item.version,
        title: item.title,
        savedAt: item.savedAt,
        isCurrent: index === 0,
        isFullSnapshot: item.isFullSnapshot,
        refVersion: item.refVersion,
        baseVersion: item.baseVersion,
      }))
    })

    // 加载版本内容
    const loadVersionContent = async (version: number): Promise<string> => {
      if (version === props.draft.version) {
        return props.draft.text
      }

      try {
        const data = await draftsApi.getHistoryVersion(props.draft.id, version)
        return data.text
      } catch (error) {
        console.error('Failed to load version:', error)
        return ''
      }
    }

    // 初始化：默认选中第二个版本（如果有的话）
    watch(
      [() => props.draft.id, versionList],
      async ([, list]) => {
        if (list.length >= 2) {
          // 默认选中上一个版本
          const prevVersion = list[1]
          selectedVersion.value = prevVersion.version

          isLoadingContent.value = true
          selectedContent.value = await loadVersionContent(prevVersion.version)
          isLoadingContent.value = false
        } else {
          selectedVersion.value = null
          selectedContent.value = ''
        }
      },
      { immediate: true },
    )

    // 点击版本
    const handleSelectVersion = async (version: number) => {
      if (selectedVersion.value === version) {
        // 在移动端，如果点击已选中的版本，切换到 diff 面板
        if (isInnerMobile.value) {
          showDiffPanel.value = true
        }
        return
      }
      selectedVersion.value = version
      isLoadingContent.value = true
      selectedContent.value = await loadVersionContent(version)
      isLoadingContent.value = false

      // 在移动端，选中版本后自动切换到 diff 面板
      if (isInnerMobile.value) {
        showDiffPanel.value = true
      }
    }

    // 返回版本列表（移动端）
    const handleBackToVersionList = () => {
      showDiffPanel.value = false
    }

    // 恢复版本
    const restoreMutation = useMutation({
      mutationFn: (version: number) =>
        draftsApi.restoreVersion(props.draft.id, version),
      onSuccess: () => {
        toast.success('版本已恢复')
        queryClient.invalidateQueries({ queryKey: ['drafts'] })
      },
      onError: () => {
        toast.error('恢复失败')
      },
    })

    const handleRestore = (version: number) => {
      restoreMutation.mutate(version)
    }

    const handleEdit = () => {
      router.push({
        name: config.value.editRoute,
        query: { draftId: props.draft.id },
      })
    }

    // Diff 统计
    const diffStats = computed(() => {
      if (!selectedContent.value) return null
      const currentText = props.draft.text
      const diff = currentText.length - selectedContent.value.length
      return { diff, isSame: currentText === selectedContent.value }
    })

    // 当前版本
    const currentVersion = computed(() => versionList.value[0])

    // 选中的版本信息
    const selectedVersionInfo = computed(() =>
      versionList.value.find((v) => v.version === selectedVersion.value),
    )

    return () => (
      <div class="flex h-full flex-col">
        {/* 头部信息 */}
        <div class="flex h-12 flex-shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
          <div class="flex items-center gap-3">
            {props.isMobile && props.onBack && (
              <NButton quaternary circle size="small" onClick={props.onBack}>
                {{
                  icon: () => <ChevronLeft class="size-4" />,
                }}
              </NButton>
            )}
            <div class="flex flex-col">
              <h3 class="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                {props.draft.title || '无标题'}
              </h3>
              <div class="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <span>{config.value.label}</span>
                <span>·</span>
                <span>v{props.draft.version}</span>
                <span>·</span>
                <RelativeTime time={props.draft.updated} />
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <NButton size="small" onClick={handleEdit}>
              {{
                icon: () => <Pencil class="h-3.5 w-3.5" />,
                default: () => '编辑',
              }}
            </NButton>
            <NPopconfirm
              positiveText="取消"
              negativeText="删除"
              onNegativeClick={() => props.onDelete(props.draft.id)}
            >
              {{
                trigger: () => (
                  <NButton size="small" quaternary>
                    {{
                      icon: () => <Trash2 class="h-3.5 w-3.5 text-red-500" />,
                    }}
                  </NButton>
                ),
                default: () => (
                  <span class="max-w-48">
                    确定要删除草稿「{props.draft.title || '无标题'}」？
                  </span>
                ),
              }}
            </NPopconfirm>
          </div>
        </div>

        {/* 版本历史区域 */}
        <div class="min-h-0 flex-1">
          {historyLoading.value ? (
            <div class="flex h-full items-center justify-center">
              <NSpin size="large" />
            </div>
          ) : versionList.value.length === 0 ? (
            <div class="flex h-full items-center justify-center">
              <NEmpty description="暂无历史版本" />
            </div>
          ) : isInnerMobile.value ? (
            // 移动端布局：滑动切换
            <div class="relative h-full w-full overflow-hidden">
              {/* 版本列表面板 */}
              <div
                class={[
                  'absolute inset-0 w-full transition-transform duration-300',
                  showDiffPanel.value && '-translate-x-full',
                ]}
              >
                <div class="flex h-full flex-col bg-white dark:bg-neutral-900">
                  <div class="flex items-center gap-2 border-b border-neutral-200 px-4 py-2 dark:border-neutral-800">
                    <GitCompare class="size-4 text-neutral-500" />
                    <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      版本列表
                    </span>
                    <span class="text-xs text-neutral-400">
                      ({versionList.value.length})
                    </span>
                  </div>
                  <NScrollbar class="flex-1">
                    <div>
                      {versionList.value.map((item) => (
                        <VersionListItem
                          key={item.version}
                          item={item}
                          isSelected={selectedVersion.value === item.version}
                          onClick={() => handleSelectVersion(item.version)}
                          onRestore={
                            item.isCurrent
                              ? undefined
                              : () => handleRestore(item.version)
                          }
                          restoreLoading={restoreMutation.isPending.value}
                        />
                      ))}
                    </div>
                  </NScrollbar>
                </div>
              </div>

              {/* Diff 预览面板 */}
              <div
                class={[
                  'absolute inset-0 w-full transition-transform duration-300',
                  !showDiffPanel.value && 'translate-x-full',
                ]}
              >
                <div class="flex h-full flex-col bg-neutral-50 dark:bg-neutral-950">
                  {/* Diff 头部 - 带返回按钮 */}
                  <div class="flex flex-shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 py-2 dark:border-neutral-800 dark:bg-neutral-900">
                    <div class="flex items-center gap-2">
                      <NButton
                        quaternary
                        circle
                        size="small"
                        onClick={handleBackToVersionList}
                      >
                        {{
                          icon: () => <ChevronLeft class="size-4" />,
                        }}
                      </NButton>
                      <div class="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                        {selectedVersionInfo.value && (
                          <>
                            <span>v{selectedVersion.value}</span>
                            <span class="text-neutral-400">→</span>
                            <span>v{currentVersion.value?.version} (当前)</span>
                          </>
                        )}
                      </div>
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

                  {/* Diff 内容 */}
                  <div class="min-h-0 flex-1 overflow-hidden">
                    {isLoadingContent.value ? (
                      <div class="flex h-full items-center justify-center">
                        <NSpin />
                      </div>
                    ) : diffStats.value?.isSame ? (
                      <div class="flex h-full flex-col items-center justify-center gap-3 bg-white p-4 dark:bg-neutral-900">
                        <div class="flex size-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                          <GitCompare class="size-6 text-neutral-500 dark:text-neutral-400" />
                        </div>
                        <div class="text-center">
                          <p class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            与当前版本内容相同
                          </p>
                        </div>
                      </div>
                    ) : selectedContent.value ? (
                      <div class="h-full overflow-hidden">
                        <DiffPreview
                          oldFile={{
                            name: `v${selectedVersion.value}.md`,
                            contents: selectedContent.value,
                          }}
                          newFile={{
                            name: `v${currentVersion.value?.version}.md`,
                            contents: props.draft.text,
                          }}
                        />
                      </div>
                    ) : (
                      <div class="flex h-full flex-col items-center justify-center gap-3 bg-white p-4 dark:bg-neutral-900">
                        <p class="text-sm text-neutral-500 dark:text-neutral-400">
                          无法加载版本内容
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // 桌面端布局：Split Panel
            <NSplit
              direction="horizontal"
              defaultSize={'300px'}
              min={'200px'}
              max={'300px'}
              class="h-full"
            >
              {{
                1: () => (
                  <div class="flex h-full flex-col border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                    <div class="flex h-10 items-center gap-2 border-b border-neutral-200 px-4 dark:border-neutral-800">
                      <GitCompare class="size-4 text-neutral-500" />
                      <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        版本列表
                      </span>
                      <span class="text-xs text-neutral-400">
                        ({versionList.value.length})
                      </span>
                    </div>
                    <NScrollbar class="flex-1">
                      <div>
                        {versionList.value.map((item) => (
                          <VersionListItem
                            key={item.version}
                            item={item}
                            isSelected={selectedVersion.value === item.version}
                            onClick={() => handleSelectVersion(item.version)}
                            onRestore={
                              item.isCurrent
                                ? undefined
                                : () => handleRestore(item.version)
                            }
                            restoreLoading={restoreMutation.isPending.value}
                          />
                        ))}
                      </div>
                    </NScrollbar>
                  </div>
                ),
                2: () => (
                  <div class="flex h-full flex-col bg-neutral-50 dark:bg-neutral-950">
                    {/* Diff 头部 */}
                    <div class="flex h-10 flex-shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-900">
                      <div class="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                        {selectedVersionInfo.value && (
                          <>
                            <span>v{selectedVersion.value}</span>
                            <span class="text-neutral-400">→</span>
                            <span>v{currentVersion.value?.version} (当前)</span>
                          </>
                        )}
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

                    {/* Diff 内容 */}
                    <div class="min-h-0 flex-1 overflow-hidden">
                      {isLoadingContent.value ? (
                        <div class="flex h-full items-center justify-center">
                          <NSpin />
                        </div>
                      ) : !selectedVersion.value ? (
                        <div class="flex h-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-900">
                          <div class="flex size-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                            <GitCompare class="size-6 text-neutral-500 dark:text-neutral-400" />
                          </div>
                          <p class="text-sm text-neutral-500 dark:text-neutral-400">
                            选择一个历史版本查看差异
                          </p>
                        </div>
                      ) : diffStats.value?.isSame ? (
                        <div class="flex h-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-900">
                          <div class="flex size-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                            <GitCompare class="size-6 text-neutral-500 dark:text-neutral-400" />
                          </div>
                          <div class="text-center">
                            <p class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                              与当前版本内容相同
                            </p>
                            <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                              选择其他版本进行对比
                            </p>
                          </div>
                        </div>
                      ) : selectedContent.value ? (
                        <div class="h-full overflow-hidden rounded-lg">
                          <DiffPreview
                            oldFile={{
                              name: `v${selectedVersion.value}.md`,
                              contents: selectedContent.value,
                            }}
                            newFile={{
                              name: `v${currentVersion.value?.version}.md`,
                              contents: props.draft.text,
                            }}
                          />
                        </div>
                      ) : (
                        <div class="flex h-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-900">
                          <p class="text-sm text-neutral-500 dark:text-neutral-400">
                            无法加载版本内容
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ),
                'resize-trigger': () => (
                  <div class="group relative h-full w-0 cursor-col-resize">
                    <div class="absolute left-1/2 top-1/2 z-[10] h-8 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-300 transition-colors group-hover:bg-neutral-400 dark:bg-neutral-700 dark:group-hover:bg-neutral-600" />
                  </div>
                ),
              }}
            </NSplit>
          )}
        </div>
      </div>
    )
  },
})
