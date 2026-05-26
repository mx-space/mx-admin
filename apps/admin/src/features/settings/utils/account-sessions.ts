import type { AccountSession } from '../types/settings'

import { authClient } from '~/utils/authjs/auth'

export async function listSessions(): Promise<AccountSession[]> {
  const [sessionsResult, currentResult] = await Promise.all([
    authClient.listSessions(),
    authClient.getSession(),
  ])

  if (sessionsResult.error) {
    throw new Error(sessionsResult.error.message || '获取会话失败')
  }

  const currentToken = currentResult.data?.session?.token
  return (sessionsResult.data ?? []).map((session: any) => {
    const token = String(session.token || session.id)
    return {
      current: currentToken ? token === currentToken : false,
      ip: session.ipAddress || '',
      lastActiveAt: new Date(
        session.updatedAt || session.createdAt || Date.now(),
      ).toISOString(),
      token,
      ua: session.userAgent || '',
    }
  })
}
