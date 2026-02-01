import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-vue-next'
import { NProgress } from 'naive-ui'
import { defineComponent } from 'vue'
import type { TrackedTask } from './types'

import { AITaskStatus, AITaskType } from '~/api/ai'
import { TaskQueuePanel } from '~/components/task-queue-panel'

import { useAiTaskQueue } from './use-ai-task-queue'

const TaskTypeLabels: Record<AITaskType, string> = {
  [AITaskType.Summary]: '摘要',
  [AITaskType.Translation]: '翻译',
  [AITaskType.TranslationBatch]: '批量翻译',
  [AITaskType.TranslationAll]: '全量翻译',
}

const ITEM_HEIGHT = 56

function isBatchTask(type: AITaskType): boolean {
  return (
    type === AITaskType.TranslationBatch || type === AITaskType.TranslationAll
  )
}

const TaskItem = defineComponent({
  props: {
    task: {
      type: Object as () => TrackedTask,
      required: true,
    },
    onRetry: {
      type: Function as unknown as () => (taskId: string) => void,
    },
  },
  setup(props) {
    return () => {
      const task = props.task
      const stats = task.subTaskStats
      const hasBatchSubTasks = isBatchTask(task.type) && stats

      // For batch tasks with active sub-tasks, show as running
      const hasActiveSubTasks =
        hasBatchSubTasks && (stats.pending > 0 || stats.running > 0)

      const isFailed =
        task.status === AITaskStatus.Failed ||
        task.status === AITaskStatus.Cancelled
      const isPartialFailed = task.status === AITaskStatus.PartialFailed
      const isRunning =
        task.status === AITaskStatus.Running || hasActiveSubTasks
      const isCompleted =
        (task.status === AITaskStatus.Completed ||
          task.status === AITaskStatus.PartialFailed) &&
        !hasActiveSubTasks
      const canRetry = isFailed && task.retryFn

      const getStatusIcon = () => {
        if (task.status === AITaskStatus.Pending)
          return <Clock class="size-4 text-neutral-400" />
        if (isRunning)
          return <Loader2 class="size-4 animate-spin text-blue-500" />
        if (isPartialFailed)
          return <AlertTriangle class="size-4 text-yellow-500" />
        if (isCompleted) return <CheckCircle2 class="size-4 text-green-500" />
        if (isFailed) return <AlertCircle class="size-4 text-red-500" />
        return <Clock class="size-4 text-neutral-400" />
      }

      // Calculate progress for batch tasks
      const progressInfo = hasBatchSubTasks
        ? {
            percent: Math.round(
              ((stats.completed + stats.failed) / stats.total) * 100,
            ),
            text: `${stats.completed + stats.failed}/${stats.total}`,
          }
        : task.progress !== undefined
          ? { percent: task.progress, text: `${task.progress}%` }
          : null

      return (
        <div
          class="group flex items-center gap-3 border-b border-neutral-100 px-1 dark:border-neutral-800"
          style={{ height: `${ITEM_HEIGHT}px` }}
        >
          {/* Status Icon */}
          <div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-neutral-50 dark:bg-neutral-800">
            {getStatusIcon()}
          </div>

          {/* Content */}
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span
                class={[
                  'truncate text-sm font-medium',
                  isFailed
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-neutral-800 dark:text-neutral-100',
                ]}
                title={task.label}
              >
                {task.label}
              </span>
            </div>
            <div class="mt-0.5 flex h-5 items-center gap-2">
              <span class="shrink-0 text-xs text-neutral-400">
                {TaskTypeLabels[task.type] || task.type}
              </span>
              {isRunning && progressInfo && (
                <>
                  <span class="text-neutral-300 dark:text-neutral-600">·</span>
                  <span class="text-xs text-blue-500">{progressInfo.text}</span>
                </>
              )}
              {isRunning &&
                !hasBatchSubTasks &&
                task.tokensGenerated !== undefined &&
                task.tokensGenerated > 0 && (
                  <>
                    <span class="text-neutral-300 dark:text-neutral-600">
                      ·
                    </span>
                    <span class="text-xs tabular-nums text-blue-500">
                      {task.tokensGenerated} tokens
                    </span>
                  </>
                )}
              {isFailed && task.error && (
                <>
                  <span class="text-neutral-300 dark:text-neutral-600">·</span>
                  <span
                    class="truncate text-xs text-red-500"
                    title={task.error}
                  >
                    {task.error}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Progress bar for running tasks */}
          {isRunning && progressInfo && (
            <div class="w-16 shrink-0">
              <NProgress
                type="line"
                percentage={progressInfo.percent}
                showIndicator={false}
                height={4}
                borderRadius={2}
              />
            </div>
          )}

          {/* Retry button */}
          {canRetry && (
            <button
              class="shrink-0 rounded-md p-1.5 text-neutral-400 opacity-0 transition-all hover:bg-neutral-100 hover:text-neutral-600 group-hover:opacity-100 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
              onClick={() => props.onRetry?.(task.id)}
              title="重试"
            >
              <RefreshCw class="size-4" />
            </button>
          )}
        </div>
      )
    }
  },
})

// Mock data for preview
// const mockTasks: TrackedTask[] = [
//   {
//     id: '1',
//     type: AITaskType.Summary,
//     status: AITaskStatus.Completed,
//     label: '如何使用 Vue 3 构建现代化应用',
//     createdAt: Date.now() - 60000,
//   },
//   {
//     id: '2',
//     type: AITaskType.Translation,
//     status: AITaskStatus.Running,
//     label: 'TypeScript 高级类型系统详解',
//     progress: 65,
//     progressMessage: '正在翻译第 3/5 段...',
//     createdAt: Date.now() - 30000,
//   },
//   {
//     id: '3',
//     type: AITaskType.TranslationBatch,
//     status: AITaskStatus.Pending,
//     label: '批量翻译 (8 篇)',
//     createdAt: Date.now() - 10000,
//   },
//   {
//     id: '4',
//     type: AITaskType.Translation,
//     status: AITaskStatus.Failed,
//     label: 'React vs Vue 性能对比分析',
//     error: 'API 请求超时，请稍后重试',
//     createdAt: Date.now() - 120000,
//     retryFn: async () => ({ taskId: '4-retry', created: true }),
//   },
//   {
//     id: '5',
//     type: AITaskType.Summary,
//     status: AITaskStatus.Completed,
//     label: '前端工程化最佳实践',
//     createdAt: Date.now() - 90000,
//   },
// ]

export const AiTaskQueue = defineComponent({
  name: 'AiTaskQueue',
  setup() {
    const queue = useAiTaskQueue()

    const handleClose = () => {
      if (!queue.isProcessing.value) {
        queue.clearAll()
      } else {
        queue.hide()
      }
    }

    const handleRetry = (taskId: string) => {
      queue.retryTask(taskId)
    }

    return () => {
      const tasks = queue.tasks.value
      const isProcessing = queue.isProcessing.value
      const progress = queue.progress.value
      const completedCount = queue.completedCount.value
      const failedCount = queue.failedCount.value

      return (
        <TaskQueuePanel
          visible
          isProcessing={isProcessing}
          tasks={tasks}
          closeTitle={isProcessing ? '隐藏' : '关闭'}
          showCloseWhenProcessing
          onClose={handleClose}
        >
          {{
            icon: () => (
              <Sparkles class="size-3.5 text-neutral-600 dark:text-neutral-300" />
            ),
            title: () => (
              <>
                AI 任务
                <span class="ml-1.5 text-neutral-400">
                  {progress.completed}/{progress.total}
                </span>
              </>
            ),
            item: ({ task }: { task: TrackedTask }) => (
              <TaskItem task={task} onRetry={handleRetry} />
            ),
            footer: () =>
              !isProcessing && tasks.length > 0 ? (
                <div class="flex items-center justify-between border-t border-neutral-100 px-4 py-2.5 text-xs dark:border-neutral-800">
                  <div class="text-neutral-400">
                    {completedCount > 0 && (
                      <span class="text-green-600 dark:text-green-400">
                        {completedCount} 成功
                      </span>
                    )}
                    {failedCount > 0 && (
                      <span class="ml-2 text-red-600 dark:text-red-400">
                        {failedCount} 失败
                      </span>
                    )}
                  </div>
                  <button
                    class="text-neutral-500 transition-colors hover:text-neutral-700 dark:hover:text-neutral-300"
                    onClick={() => queue.clearCompleted()}
                  >
                    清除
                  </button>
                </div>
              ) : null,
          }}
        </TaskQueuePanel>
      )
    }
  },
})
