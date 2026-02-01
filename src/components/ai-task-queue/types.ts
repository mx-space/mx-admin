import type { AITaskStatus, AITaskType } from '~/api/ai'

export interface SubTaskStats {
  total: number
  completed: number
  failed: number
  running: number
  pending: number
}

export interface TrackedTask {
  id: string
  type: AITaskType
  status: AITaskStatus
  label: string
  progress?: number
  progressMessage?: string
  tokensGenerated?: number
  error?: string
  createdAt: number
  onComplete?: () => void
  retryFn?: () => Promise<{ taskId: string; created: boolean }>
  // For batch tasks: track sub-task progress
  subTaskStats?: SubTaskStats
}

export interface AiTaskQueueState {
  tasks: TrackedTask[]
  visible: boolean
}
