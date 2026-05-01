import { request } from '~/utils/request'

export interface ServerlessLogEntry {
  id: string
  functionId: string
  reference: string
  name: string
  method: string
  ip: string
  status: 'success' | 'error'
  executionTime: number
  created: string
  logs?: { level: string; timestamp: number; args: unknown[] }[]
  error?: { name: string; message: string; stack?: string }
}

export interface ServerlessLogPagination {
  total: number
  size: number
  currentPage: number
  totalPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface ServerlessLogListResponse {
  data: ServerlessLogEntry[]
  pagination: ServerlessLogPagination
}

export interface GetServerlessLogsParams {
  page?: number
  size?: number
  status?: 'success' | 'error'
}

export const serverlessApi = {
  getInvocationLogs: (id: string, params?: GetServerlessLogsParams) =>
    request.get<ServerlessLogListResponse>(`/fn/logs/${id}`, {
      params,
    }),

  getInvocationLogDetail: (id: string) =>
    request.get<ServerlessLogEntry>(`/fn/log/${id}`),

  getCompiledCode: (id: string) => request.get<string>(`/fn/compiled/${id}`),
}
