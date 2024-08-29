import type { Session } from '@auth/core/types'

import { RESTManager } from '../rest'

export const getSession = async () => {
  return RESTManager.api.auth.session.get<Session>()
}
