import type { Count, Image, Pager } from './base'

export interface PostResponse {
  data: PostModel[]
  pagination: Pager
}

export interface PostModel {
  commentsIndex: number
  allowComment: boolean
  copyright: boolean
  tags: string[]
  count: Count
  id: string
  text: string
  title: string
  slug: string
  categoryId: string
  images: Image[]
  modified: string
  created: string
  category: Category
  summary?: string
  pin?: string | null
  pinOrder?: number
  related?: Pick<
    PostModel,
    | 'id'
    | 'title'
    | 'slug'
    | 'categoryId'
    | 'modified'
    | 'created'
    | 'category'
    | 'summary'
  >[]
  meta?: any
  isPublished?: boolean
}

export interface Category {
  type: number
  count: number
  id: string
  name: string
  slug: string
  created: string
  categoryId: string
}
