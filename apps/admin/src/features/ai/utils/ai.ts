import type { AIInsights, AISummary, AITask, AITranslation } from '~/api/ai'
import type { AiSurface } from '../types/ai'

import {
  AITaskStatus,
  AITaskType,
  updateInsights,
  updateSummary,
  updateTranslation,
} from '~/api/ai'
import { relativeTimeFromNow } from '~/utils/time'

import { statusOptions, typeOptions } from '../constants'

export function getInitialAiSurface(pathname: string): AiSurface {
  if (pathname.endsWith('/summary')) return 'summaries'
  if (pathname.endsWith('/translation')) return 'translations'
  if (pathname.endsWith('/insights')) return 'insights'
  if (pathname.endsWith('/translation-entries')) return 'entries'
  if (pathname.endsWith('/slug-backfill')) return 'slug'
  if (pathname.endsWith('/tasks')) return 'tasks'

  return 'tasks'
}

export function getEffectiveStatus(task: AITask) {
  if (
    isBatchTask(task) &&
    task.status === AITaskStatus.Completed &&
    task.subTaskStats &&
    (task.subTaskStats.pending > 0 || task.subTaskStats.running > 0)
  ) {
    return AITaskStatus.Running
  }

  return task.status
}

export function isBatchTask(task: AITask) {
  return (
    task.type === AITaskType.TranslationBatch ||
    task.type === AITaskType.TranslationAll
  )
}

export function getTaskSummary(task: AITask) {
  const payload = task.payload
  const result = task.result as Record<string, unknown> | undefined
  if (task.type === AITaskType.Summary) {
    return (payload.title as string) || (payload.refId as string) || '摘要任务'
  }
  if (task.type === AITaskType.Translation) {
    return (payload.title as string) || (payload.refId as string) || '翻译任务'
  }
  if (task.type === AITaskType.TranslationBatch) {
    const count = (payload.refIds as string[] | undefined)?.length ?? 0
    return `${count} 篇文章`
  }
  if (task.type === AITaskType.TranslationAll) {
    const count = result?.total as number | undefined
    return count ? `${count} 篇文章` : '全部文章'
  }
  if (task.type === AITaskType.SlugBackfill) return '补全缺失 Slug'
  if (task.type === AITaskType.Insights) return '精读内容生成'
  if (task.type === AITaskType.InsightsTranslation) return '精读内容翻译'

  return '任务'
}

export function getTaskDetailSummary(task: AITask) {
  const payload = task.payload
  const result = task.result as Record<string, unknown> | undefined
  if (task.type === AITaskType.Translation) {
    const title = (payload.title as string) || (payload.refId as string)
    const langs = (payload.targetLanguages as string[] | undefined)?.join(', ')
    return `${title || '翻译任务'} -> ${langs || '默认语言'}`
  }
  if (task.type === AITaskType.TranslationBatch) {
    const count = (payload.refIds as string[] | undefined)?.length ?? 0
    const langs = (payload.targetLanguages as string[] | undefined)?.join(', ')
    return `${count} 篇文章 -> ${langs || '默认语言'}`
  }
  if (task.type === AITaskType.TranslationAll) {
    const count = result?.total as number | undefined
    const langs = (payload.targetLanguages as string[] | undefined)?.join(', ')
    return `${count ? `全部 ${count} 篇文章` : '全部文章'} -> ${langs || '默认语言'}`
  }

  return getTaskSummary(task)
}

export function getTaskProgressLabel(task: AITask) {
  if (task.subTaskStats) {
    const stats = task.subTaskStats
    return `${stats.completed + stats.failed}/${stats.total}`
  }

  if (
    typeof task.completedItems === 'number' &&
    typeof task.totalItems === 'number' &&
    task.totalItems > 0
  ) {
    return `${task.completedItems}/${task.totalItems}`
  }

  return null
}

