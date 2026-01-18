import type { PaginateResult } from '~/models/base'
import type { PageModel } from '~/models/page'
import { request } from '~/utils/request'

export interface GetPagesParams {
  page?: number
  size?: number
  select?: string
}

export interface CreatePageData {
  title: string
  text: string
  slug: string
  subtitle?: string
  order?: number
  allowComment?: boolean
  meta?: Record<string, unknown>
}

export interface UpdatePageData extends Partial<CreatePageData> {}

export const pagesApi = {
  // 获取页面列表
  getList: (params?: GetPagesParams) =>
    request.get<PaginateResult<PageModel>>('/pages', { params }),

  // 获取单个页面
  getById: (id: string) => request.get<{ data: PageModel }>(`/pages/${id}`),

  // 创建页面
  create: (data: CreatePageData) =>
    request.post<PageModel>('/pages', { data }),

  // 更新页面
  update: (id: string, data: UpdatePageData) =>
    request.put<PageModel>(`/pages/${id}`, { data }),

  // 删除页面
  delete: (id: string) => request.delete<void>(`/pages/${id}`),

  // 重新排序
  reorder: (seq: Array<{ id: string; order: number }>) =>
    request.patch<void>('/pages/reorder', { data: { seq } }),
}
