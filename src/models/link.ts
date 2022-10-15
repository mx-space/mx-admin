import type { LinkModel, PaginateResult } from '@mx-space/api-client'

export { LinkType } from '@mx-space/api-client'

export { LinkModel }

export enum LinkState {
  Pass = 0,
  Audit = 1,
  Outdate = 2,
  Banned = 3,
  Reject = 4,
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
