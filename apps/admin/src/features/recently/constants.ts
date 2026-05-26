import { File, FileText, StickyNote } from 'lucide-react'
import type { RecentlyRefTypes } from '~/models/recently'

export const RECENTLY_PAGE_SIZE = 20

export const recentlyListQueryKey = [
  'recently',
  'list',
  { size: RECENTLY_PAGE_SIZE },
] as const

export const recentlyQueryKey = ['recently'] as const

export const URL_REGEX = /https?:\/\/\S+/gi
export const URL_TAIL_TRIM =
  /[)\].,;:!?'"`>}）。，、；：！？「」『』《》〉〕—…]+$/

export const refTypeIcons: Record<RecentlyRefTypes, typeof FileText> = {
  note: StickyNote,
  page: File,
  post: FileText,
  recently: StickyNote,
}

export const refTypeLabels: Record<RecentlyRefTypes, string> = {
  note: '笔记',
  page: '页面',
  post: '文章',
  recently: '速记',
}
