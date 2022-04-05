import type { Pager, PaginateResult } from '@mx-space/api-client'

export { Pager, PaginateResult }
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

export class BaseModel {
  created?: Date
  id?: string
}
