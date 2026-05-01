import { computed, reactive, ref } from 'vue'
import type { SubTaskStats, TrackedTask } from './types'

import { aiApi, AITaskStatus, AITaskType } from '~/api/ai'

const state = reactive<{
  tasks: TrackedTask[]
}>({
  tasks: [],
})

const visible = ref(false)
let pollTimer: ReturnType<typeof setInterval> | null = null

const POLL_INTERVAL = 2000

function isBatchTask(type: AITaskType): boolean {
  return (
    type === AITaskType.TranslationBatch || type === AITaskType.TranslationAll
  )
}

async function fetchSubTaskStats(taskId: string): Promise<SubTaskStats | null> {
  try {
    const subTasks = await aiApi.getTasksByGroupId(taskId)
    if (!subTasks.length) return null
    return {
      total: subTasks.length,
      completed: subTasks.filter((t) => t.status === AITaskStatus.Completed)
        .length,
      failed: subTasks.filter((t) => t.status === AITaskStatus.Failed).length,
      running: subTasks.filter((t) => t.status === AITaskStatus.Running).length,
      pending: subTasks.filter((t) => t.status === AITaskStatus.Pending).length,
    }
  } catch {
    return null
  }
}

function startPolling() {
  if (pollTimer) return

  pollTimer = setInterval(async () => {
    // Check if there are any active tasks or batch tasks with incomplete sub-tasks
    const hasActiveTasks = state.tasks.some(
      (t) =>
        t.status === AITaskStatus.Pending || t.status === AITaskStatus.Running,
    )

    const hasActiveBatchSubTasks = state.tasks.some((t) => {
      if (!isBatchTask(t.type)) return false
      if (!t.subTaskStats) return t.status === AITaskStatus.Completed
      return t.subTaskStats.pending > 0 || t.subTaskStats.running > 0
    })

    if (!hasActiveTasks && !hasActiveBatchSubTasks) {
      stopPolling()
      return
    }

    for (const task of state.tasks) {
      // Poll active tasks
      if (
        task.status === AITaskStatus.Pending ||
        task.status === AITaskStatus.Running
      ) {
        try {
          const result = await aiApi.getTask(task.id)
          const oldStatus = task.status
          task.status = result.status
          task.progress = result.progress
          task.progressMessage = result.progressMessage
          task.tokensGenerated = result.tokensGenerated
          task.error = result.error

          if (
            oldStatus !== result.status &&
            (result.status === AITaskStatus.Completed ||
              result.status === AITaskStatus.Failed)
          ) {
            // For batch tasks, start tracking sub-tasks
            if (
              isBatchTask(task.type) &&
              result.status === AITaskStatus.Completed
            ) {
              task.subTaskStats =
                (await fetchSubTaskStats(task.id)) ?? undefined
            }
            task.onComplete?.()
          }
        } catch {
          // Ignore individual task fetch errors
        }
      }

      // Poll sub-task stats for completed batch tasks
      if (
        isBatchTask(task.type) &&
        task.status === AITaskStatus.Completed &&
        task.subTaskStats &&
        (task.subTaskStats.pending > 0 || task.subTaskStats.running > 0)
      ) {
        task.subTaskStats = (await fetchSubTaskStats(task.id)) ?? undefined
      }
    }
  }, POLL_INTERVAL)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

export function useAiTaskQueue() {
  const trackTask = (taskInfo: {
    taskId: string
    type: AITaskType
    label: string
    onComplete?: () => void
    retryFn?: () => Promise<{ taskId: string; created: boolean }>
  }) => {
    const existing = state.tasks.find((t) => t.id === taskInfo.taskId)
    if (existing) return

    state.tasks.push({
      id: taskInfo.taskId,
      type: taskInfo.type,
      status: AITaskStatus.Pending,
      label: taskInfo.label,
      createdAt: Date.now(),
      onComplete: taskInfo.onComplete,
      retryFn: taskInfo.retryFn,
    })
    visible.value = true
    startPolling()
  }

  const retryTask = async (taskId: string) => {
    const task = state.tasks.find((t) => t.id === taskId)
    if (!task || !task.retryFn) return

    if (
      task.status !== AITaskStatus.Failed &&
      task.status !== AITaskStatus.Cancelled
    ) {
      return
    }

    try {
      const result = await task.retryFn()
      if (result.created) {
        // Update the task with new ID and reset status
        task.id = result.taskId
        task.status = AITaskStatus.Pending
        task.error = undefined
        task.progress = undefined
        task.progressMessage = undefined
        startPolling()
      }
    } catch (error) {
      task.error =
        error instanceof Error ? error.message : 'Failed to retry task'
    }
  }

  const removeTask = (id: string) => {
    const idx = state.tasks.findIndex((t) => t.id === id)
    if (idx !== -1) {
      state.tasks.splice(idx, 1)
    }
    if (state.tasks.length === 0) {
      visible.value = false
    }
  }

  const clearCompleted = () => {
    state.tasks = state.tasks.filter(
      (t) =>
        t.status !== AITaskStatus.Completed &&
        t.status !== AITaskStatus.Failed &&
        t.status !== AITaskStatus.Cancelled,
    )
    if (state.tasks.length === 0) {
      visible.value = false
    }
  }

  const clearAll = () => {
    stopPolling()
    state.tasks = []
    visible.value = false
  }

  const hide = () => {
    visible.value = false
  }

  const show = () => {
    if (state.tasks.length > 0) {
      visible.value = true
    }
  }

  const activeCount = computed(
    () =>
      state.tasks.filter(
        (t) =>
          t.status === AITaskStatus.Pending ||
          t.status === AITaskStatus.Running,
      ).length,
  )

  const completedCount = computed(
    () => state.tasks.filter((t) => t.status === AITaskStatus.Completed).length,
  )

  const failedCount = computed(
    () => state.tasks.filter((t) => t.status === AITaskStatus.Failed).length,
  )

  // Consider batch tasks with active sub-tasks as processing
  const isProcessing = computed(() => {
    if (activeCount.value > 0) return true
    // Check if any batch task has active sub-tasks
    return state.tasks.some((t) => {
      if (!isBatchTask(t.type) || !t.subTaskStats) return false
      return t.subTaskStats.pending > 0 || t.subTaskStats.running > 0
    })
  })

  const progress = computed(() => {
    let total = 0
    let completed = 0

    for (const task of state.tasks) {
      // For batch tasks with sub-task stats, count sub-tasks
      if (isBatchTask(task.type) && task.subTaskStats) {
        total += task.subTaskStats.total
        completed += task.subTaskStats.completed + task.subTaskStats.failed
      } else {
        total += 1
        if (
          task.status === AITaskStatus.Completed ||
          task.status === AITaskStatus.Failed ||
          task.status === AITaskStatus.Cancelled
        ) {
          completed += 1
        }
      }
    }

    return { completed, total }
  })

  return {
    tasks: computed(() => state.tasks),
    visible: computed(() => visible.value),
    isProcessing,
    progress,
    activeCount,
    completedCount,
    failedCount,
    trackTask,
    retryTask,
    removeTask,
    clearCompleted,
    clearAll,
    hide,
    show,
  }
}