export function getProgress(task: AITask) {
  if (typeof task.progress === 'number') return task.progress
  if (
    typeof task.completedItems === 'number' &&
    typeof task.totalItems === 'number' &&
    task.totalItems > 0
  ) {
    return (task.completedItems / task.totalItems) * 100
  }
  if (task.subTaskStats && task.subTaskStats.total > 0) {
    const completed = task.subTaskStats.completed + task.subTaskStats.failed
    return (completed / task.subTaskStats.total) * 100
  }

  return null
}

export function statusIconClassName(status: AITaskStatus) {
  return {
    [AITaskStatus.Pending]: 'text-neutral-400',
    [AITaskStatus.Running]: 'text-blue-500',
    [AITaskStatus.Completed]: 'text-emerald-500',
    [AITaskStatus.PartialFailed]: 'text-amber-500',
    [AITaskStatus.Failed]: 'text-red-500',
    [AITaskStatus.Cancelled]: 'text-neutral-400',
  }[status]
}

export function formatRelativeTimestamp(timestamp?: number) {
  if (!timestamp) return '-'
  return relativeTimeFromNow(new Date(timestamp))
}

export function formatAbsoluteTimestamp(timestamp?: number) {
  if (!timestamp) return '-'
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(timestamp))
}

export function editSummaryItem(item: AISummary) {
  const summary = window.prompt('摘要内容', item.summary)
  if (summary === null) return Promise.resolve({ cancelled: true })
  if (!summary.trim()) throw new Error('摘要内容不能为空')

  return updateSummary(item.id, { summary })
}

export function editTranslationItem(item: AITranslation) {
  const title = window.prompt('标题', item.title)
  if (title === null) return Promise.resolve({ cancelled: true })
  if (!title.trim()) throw new Error('标题不能为空')

  const subtitle = window.prompt('副标题（可留空）', item.subtitle ?? '')
  if (subtitle === null) return Promise.resolve({ cancelled: true })

  const summary = window.prompt('摘要（可留空）', item.summary ?? '')
  if (summary === null) return Promise.resolve({ cancelled: true })

  if (item.contentFormat === 'lexical') {
    const content = window.prompt('Lexical JSON 内容', item.content ?? '')
    if (content === null) return Promise.resolve({ cancelled: true })

    return updateTranslation(item.id, {
      content: content.trim() || undefined,
      subtitle: subtitle.trim() || undefined,
      summary: summary.trim() || undefined,
      title,
    })
  }

  const text = window.prompt('正文内容', item.text)
  if (text === null) return Promise.resolve({ cancelled: true })
  if (!text.trim()) throw new Error('正文内容不能为空')

  return updateTranslation(item.id, {
    subtitle: subtitle.trim() || undefined,
    summary: summary.trim() || undefined,
    text,
    title,
  })
}

export function editInsightsItem(item: AIInsights) {
  const content = window.prompt('精读内容', item.content)
  if (content === null) return Promise.resolve({ cancelled: true })
  if (!content.trim()) throw new Error('精读内容不能为空')

  return updateInsights(item.id, { content })
}

export function getGroupedActionSuccessMessage(result: unknown) {
  if (isCancelledActionResult(result)) return null
  return getTaskMutationMessage(result) ?? '已保存'
}

export function getTaskMutationMessage(result: unknown) {
  if (isCancelledActionResult(result)) return null
  if (
    result &&
    typeof result === 'object' &&
    'taskId' in result &&
    'created' in result
  ) {
    return (result as { created?: boolean }).created
      ? '已创建任务'
      : '任务已存在'
  }

  return null
}

export function isCancelledActionResult(result: unknown): result is {
  cancelled: true
} {
  return (
    !!result &&
    typeof result === 'object' &&
    'cancelled' in result &&
    (result as { cancelled?: unknown }).cancelled === true
  )
}

export function formatDateString(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function readPositivePage(value: null | string) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

export function readTaskStatusFilter(value: null | string): AITaskStatus | '' {
  return statusOptions.some((option) => option.value === value)
    ? (value as AITaskStatus | '')
    : ''
}

export function readTaskTypeFilter(value: null | string): AITaskType | '' {
  return typeOptions.some((option) => option.value === value)
    ? (value as AITaskType | '')
    : ''
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}
