import { request } from '~/utils/request'

export interface AgentConversation {
  id: string
  refId: string
  refType: string
  title?: string
  model: string
  providerId: string
  created: string
  updated: string
  messageCount: number
  messages?: Record<string, unknown>[]
  reviewState?: Record<string, unknown>
  diffState?: Record<string, unknown>
}

export const aiAgentApi = {
  createConversation: (data: {
    refId: string
    refType: string
    model: string
    providerId: string
    title?: string
    messages?: Record<string, unknown>[]
  }) => request.post<AgentConversation>('/ai/agent/conversations', { data }),

  listConversations: (refId: string, refType: string) =>
    request.get<AgentConversation[]>('/ai/agent/conversations', {
      params: { refId, refType },
    }),

  getConversation: (id: string) =>
    request.get<AgentConversation>(`/ai/agent/conversations/${id}`),

  appendMessages: (id: string, messages: Record<string, unknown>[]) =>
    request.patch<AgentConversation>(`/ai/agent/conversations/${id}/messages`, {
      data: { messages },
    }),

  replaceMessages: (id: string, messages: Record<string, unknown>[]) =>
    request.put<AgentConversation>(`/ai/agent/conversations/${id}/messages`, {
      data: { messages },
    }),

  updateConversation: (
    id: string,
    data: {
      title?: string
      reviewState?: Record<string, unknown> | null
      diffState?: Record<string, unknown> | null
    },
  ) =>
    request.patch<AgentConversation>(`/ai/agent/conversations/${id}`, { data }),

  deleteConversation: (id: string) =>
    request.delete<void>(`/ai/agent/conversations/${id}`),
}
