import type { Pager } from './base'

export interface CommentParentPreview {
  id: string
  author: string
  text: string
  isDeleted?: boolean
}

export interface CommentReplyWindow {
  total: number
  returned: number
  threshold: number
  hasHidden: boolean
  hiddenCount: number
  nextCursor?: string
}

export interface CommentModel {
  refType: string
  state: number
  id: string
  author: string
  text: string
  mail?: string
  url?: string
  ip?: string
  agent?: string
  created: string
  modified: string
  avatar?: string
  isWhispers?: boolean
  parentCommentId?: string | CommentParentPreview | null
  rootCommentId?: string | null
  replyCount?: number
  latestReplyAt?: string | null
  isDeleted?: boolean
  deletedAt?: string | null
  replies?: CommentModel[]
  replyWindow?: CommentReplyWindow
  ref?: Record<string, any>
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
