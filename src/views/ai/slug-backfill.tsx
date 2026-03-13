import { Loader2 as LoaderIcon, Play as PlayIcon } from 'lucide-vue-next'
import { NButton, NCard, NDataTable, NEmpty, NSpin, NTag } from 'naive-ui'
import { computed, defineComponent, ref } from 'vue'
import { toast } from 'vue-sonner'
import type { DataTableColumns } from 'naive-ui'

import { useQuery, useQueryClient } from '@tanstack/vue-query'

import { aiApi, AITaskType } from '~/api/ai'
import { useAiTaskQueue } from '~/components/ai-task-queue/use-ai-task-queue'
import { queryKeys } from '~/hooks/queries/keys'

interface NoteWithoutSlug {
  _id: string
  title: string
  nid: number
}

export default defineComponent({
  name: 'AISlugBackfillPage',
  setup() {
    const queryClient = useQueryClient()
    const taskQueue = useAiTaskQueue()
    const submitting = ref(false)

    const { data, isPending, refetch } = useQuery({
      queryKey: computed(() => [...queryKeys.ai.all, 'slug-backfill-status']),
      queryFn: () => aiApi.getSlugBackfillStatus(),
    })

    const count = computed(() => data.value?.count ?? 0)
    const notes = computed<NoteWithoutSlug[]>(() => data.value?.notes ?? [])

    const columns: DataTableColumns<NoteWithoutSlug> = [
      {
        title: 'NID',
        key: 'nid',
        width: 80,
      },
      {
        title: '标题',
        key: 'title',
        ellipsis: { tooltip: true },
      },
    ]

    const handleBackfill = async () => {
      if (count.value === 0) {
        toast.info('没有需要回填的日记')
        return
      }

      submitting.value = true
      try {
        const result = await aiApi.createSlugBackfillTask()
        taskQueue.trackTask({
          taskId: result.taskId,
          type: AITaskType.SlugBackfill,
          label: `Slug 回填 (${count.value} 篇)`,
          onComplete: () => {
            refetch()
            queryClient.invalidateQueries({ queryKey: queryKeys.ai.tasks() })
          },
        })
        toast.success(result.created ? '任务已创建' : '任务已存在')
      } catch {
        toast.error('创建任务失败')
      } finally {
        submitting.value = false
      }
    }

    return () => (
      <div class="mx-auto max-w-3xl p-6">
        <NCard title="Note Slug 回填">
          {{
            'header-extra': () => (
              <NTag type={count.value > 0 ? 'warning' : 'success'}>
                {isPending.value ? '...' : `${count.value} 篇待回填`}
              </NTag>
            ),
            default: () => (
              <div class="space-y-4">
                <p class="text-sm opacity-70">
                  通过 AI 为历史日记自动生成 slug，用于 SEO 友好的路由。
                </p>

                {isPending.value ? (
                  <div class="flex justify-center py-8">
                    <NSpin />
                  </div>
                ) : count.value === 0 ? (
                  <NEmpty description="所有日记已有 slug" />
                ) : (
                  <NDataTable
                    columns={columns}
                    data={notes.value}
                    maxHeight={400}
                    scrollX={300}
                    size="small"
                  />
                )}
              </div>
            ),
            action: () => (
              <div class="flex justify-end">
                <NButton
                  type="primary"
                  disabled={count.value === 0 || submitting.value}
                  loading={submitting.value}
                  onClick={handleBackfill}
                >
                  {{
                    icon: () =>
                      submitting.value ? (
                        <LoaderIcon class="animate-spin" />
                      ) : (
                        <PlayIcon />
                      ),
                    default: () => `开始回填 (${count.value})`,
                  }}
                </NButton>
              </div>
            ),
          }}
        </NCard>
      </div>
    )
  },
})
