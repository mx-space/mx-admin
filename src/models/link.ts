import type { LinkModel, LinkState, PaginateResult } from '@mx-space/api-client'

export { LinkState, LinkType } from '@mx-space/api-client'
export { LinkModel }

export type LinkResponse = PaginateResult<LinkModel>

export type LinkStateCount = {
  audit: number
  collection: number
  friends: number
  outdate: number
  banned: number
}

export const LinkStateNameMap: Record<keyof typeof LinkState, string> = {
  Audit: '待审核',
  Pass: '通过',
  Outdate: '过时',
  Banned: '屏蔽',
}
