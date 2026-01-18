import type { authClient } from './auth'

import { authApi } from '~/api'

type Session = typeof authClient.$Infer.Session & {
  isOwner: boolean
}
export const getSession = async () => {
  return authApi.getSession() as Promise<Session>
}
