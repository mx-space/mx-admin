import { request } from '~/utils/request'

export enum CronTaskType {
  CleanAccessRecord = 'cron:clean-access-record',
  ResetIPAccess = 'cron:reset-ip-access',
  ResetLikedOrReadArticleRecord = 'cron:reset-liked-or-read',
  CleanTempDirectory = 'cron:clean-temp-directory',
  PushToBaiduSearch = 'cron:push-to-baidu-search',
  PushToBingSearch = 'cron:push-to-bing-search',
  DeleteExpiredJWT = 'cron:delete-expired-jwt',
  CleanupOrphanImages = 'cron:cleanup-orphan-images',
  SyncPublishedImagesToS3 = 'cron:sync-published-images-to-s3',
}

export enum CronTaskStatus {
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  PartialFailed = 'partial_failed',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

export interface CronTaskDefinition {
  type: CronTaskType
  name: string
  description: string
  cronExpression: string
  lastDate?: string | null
  nextDate?: string | null
}

export interface CronTaskLog {
  timestamp: number
  level: 'info' | 'warn' | 'error'
  message: string
}

export interface CronTask {
  id: string
  type: CronTaskType
  status: CronTaskStatus
  payload: Record<string, unknown>

  progress?: number
  progressMessage?: string

  createdAt: number
  startedAt?: number
  completedAt?: number

  result?: unknown
  error?: string
  logs: CronTaskLog[]

  workerId?: string
  retryCount: number
}

export interface CronTasksResponse {
  data: CronTask[]
  total: number
}

export interface CreateTaskResponse {
  taskId: string
  created: boolean
}

export const cronTaskApi = {
  getDefinitions: () => request.get<CronTaskDefinition[]>('/cron-task'),

  getTasks: (params?: {
    status?: CronTaskStatus
    type?: CronTaskType
    page?: number
    size?: number
  }) => request.get<CronTasksResponse>('/cron-task/tasks', { params }),

  getTask: (taskId: string) =>
    request.get<CronTask>(`/cron-task/tasks/${taskId}`),

  runTask: (type: CronTaskType) =>
    request.post<CreateTaskResponse>(`/cron-task/run/${type}`),

  cancelTask: (taskId: string) =>
    request.post<{ success: boolean }>(`/cron-task/tasks/${taskId}/cancel`),

  retryTask: (taskId: string) =>
    request.post<CreateTaskResponse>(`/cron-task/tasks/${taskId}/retry`),

  deleteTask: (taskId: string) =>
    request.delete<{ success: boolean }>(`/cron-task/tasks/${taskId}`),

  deleteTasks: (params: {
    status?: CronTaskStatus
    type?: CronTaskType
    before: number
  }) => request.delete<{ deleted: number }>('/cron-task/tasks', { params }),
}
