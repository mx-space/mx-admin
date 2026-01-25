import { computed, reactive, ref } from 'vue'
import type { UploadTask } from './types'

const state = reactive<{
  tasks: UploadTask[]
}>({
  tasks: [],
})

const visible = ref(false)
let hideTimer: ReturnType<typeof setTimeout> | null = null

export function useUploadQueue() {
  const addTasks = (tasks: Omit<UploadTask, 'status'>[]) => {
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
    state.tasks = tasks.map((task) => ({
      ...task,
      status: 'pending' as const,
    }))
    visible.value = true
  }

  const updateTask = (id: string, updates: Partial<UploadTask>) => {
    const task = state.tasks.find((t) => t.id === id)
    if (task) {
      Object.assign(task, updates)
    }
  }

  const clearTasks = () => {
    state.tasks = []
    visible.value = false
  }

  const hideWithDelay = (delay = 3000) => {
    if (hideTimer) {
      clearTimeout(hideTimer)
    }
    hideTimer = setTimeout(() => {
      visible.value = false
      hideTimer = null
    }, delay)
  }

  const isProcessing = computed(() =>
    state.tasks.some((t) => t.status === 'pending' || t.status === 'uploading'),
  )

  const progress = computed(() => {
    const total = state.tasks.length
    const completed = state.tasks.filter(
      (t) => t.status === 'success' || t.status === 'error',
    ).length
    return { completed, total }
  })

  const successCount = computed(
    () => state.tasks.filter((t) => t.status === 'success').length,
  )

  const errorCount = computed(
    () => state.tasks.filter((t) => t.status === 'error').length,
  )

  return {
    tasks: computed(() => state.tasks),
    visible: computed(() => visible.value),
    isProcessing,
    progress,
    successCount,
    errorCount,
    addTasks,
    updateTask,
    clearTasks,
    hideWithDelay,
  }
}
