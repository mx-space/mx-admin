import type { PaginateResult } from '~/models/base'
import type { PostModel } from '~/models/post'

import { request } from '~/utils/request'

export interface GetPostsParams {
  page?: number
  size?: number
  select?: string
  sortBy?: string
  sortOrder?: number
  categoryIds?: string[]
}

export interface CreatePostData {
  title: string
  text: string
  categoryId: string
  slug?: string
  tags?: string[]
  summary?: string | null
  copyright?: boolean
  isPublished?: boolean
  pin?: string | null
  pinOrder?: number
  relatedId?: string[]
  meta?: Record<string, unknown>
}

export interface UpdatePostData extends Partial<CreatePostData> {}

export const postsApi = {
  // 获取文章列表
  getList: (params?: GetPostsParams) =>
    request.get<PaginateResult<PostModel>>('/posts', { params }),

  // 获取单篇文章
  getById: (id: string) => request.get<{ data: PostModel }>(`/posts/${id}`),

  // 创建文章
  create: (data: CreatePostData) => request.post<PostModel>('/posts', { data }),

  // 更新文章
  update: (id: string, data: UpdatePostData) =>
    request.put<PostModel>(`/posts/${id}`, { data }),

  // 删除文章
  delete: (id: string) => request.delete<void>(`/posts/${id}`),

  // 更新发布状态
  patch: (id: string, data: Partial<PostModel>) =>
    request.patch<PostModel>(`/posts/${id}`, { data }),
}
