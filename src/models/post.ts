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
  categoryID: string
  images: Image[]
  modified: Date
  created: Date
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

export interface Count {
  read: number
  like: number
}

export interface Image {
  height: number
  width: number
  type: string
  accent?: string
  src: string
}

export interface Pager {
  total: number
  size: number
  currentPage: number
  totalPage: number
  hasPrevPage: boolean
  hasNextPage: boolean
}
