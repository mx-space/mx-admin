import type { PaginateResult } from '~/models/base'

import { getJson } from './http'

export interface ReaderModel {
  id: string
  provider?: string
  type?: string
  name: string
  email: string
  image: string
  handle?: string
  role: 'reader' | 'owner'
}

export function getReaders(params: { page: number; size: number }) {
  return getJson<PaginateResult<ReaderModel>>('/readers', params)
}
