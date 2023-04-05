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
  pin?: string | null
  pinOrder?: number
  related?: Pick<PostModel, 'id' | 'title'>[]
  meta?: any
}

export interface Category {
  type: number
  count: number
  id: string
  name: string
  slug: string
  created: Date
  categoryId: string
}
