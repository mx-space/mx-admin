import type { ScopeOption } from './types/webhooks'

import { EventScope } from '~/api/webhooks'

export const webhooksQueryKey = ['webhooks'] as const

export const dispatchPageSize = 20

export const scopeOptions: ScopeOption[] = [
  { label: '访客操作', value: EventScope.TO_VISITOR },
  { label: '管理员操作', value: EventScope.TO_ADMIN },
  { label: '系统事件', value: EventScope.TO_SYSTEM },
]
