export interface Pager {
  total: number
  size: number
  currentPage: number
  totalPage: number
  hasPrevPage: boolean
  hasNextPage: boolean
}

export interface PaginateResult<T> {
  data: T[]
  pagination: Pager
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
  blurHash?: string
}

export class BaseModel {
  created: string = ''
  id: string = ''
}
