import type {
  CreateMetaPresetDto,
  MetaPresetField,
  MetaPresetScope,
  UpdateMetaPresetDto,
} from '~/models/meta-preset'

import { request } from '~/utils/request'

export interface MetaPresetQueryParams {
  scope?: MetaPresetScope
  enabledOnly?: boolean
}

export const metaPresetsApi = {
  /**
   * 获取所有预设字段
   */
  getAll: (params?: MetaPresetQueryParams) =>
    request.get<MetaPresetField[]>('/meta-presets', { params }),

  /**
   * 获取单个预设字段
   */
  getById: (id: string) => request.get<MetaPresetField>(`/meta-presets/${id}`),

  /**
   * 创建自定义预设字段
   */
  create: (data: CreateMetaPresetDto) =>
    request.post<MetaPresetField>('/meta-presets', { data }),

  /**
   * 更新预设字段
   */
  update: (id: string, data: UpdateMetaPresetDto) =>
    request.patch<MetaPresetField>(`/meta-presets/${id}`, { data }),

  /**
   * 删除预设字段
   */
  delete: (id: string) => request.delete<void>(`/meta-presets/${id}`),

  /**
   * 批量更新排序
   */
  updateOrder: (ids: string[]) =>
    request.put<MetaPresetField[]>('/meta-presets/order', { data: { ids } }),
}
