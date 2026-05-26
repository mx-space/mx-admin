import type { SearchIndexRefType } from '~/api/search-index'

export const searchIndexQueryKey = ['search-index'] as const

export const refTypeOptions: Array<{
  label: string
  value: SearchIndexRefType | ''
}> = [
  { label: '全部类型', value: '' },
  { label: '博文 post', value: 'post' },
  { label: '手记 note', value: 'note' },
  { label: '页面 page', value: 'page' },
]

export const refTypeLabel: Record<string, string> = {
  note: '手记',
  page: '页面',
  post: '博文',
}

export const refTypeClassNames: Record<string, string> = {
  note: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300',
  page: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300',
  post: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300',
}
