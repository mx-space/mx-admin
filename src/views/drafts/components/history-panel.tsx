import { RotateCcw } from 'lucide-vue-next'
import {
  NButton,
  NDrawer,
  NDrawerContent,
  NEmpty,
  NPopconfirm,
  NSpin,
  useMessage,
} from 'naive-ui'
import { defineComponent } from 'vue'
import type { PropType } from 'vue'

import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import { draftsApi } from '~/api/drafts'
import { RelativeTime } from '~/components/time/relative-time'

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
    const message = useMessage()
    const queryClient = useQueryClient()

    // 获取版本历史
    const { data, isLoading } = useQuery({
      queryKey: ['drafts', 'history', props.draftId],
      queryFn: () => draftsApi.getHistory(props.draftId),
      enabled: () => props.show,
      select: (res: any) =>
        Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [],
    })

    // 恢复版本
    const restoreMutation = useMutation({
      mutationFn: (version: number) =>
        draftsApi.restoreVersion(props.draftId, version),
      onSuccess: () => {
        message.success('版本已恢复')
        queryClient.invalidateQueries({ queryKey: ['drafts'] })
        props.onUpdateShow(false)
      },
      onError: () => {
        message.error('恢复失败')
      },
    })

    const handleRestore = (version: number) => {
      restoreMutation.mutate(version)
    }

    return () => (
      <NDrawer
        show={props.show}
        onUpdateShow={props.onUpdateShow}
        width={360}
        placement="right"
      >
        <NDrawerContent title="版本历史" closable>
          {isLoading.value ? (
            <div class="flex items-center justify-center py-8">
              <NSpin />
            </div>
          ) : !data.value || data.value.length === 0 ? (
            <NEmpty description="暂无历史版本" />
          ) : (
            <div class="space-y-3">
              {data.value.map((item, index) => (
                <div
                  key={item.version}
                  class={[
                    'rounded-lg border p-3',
                    index === 0
                      ? 'border-neutral-300 bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800'
                      : 'border-neutral-200 dark:border-neutral-700',
                  ]}
                >
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          版本 {item.version}
                        </span>
                        {index === 0 && (
                          <span class="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
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
                    {index !== 0 && (
                      <NPopconfirm
                        positiveText="取消"
                        negativeText="恢复"
                        onNegativeClick={() => handleRestore(item.version)}
                      >
                        {{
                          trigger: () => (
                            <NButton
                              size="tiny"
                              quaternary
                              loading={restoreMutation.isPending.value}
                            >
                              {{
                                icon: () => <RotateCcw class="h-3.5 w-3.5" />,
                                default: () => '恢复',
                              }}
                            </NButton>
                          ),
                          default: () => (
                            <span>确定要恢复到版本 {item.version}？</span>
                          ),
                        }}
                      </NPopconfirm>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </NDrawerContent>
      </NDrawer>
    )
  },
})
