import { Pager, Count, Image } from './base'

export interface PostResponse {
  data: PostModel[]
  page: Pager
}

export interface PostModel {
  commentsIndex: number
  allowComment: boolean
  hide: boolean
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
  datumID: string
}

export interface Category {
  type: number
  count: number
  id: string
  name: string
  slug: string
  created: Date
  categoryID: string
}
