import type { authClient } from './auth'

import { authApi } from '~/api'

type Session = typeof authClient.$Infer.Session & {
  role?: 'reader' | 'owner'
}

export const getSession = async () => {
  return authApi.getSession() as Promise<Session>
}
