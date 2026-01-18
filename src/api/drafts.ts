import type {
  DraftModel,
  DraftRefType,
  DraftHistoryListItem,
  TypeSpecificData,
} from '~/models/draft'
import type { Image, PaginateResult } from '~/models/base'
import { request } from '~/utils/request'

export interface GetDraftsParams {
  page?: number
  size?: number
  refType?: DraftRefType
  hasRef?: boolean
  sortBy?: string
  sortOrder?: 1 | -1
}

export interface CreateDraftData {
  refType: DraftRefType
  refId?: string
  title?: string
  text?: string
  images?: Image[]
  meta?: Record<string, any>
  typeSpecificData?: TypeSpecificData
}

export interface UpdateDraftData extends Partial<CreateDraftData> {}

export const draftsApi = {
  // 获取草稿列表
  getList: (params?: GetDraftsParams) =>
    request.get<PaginateResult<DraftModel>>('/drafts', { params }),

  // 获取单个草稿
  getById: (id: string) => request.get<DraftModel>(`/drafts/${id}`),

  // 根据引用获取草稿
  getByRef: (refType: DraftRefType, refId: string) =>
    request.get<DraftModel | null>(`/drafts/by-ref/${refType}/${refId}`),

  // 获取新草稿列表（无关联的草稿）
  getNewDrafts: (refType: DraftRefType) =>
    request.get<DraftModel[]>(`/drafts/by-ref/${refType}/new`),

  // 获取历史版本列表
  getHistory: (id: string) =>
    request.get<DraftHistoryListItem[]>(`/drafts/${id}/history`),

  // 获取特定历史版本
  getHistoryVersion: (id: string, version: number) =>
    request.get<DraftModel>(`/drafts/${id}/history/${version}`),

  // 创建草稿
  create: (data: CreateDraftData) =>
    request.post<DraftModel>('/drafts', { data }),

  // 更新草稿
  update: (id: string, data: UpdateDraftData) =>
    request.put<DraftModel>(`/drafts/${id}`, { data }),

  // 删除草稿
  delete: (id: string) => request.delete<{ success: boolean }>(`/drafts/${id}`),

  // 恢复到特定版本
  restoreVersion: (id: string, version: number) =>
    request.post<DraftModel>(`/drafts/${id}/restore/${version}`),
}
