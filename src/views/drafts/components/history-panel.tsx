import { GitCompare, RotateCcw } from 'lucide-vue-next'
import {
  NButton,
  NDrawer,
  NDrawerContent,
  NEmpty,
  NPopconfirm,
  NSpin,
  NTooltip,
} from 'naive-ui'
import { defineComponent, ref } from 'vue'
import { toast } from 'vue-sonner'
import type { PropType } from 'vue'

import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import { draftsApi } from '~/api/drafts'
import { RelativeTime } from '~/components/time/relative-time'

import { HistoryDiffModal } from './history-diff-modal'

export const HistoryPanel = defineComponent({
  name: 'HistoryPanel',
  props: {
    draftId: {
      type: String,
      required: true,
    },
    show: {
      type: Boolean,
      default: false,
    },
    onUpdateShow: {
      type: Function as PropType<(show: boolean) => void>,
      required: true,
    },
  },
  setup(props) {
    const queryClient = useQueryClient()
    const showDiffModal = ref(false)
    const diffCompareVersion = ref<number | undefined>(undefined)

    // 获取版本历史
    const { data: historyData, isLoading } = useQuery({
      queryKey: ['drafts', 'history', props.draftId],
      queryFn: () => draftsApi.getHistory(props.draftId),
      enabled: () => props.show,
      select: (res: any) =>
        Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [],
    })

    // 获取当前草稿详情（用于 diff）
    const { data: currentDraft } = useQuery({
      queryKey: ['drafts', 'detail', props.draftId],
      queryFn: () => draftsApi.getById(props.draftId),
      enabled: () => props.show,
    })

    // 恢复版本
    const restoreMutation = useMutation({
      mutationFn: (version: number) =>
        draftsApi.restoreVersion(props.draftId, version),
      onSuccess: () => {
        toast.success('版本已恢复')
        queryClient.invalidateQueries({ queryKey: ['drafts'] })
        props.onUpdateShow(false)
      },
      onError: () => {
        toast.error('恢复失败')
      },
    })

    const handleRestore = (version: number) => {
      restoreMutation.mutate(version)
    }

    const handleShowDiff = (version?: number) => {
      diffCompareVersion.value = version
      showDiffModal.value = true
    }

    return () => (
      <>
        <NDrawer
          show={props.show}
          onUpdateShow={props.onUpdateShow}
          width={400}
          placement="right"
        >
          <NDrawerContent title="版本历史" closable>
            {{
              default: () =>
                isLoading.value ? (
                  <div class="flex items-center justify-center py-8">
                    <NSpin />
                  </div>
                ) : !historyData.value || historyData.value.length === 0 ? (
                  <NEmpty description="暂无历史版本" />
                ) : (
                  <div class="space-y-3">
                    {historyData.value.map((item, index) => (
                      <div
                        key={item.version}
                        class={[
                          'group rounded-lg border p-3 transition-colors',
                          index === 0
                            ? 'border-neutral-300 bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800'
                            : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600',
                        ]}
                      >
                        <div class="flex items-start justify-between gap-2">
                          <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-2">
                              <span class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                版本 {item.version}
                              </span>
                              {index === 0 && (
                                <span class="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                                  当前
                                </span>
                              )}
                            </div>
                            <p class="mt-1 truncate text-xs text-neutral-500 dark:text-neutral-400">
                              {item.title || '无标题'}
                            </p>
                            <p class="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
                              <RelativeTime time={item.savedAt} />
                            </p>
                          </div>
                          <div class="flex flex-shrink-0 items-center gap-1">
                            {/* Diff 按钮 */}
                            <NTooltip>
                              {{
                                trigger: () => (
                                  <NButton
                                    size="tiny"
                                    quaternary
                                    onClick={() => handleShowDiff(item.version)}
                                  >
                                    {{
                                      icon: () => (
                                        <GitCompare class="h-3.5 w-3.5 text-neutral-500" />
                                      ),
                                    }}
                                  </NButton>
                                ),
                                default: () => '查看差异',
                              }}
                            </NTooltip>

                            {/* 恢复按钮 - 仅非当前版本显示 */}
                            {index !== 0 && (
                              <NPopconfirm
                                positiveText="取消"
                                negativeText="恢复"
                                onNegativeClick={() =>
                                  handleRestore(item.version)
                                }
                              >
                                {{
                                  trigger: () => (
                                    <NTooltip>
                                      {{
                                        trigger: () => (
                                          <NButton
                                            size="tiny"
                                            quaternary
                                            loading={
                                              restoreMutation.isPending.value
                                            }
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
                                    <span>
                                      确定要恢复到版本 {item.version}？
                                    </span>
                                  ),
                                }}
                              </NPopconfirm>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ),
              footer: () =>
                historyData.value &&
                historyData.value.length > 1 && (
                  <div class="flex justify-center">
                    <NButton
                      size="small"
                      tertiary
                      onClick={() => handleShowDiff()}
                    >
                      {{
                        icon: () => <GitCompare class="h-4 w-4" />,
                        default: () => '比较任意版本',
                      }}
                    </NButton>
                  </div>
                ),
            }}
          </NDrawerContent>
        </NDrawer>

        {/* Diff Modal */}
        <HistoryDiffModal
          show={showDiffModal.value}
          draftId={props.draftId}
          currentDraft={currentDraft.value ?? null}
          historyList={historyData.value ?? []}
          initialCompareVersion={diffCompareVersion.value}
          onClose={() => (showDiffModal.value = false)}
        />
      </>
    )
  },
})
