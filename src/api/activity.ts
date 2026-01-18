import type { PaginateResult } from '~/models/base'
import type { RecentlyModel } from '~/models/recently'
import type { NoteModel } from '~/models/note'
import type { PostModel } from '~/models/post'
import type { PageModel } from '~/models/page'
import { request } from '~/utils/request'

export interface ActivityPresence {
  operationTime: number
  updatedAt: number
  connectedAt: number
  identity: string
  roomName: string
  position: number
  sid: string
  displayName?: string
  ts?: number
}

export interface ActivityItem {
  id: string
  created: string
  payload: any
  type: number
}

export interface ActivityListResponse extends PaginateResult<ActivityItem> {
  objects?: {
    posts?: PostModel[]
    notes?: NoteModel[]
    pages?: PageModel[]
    recentlies?: RecentlyModel[]
  }
}

export interface ReadingRankItem {
  id: string
  title: string
  type: string
  count: number
  refId?: string
}

export interface GetActivityParams {
  page?: number
  size?: number
  before?: string
  after?: string
}

export const activityApi = {
  // 获取活动列表
  getList: (params?: GetActivityParams) =>
    request.get<ActivityListResponse>('/activity', { params }),

  // 获取阅读排行
  getReadingRank: (params?: { type?: string }) =>
    request.get<ReadingRankItem[]>('/activity/reading/rank', { params }),

  // 获取最近动态列表
  getRecentlyList: (params?: GetActivityParams) =>
    request.get<PaginateResult<RecentlyModel>>('/recently/all', { params }),

  // 删除最近动态
  deleteRecently: (id: string) => request.delete<void>(`/recently/${id}`),
}
