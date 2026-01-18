import type { SayModel, SayResponse } from '~/models/say'
import { request } from '~/utils/request'

export interface GetSaysParams {
  page?: number
  size?: number
}

export interface CreateSayData {
  text: string
  source?: string
  author?: string
}

export interface UpdateSayData extends Partial<CreateSayData> {}

export const saysApi = {
  // 获取一言列表
  getList: (params?: GetSaysParams) =>
    request.get<SayResponse>('/says', { params }),

  // 获取单个一言
  getById: (id: string) => request.get<{ data: SayModel }>(`/says/${id}`),

  // 创建一言
  create: (data: CreateSayData) => request.post<SayModel>('/says', { data }),

  // 更新一言
  update: (id: string, data: UpdateSayData) =>
    request.put<SayModel>(`/says/${id}`, { data }),

  // 删除一言
  delete: (id: string) => request.delete<void>(`/says/${id}`),
}
