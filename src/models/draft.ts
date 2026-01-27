import type { Image, Pager } from './base'

export enum DraftRefType {
  Post = 'posts',
  Note = 'notes',
  Page = 'pages',
}

export interface DraftHistoryModel {
  version: number
  title: string
  text: string
  typeSpecificData?: Record<string, any>
  savedAt: string
}

export interface DraftModel {
  id: string
  refType: DraftRefType
  refId?: string
  title: string
  text: string
  images?: Image[]
  meta?: Record<string, any>
  typeSpecificData?: Record<string, any>
  version: number
  updated: string
  created: string
  history: DraftHistoryModel[]
}

export interface DraftResponse {
  data: DraftModel[]
  pagination: Pager
}

export interface DraftHistoryListItem {
  version: number
  title: string
  savedAt: string
  /** 是否为全量快照，false 表示增量 diff */
  isFullSnapshot: boolean
}

// Type-specific data interfaces
export interface PostSpecificData {
  slug?: string
  categoryId?: string
  copyright?: boolean
  tags?: string[]
  summary?: string | null
  pin?: string | null
  pinOrder?: number
  relatedId?: string[]
  isPublished?: boolean
}

export interface NoteSpecificData {
  mood?: string
  weather?: string
  password?: string | null
  publicAt?: string | null
  bookmark?: boolean
  location?: string
  coordinates?: {
    latitude: number
    longitude: number
  } | null
  topicId?: string | null
  isPublished?: boolean
}

export interface PageSpecificData {
  slug?: string
  subtitle?: string | null
  order?: number
}

export type TypeSpecificData =
  | PostSpecificData
  | NoteSpecificData
  | PageSpecificData
