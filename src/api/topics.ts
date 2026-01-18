import type { PaginateResult } from '~/models/base'
import type { TopicModel } from '~/models/topic'
import { request } from '~/utils/request'

export interface GetTopicsParams {
  page?: number
  size?: number
}

export interface CreateTopicData {
  name: string
  slug: string
  introduce: string
  description?: string
  icon?: string
}

export interface UpdateTopicData extends Partial<CreateTopicData> {}

export const topicsApi = {
  // 获取专栏列表
  getList: (params?: GetTopicsParams) =>
    request.get<PaginateResult<TopicModel>>('/topics', { params }),

  // 获取单个专栏
  getById: (id: string) => request.get<TopicModel>(`/topics/${id}`),

  // 创建专栏
  create: (data: CreateTopicData) =>
    request.post<TopicModel>('/topics', { data }),

  // 更新专栏
  update: (id: string, data: UpdateTopicData) =>
    request.put<TopicModel>(`/topics/${id}`, { data }),

  // 部分更新专栏
  patch: (id: string, data: Partial<TopicModel>) =>
    request.patch<TopicModel>(`/topics/${id}`, { data }),

  // 删除专栏
  delete: (id: string) => request.delete<void>(`/topics/${id}`),
}
