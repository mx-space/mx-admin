import type { PaginateResult } from './base'

export enum LinkType {
  Friend,
  Collection,
}

export enum LinkState {
  Pass,
  Audit,
  Outdate,
  Banned,
  Reject,
}

export interface LinkModel {
  id: string
  createdAt: string
  name: string
  url: string
  avatar: string
  description?: string
  type: LinkType
  state: LinkState
  hide: boolean
  email: string
}

export type LinkResponse = PaginateResult<LinkModel>

export type LinkStateCount = {
  audit: number
  collection: number
  friends: number
  outdate: number
  banned: number
  reject: number
}

export const LinkStateNameMap: Record<keyof typeof LinkState, string> = {
  Audit: '待审核',
  Pass: '通过',
  Outdate: '过时',
  Banned: '屏蔽',
  Reject: '拒绝',
}
