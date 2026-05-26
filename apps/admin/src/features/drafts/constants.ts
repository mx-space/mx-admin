import { BookOpen, Code2, FileText } from 'lucide-react'
import type { DraftRefType } from '~/models/draft'
import type { LucideIcon } from 'lucide-react'

import { DraftRefType as DraftRefTypeValue } from '~/models/draft'

export const draftsQueryKey = ['drafts'] as const

export const filterOptions: Array<{
  label: string
  value: DraftRefType | 'all'
}> = [
  { label: '全部', value: 'all' },
  { label: '文章', value: DraftRefTypeValue.Post },
  { label: '手记', value: DraftRefTypeValue.Note },
  { label: '页面', value: DraftRefTypeValue.Page },
]

export const refTypeMeta: Record<
  DraftRefType,
  { className: string; icon: LucideIcon; label: string }
> = {
  [DraftRefTypeValue.Post]: {
    className:
      'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300',
    icon: Code2,
    label: '文章',
  },
  [DraftRefTypeValue.Note]: {
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300',
    icon: BookOpen,
    label: '手记',
  },
  [DraftRefTypeValue.Page]: {
    className:
      'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/50 dark:text-violet-300',
    icon: FileText,
    label: '页面',
  },
}
