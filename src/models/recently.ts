export enum RecentlyRefTypes {
  Post = 'Post',
  Note = 'Note',
  Page = 'Page',
}

export interface RecentlyRefType {
  title: string
  url: string
}

export interface RecentlyModel {
  id: string
  content: string
  created: string
  modified?: string

  ref?: RecentlyRefType & { [key: string]: any }
  refId?: string
  refType?: RecentlyRefTypes

  up: number
  down: number

  allowComment: boolean
  commentsIndex?: number
}
