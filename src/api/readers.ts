import type { PaginateResult } from '~/models/base'
import { request } from '~/utils/request'

export interface ReaderModel {
  id: string
  provider?: string
  type?: string
  name: string
  email: string
  image: string
  handle?: string
  isOwner: boolean
}

export interface GetReadersParams {
  page?: number
  size?: number
}

export const readersApi = {
  // 获取读者列表
  getList: (params?: GetReadersParams) =>
    request.get<PaginateResult<ReaderModel>>('/readers', { params }),
}
