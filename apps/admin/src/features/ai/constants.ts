import {
  AlertCircle,
  AlertTriangle,
  BookOpenText,
  CheckCircle2,
  Clock,
  FileText,
  Languages,
  ListTodo,
  Loader2,
  Sparkles,
  WandSparkles,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AiSurface } from './types/ai'

import { AITaskStatus, AITaskType } from '~/api/ai'

export const aiTasksQueryKey = ['ai', 'tasks'] as const

export const pageSize = 50
export const groupedPageSize = 20

export const taskTypeLabels: Record<AITaskType, string> = {
  [AITaskType.Summary]: '摘要生成',
  [AITaskType.Translation]: '翻译',
  [AITaskType.TranslationBatch]: '批量翻译',
  [AITaskType.TranslationAll]: '全量翻译',
  [AITaskType.SlugBackfill]: 'Slug 回填',
  [AITaskType.Insights]: '精读生成',
  [AITaskType.InsightsTranslation]: '精读翻译',
}

export const taskStatusLabels: Record<AITaskStatus, string> = {
  [AITaskStatus.Pending]: '等待中',
  [AITaskStatus.Running]: '执行中',
  [AITaskStatus.Completed]: '已完成',
  [AITaskStatus.PartialFailed]: '部分失败',
  [AITaskStatus.Failed]: '失败',
  [AITaskStatus.Cancelled]: '已取消',
}

export const statusIcon: Record<AITaskStatus, LucideIcon> = {
  [AITaskStatus.Pending]: Clock,
  [AITaskStatus.Running]: Loader2,
  [AITaskStatus.Completed]: CheckCircle2,
  [AITaskStatus.PartialFailed]: AlertTriangle,
  [AITaskStatus.Failed]: AlertCircle,
  [AITaskStatus.Cancelled]: XCircle,
}

export const statusClassName: Record<AITaskStatus, string> = {
  [AITaskStatus.Pending]:
    'border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300',
  [AITaskStatus.Running]:
    'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300',
  [AITaskStatus.Completed]:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300',
  [AITaskStatus.PartialFailed]:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300',
  [AITaskStatus.Failed]:
    'border-red-200 bg-red-50 text-red-700 dark:border-red-950 dark:bg-red-950/40 dark:text-red-300',
  [AITaskStatus.Cancelled]:
    'border-neutral-200 bg-neutral-50 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400',
}

export const statusOptions: Array<{ label: string; value: AITaskStatus | '' }> =
  [
    { label: '全部状态', value: '' },
    { label: '等待中', value: AITaskStatus.Pending },
    { label: '执行中', value: AITaskStatus.Running },
    { label: '已完成', value: AITaskStatus.Completed },
    { label: '部分失败', value: AITaskStatus.PartialFailed },
    { label: '失败', value: AITaskStatus.Failed },
    { label: '已取消', value: AITaskStatus.Cancelled },
  ]

export const typeOptions: Array<{ label: string; value: AITaskType | '' }> = [
  { label: '全部类型', value: '' },
  { label: '摘要生成', value: AITaskType.Summary },
  { label: '翻译', value: AITaskType.Translation },
  { label: '批量翻译', value: AITaskType.TranslationBatch },
  { label: '全量翻译', value: AITaskType.TranslationAll },
  { label: 'Slug 回填', value: AITaskType.SlugBackfill },
  { label: '精读生成', value: AITaskType.Insights },
  { label: '精读翻译', value: AITaskType.InsightsTranslation },
]

export const aiSurfaceTabs: Array<{
  icon: LucideIcon
  label: string
  path: string
  value: AiSurface
}> = [
  { icon: ListTodo, label: '任务队列', path: '/ai/tasks', value: 'tasks' },
  { icon: FileText, label: '摘要', path: '/ai/summary', value: 'summaries' },
  {
    icon: Languages,
    label: '翻译',
    path: '/ai/translation',
    value: 'translations',
  },
  {
    icon: BookOpenText,
    label: '精读',
    path: '/ai/insights',
    value: 'insights',
  },
  {
    icon: Sparkles,
    label: '词表',
    path: '/ai/translation-entries',
    value: 'entries',
  },
  {
    icon: WandSparkles,
    label: 'Slug 回填',
    path: '/ai/slug-backfill',
    value: 'slug',
  },
]

export const translationEntryKeyPathOptions = [
  'category.name',
  'topic.name',
  'topic.introduce',
  'note.mood',
  'note.weather',
] as const
