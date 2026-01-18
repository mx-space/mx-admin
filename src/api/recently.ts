import type { RecentlyModel } from '~/models/recently'
import { request } from '~/utils/request'

export const recentlyApi = {
  // 获取最近访问列表
  getAll: () => request.get<{ data: RecentlyModel[] }>('/recently/all'),

  // 创建速记
  create: (data: { content: string }) =>
    request.post<RecentlyModel>('/recently', { data }),

  // 更新速记
  update: (id: string, data: { content: string }) =>
    request.put<RecentlyModel>(`/recently/${id}`, { data }),

  // 删除最近访问项
  delete: (id: string) => request.delete<void>(`/recently/${id}`),

  // 清空最近访问
  clear: () => request.delete<void>('/recently/all'),
}
