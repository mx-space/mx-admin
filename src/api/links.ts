import type { LinkModel, LinkResponse, LinkStateCount } from '~/models/link'
import { request } from '~/utils/request'

export interface GetLinksParams {
  page?: number
  size?: number
  state?: number
}

export interface CreateLinkData {
  name: string
  url: string
  avatar?: string
  description?: string
  type?: number
  state?: number
}

export interface UpdateLinkData extends Partial<CreateLinkData> {}

export const linksApi = {
  // 获取友链列表
  getList: (params?: GetLinksParams) =>
    request.get<LinkResponse>('/links', { params }),

  // 获取状态计数
  getStateCount: () => request.get<LinkStateCount>('/links/state'),

  // 获取单个友链
  getById: (id: string) => request.get<{ data: LinkModel }>(`/links/${id}`),

  // 创建友链
  create: (data: CreateLinkData) =>
    request.post<LinkModel>('/links', { data }),

  // 更新友链
  update: (id: string, data: UpdateLinkData) =>
    request.put<LinkModel>(`/links/${id}`, { data }),

  // 删除友链
  delete: (id: string) => request.delete<void>(`/links/${id}`),

  // 更新友链状态
  updateState: (id: string, state: number) =>
    request.patch<LinkModel>(`/links/${id}`, { data: { state } }),

  // 检查友链健康状态
  checkHealth: (options?: { timeout?: number }) =>
    request.get<Record<string, { id: string; status: number | string; message?: string }>>(
      '/links/health',
      { timeout: options?.timeout },
    ),

  // 审核通过友链
  auditPass: (id: string) => request.patch<LinkModel>(`/links/audit/${id}`),

  // 审核友链并发送理由
  auditWithReason: (id: string, state: number, reason: string) =>
    request.post<void>(`/links/audit/reason/${id}`, { data: { state, reason } }),

  // 迁移头像
  migrateAvatars: (options?: { timeout?: number }) =>
    request.post<void>('/links/avatar/migrate', { timeout: options?.timeout }),
}
