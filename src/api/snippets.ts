import type { PaginateResult } from '~/models/base'
import type { SnippetModel, SnippetType } from '~/models/snippet'

import { request } from '~/utils/request'

export interface GetSnippetsParams {
  page?: number
  size?: number
  type?: SnippetType
  reference?: string
}

export interface CreateSnippetData {
  name: string
  type: SnippetType
  raw: string
  reference?: string
  private?: boolean
  comment?: string
  metatype?: string
  schema?: string
  enable?: boolean
  method?: string
  secret?: Record<string, any>
}

export interface UpdateSnippetData extends Partial<CreateSnippetData> {}

export interface SnippetGroup {
  reference: string
  count: number
}

export interface ImportSnippetsData {
  snippets: SnippetModel[]
  packages?: string[]
}

export const snippetsApi = {
  // 获取片段列表
  getList: (params?: GetSnippetsParams) =>
    request.get<PaginateResult<SnippetModel>>('/snippets', { params }),

  // 获取单个片段
  getById: (id: string) => request.get<SnippetModel>(`/snippets/${id}`),

  // 创建片段
  create: (data: CreateSnippetData) =>
    request.post<SnippetModel>('/snippets', { data }),

  // 更新片段
  update: (id: string, data: UpdateSnippetData) =>
    request.put<SnippetModel>(`/snippets/${id}`, { data }),

  // 删除片段
  delete: (id: string) => request.delete<void>(`/snippets/${id}`),

  // 获取分组列表
  getGroups: (params?: { size?: number }) =>
    request.get<SnippetGroup[]>('/snippets/group', { params }),

  // 获取分组下的片段
  getGroupSnippets: (reference: string) =>
    request.get<SnippetModel[]>(`/snippets/group/${reference}`),

  // 重置函数片段（内置函数）
  resetFunction: (id: string) => request.delete<void>(`/fn/reset/${id}`),

  // 导入片段
  import: (data: ImportSnippetsData) =>
    request.post<void>('/snippets/import', { data }),
}
