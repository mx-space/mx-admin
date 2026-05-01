import type { PaginateResult } from '~/models/base'

import { request } from '~/utils/request'

export interface WebhookModel {
  id: string
  url: string
  payloadUrl: string
  events: string[]
  secret?: string
  enabled: boolean
  scope: number
  created: string
  updated: string
}

export interface CreateWebhookData {
  url?: string
  payloadUrl?: string
  events: string[]
  secret?: string
  enabled?: boolean
  scope?: number
}

export interface UpdateWebhookData extends Partial<CreateWebhookData> {}

export interface WebhookEventRecord {
  id: string
  event: string
  headers: Record<string, string>
  payload: unknown
  response: unknown
  success: boolean
  status: number
  hookId: string
  timestamp: string
}

export const webhooksApi = {
  // 获取 Webhook 列表
  getList: () => request.get<WebhookModel[]>('/webhooks'),

  // 获取可用事件列表
  getEvents: () => request.get<string[]>('/webhooks/events'),

  // 创建 Webhook
  create: (data: CreateWebhookData) =>
    request.post<WebhookModel>('/webhooks', { data }),

  // 更新 Webhook
  update: (id: string, data: UpdateWebhookData) =>
    request.patch<WebhookModel>(`/webhooks/${id}`, { data }),

  // 删除 Webhook
  delete: (id: string) => request.delete<void>(`/webhooks/${id}`),

  // 测试 Webhook
  test: (id: string, event: string) =>
    request.post<void>(`/webhooks/${id}/test`, { data: { event } }),

  // 获取 Webhook 推送记录
  getDispatches: (id: string, params?: { page?: number; size?: number }) =>
    request.get<PaginateResult<WebhookEventRecord>>(`/webhooks/${id}`, {
      params: { page: params?.page ?? 1, size: params?.size ?? 20 },
    }),

  // 重新推送
  redispatch: (hookId: string, eventId: string) =>
    request.post<void>(`/webhooks/${hookId}/redispatch/${eventId}`),
}
