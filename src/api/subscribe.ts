import { request } from '~/utils/request'

export interface Subscriber {
  id: string
  email: string
  subscribed: boolean
  subscribe: number
  created: string
}

export interface SubscribeResponse {
  data: Subscriber[]
  pagination: {
    total: number
    currentPage: number
    totalPage: number
    size: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export const subscribeApi = {
  // 获取订阅状态
  getStatus: () => request.get<{ enabled: boolean }>('/subscribe/status'),

  // 获取订阅列表
  getList: (params?: { page?: number; size?: number }) =>
    request.get<SubscribeResponse>('/subscribe', { params }),

  // 取消订阅
  unsubscribe: (params: { email: string }) =>
    request.get<void>('/subscribe/unsubscribe', { params }),

  // 批量取消订阅
  unsubscribeBatch: (params: { emails?: string[]; all?: boolean }) =>
    request.delete<{ deletedCount: number }>('/subscribe/unsubscribe/batch', {
      data: params,
    }),

  // 批量导出订阅
  export: () => request.get<Blob>('/subscribe/export'),
}
