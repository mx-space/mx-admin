import type { NoteFilter, NoteSortKey } from './types/notes'

export const filteredNotesFetchSize = 100
export const notesPageSize = 20
export const notesQueryKey = ['notes'] as const

export const noteFilterOptions: Array<{ label: string; value: NoteFilter }> = [
  { label: '全部手记', value: 'all' },
  { label: '回忆项', value: 'bookmark' },
  { label: '草稿项', value: 'unpublished' },
]

export const noteSortOptions: Array<{ label: string; value: NoteSortKey }> = [
  { label: '创建时间', value: 'createdAt' },
  { label: '修改时间', value: 'modifiedAt' },
  { label: '标题', value: 'title' },
  { label: '心情', value: 'mood' },
  { label: '天气', value: 'weather' },
]
