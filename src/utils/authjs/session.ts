import type { authClient } from './auth'

import { RESTManager } from '../rest'

type Session = typeof authClient.$Infer.Session & {
  isOwner: boolean
}
export const getSession = async () => {
  return RESTManager.api.auth.session.get<Session>()
}
