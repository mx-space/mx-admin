import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { CronTaskStatus, CronTaskType } from '~/api/cron-tasks'

export const taskQueryKey = ['cron-tasks'] as const
export const definitionQueryKey = ['cron-task-definitions'] as const

export const taskListPageSize = 50
export const taskRefetchInterval = 5000
export const definitionStaleTime = 60000

export const taskTypeLabels: Record<CronTaskType, string> = {
  [CronTaskType.CleanAccessRecord]: '清理访问记录',
  [CronTaskType.CleanCommentUploads]: '清理评论图片上传',
  [CronTaskType.CleanTempDirectory]: '清理临时文件',
  [CronTaskType.DeleteExpiredJWT]: '删除过期 JWT',
  [CronTaskType.PushToBaiduSearch]: '推送百度搜索',
  [CronTaskType.PushToBingSearch]: '推送 Bing 搜索',
  [CronTaskType.RebuildSearchIndex]: '重建搜索索引',
  [CronTaskType.ResetIPAccess]: '清理 IP 访问记录',
  [CronTaskType.ResetLikedOrReadArticleRecord]: '清理喜欢数',
}

export const taskStatusLabels: Record<CronTaskStatus, string> = {
  [CronTaskStatus.Cancelled]: '已取消',
  [CronTaskStatus.Completed]: '已完成',
  [CronTaskStatus.Failed]: '失败',
  [CronTaskStatus.PartialFailed]: '部分失败',
  [CronTaskStatus.Pending]: '等待中',
  [CronTaskStatus.Running]: '执行中',
}

export const taskStatusIcons: Record<CronTaskStatus, LucideIcon> = {
  [CronTaskStatus.Cancelled]: XCircle,
  [CronTaskStatus.Completed]: CheckCircle,
  [CronTaskStatus.Failed]: AlertCircle,
  [CronTaskStatus.PartialFailed]: AlertTriangle,
  [CronTaskStatus.Pending]: Clock,
  [CronTaskStatus.Running]: Loader2,
}

export const taskStatusClassNames: Record<CronTaskStatus, string> = {
  [CronTaskStatus.Cancelled]:
    'border-neutral-200 bg-neutral-50 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400',
  [CronTaskStatus.Completed]:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300',
  [CronTaskStatus.Failed]:
    'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300',
  [CronTaskStatus.PartialFailed]:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300',
  [CronTaskStatus.Pending]:
    'border-neutral-200 bg-white text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300',
  [CronTaskStatus.Running]:
    'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300',
}

export const taskStatusIconClassNames: Record<CronTaskStatus, string> = {
  [CronTaskStatus.Cancelled]: 'text-neutral-400',
  [CronTaskStatus.Completed]: 'text-emerald-500',
  [CronTaskStatus.Failed]: 'text-red-500',
  [CronTaskStatus.PartialFailed]: 'text-amber-500',
  [CronTaskStatus.Pending]: 'text-neutral-400',
  [CronTaskStatus.Running]: 'animate-spin text-blue-500',
}

export const statusOptions = [
  { label: '全部状态', value: '' },
  ...Object.values(CronTaskStatus).map((status) => ({
    label: taskStatusLabels[status],
    value: status,
  })),
]

export const typeOptions = [
  { label: '全部类型', value: '' },
  ...Object.values(CronTaskType).map((type) => ({
    label: taskTypeLabels[type],
    value: type,
  })),
]
