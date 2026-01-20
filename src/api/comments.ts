import type { CommentModel, CommentsResponse } from '~/models/comment'

import { request } from '~/utils/request'

export interface GetCommentsParams {
  page?: number
  size?: number
  state?: number
}

export interface ReplyCommentData {
  text: string
  author: string
  mail: string
  source?: string
}

export const commentsApi = {
  // 获取评论列表
  getList: (params?: GetCommentsParams) =>
    request.get<CommentsResponse>('/comments', { params }),

  // 获取单个评论
  getById: (id: string) => request.get<CommentModel>(`/comments/${id}`),

  // 回复评论（普通）
  reply: (id: string, data: ReplyCommentData) =>
    request.post<CommentModel>(`/comments/master/reply/${id}`, { data }),

  // 主人回复评论（只需 text）
  masterReply: (id: string, text: string) =>
    request.post<CommentModel>(`/comments/master/reply/${id}`, {
      data: { text },
    }),

  // 更新评论状态
  updateState: (id: string, state: number) =>
    request.patch<CommentModel>(`/comments/${id}`, { data: { state } }),

  // 批量更新状态
  batchUpdateState: (ids: string[], state: number) =>
    request.patch<void>('/comments', { data: { ids, state } }),

  // 删除评论
  delete: (id: string) => request.delete<void>(`/comments/${id}`),

  // 批量删除
  batchDelete: (ids: string[]) =>
    request.delete<void>('/comments', { params: { ids: ids.join(',') } }),
}
