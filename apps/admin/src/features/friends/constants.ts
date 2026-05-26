import type { StateTab } from './types/friends'

import { LinkState } from '~/models/link'

export const friendsQueryKey = ['links'] as const
export const friendsPageSize = 50

export const stateTabs: StateTab[] = [
  { countKey: 'friends', label: '朋友们', value: LinkState.Pass },
  { countKey: 'audit', label: '待审核', value: LinkState.Audit },
  { countKey: 'outdate', label: '过时的', value: LinkState.Outdate },
  { countKey: 'reject', label: '已拒绝', value: LinkState.Reject },
  { countKey: 'banned', label: '封禁的', value: LinkState.Banned },
]
