import type { Pager } from './base'

export interface CommentModel {
  refType: string
  state: number
  children: CommentModel[]
  commentsIndex: number
  id: string
  author: string
  text: string
  mail: string
  url: string
  ip: string
  agent: string
  key: string
  pid: string
  created: string
  modified: string
  avatar: string
}

export interface CommentsResponse {
  data: CommentModel[]
  pagination: Pager
}

export enum CommentState {
  Unread,
  Read,
  Junk,
}
