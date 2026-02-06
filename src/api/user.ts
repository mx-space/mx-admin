import type { UserModel } from '~/models/user'

import { authClient } from '~/utils/authjs/auth'
import { request } from '~/utils/request'

export interface LoginData {
  username: string
  password: string
}

export interface LoginResponse {
  token?: string
  user?: {
    id: string
    email: string
    name: string
    image?: string | null
    emailVerified: boolean
    createdAt: string | Date
    updatedAt: string | Date
    role?: 'reader' | 'owner'
  }
}

export interface UpdateOwnerData {
  name?: string
  username?: string
  mail?: string
  url?: string
  avatar?: string
  introduce?: string
  socialIds?: Record<string, string | number>
}

export interface Session {
  id: string
  token: string
  ua: string
  ip: string
  lastActiveAt: string
  current?: boolean
}

export interface AllowLoginResponse {
  password: boolean
  passkey: boolean
  github?: boolean
  google?: boolean
  [key: string]: boolean | undefined
}

export const userApi = {
  // 获取当前 Owner 信息
  getOwner: () => request.get<UserModel>('/owner'),

  // 检查是否已登录
  checkLogged: () => request.get<{ ok: number }>('/owner/check_logged'),

  // 用户名密码登录（Cookie Session，不返回 JWT）
  loginWithPassword: async (data: LoginData) => {
    const result = await authClient.signIn.username({
      username: data.username,
      password: data.password,
    })

    if (result.error) {
      throw new Error(result.error.message || '登录失败')
    }

    return result.data as LoginResponse
  },

  // 获取允许的登录方式
  getAllowLogin: () => request.get<AllowLoginResponse>('/owner/allow-login'),

  // 更新 Owner 信息
  updateOwner: (data: UpdateOwnerData) =>
    request.patch<UserModel>('/owner', { data }),

  // 登出当前会话
  logout: async () => {
    const result = await authClient.signOut()
    if (result.error) {
      throw new Error(result.error.message || '登出失败')
    }
  },

  // 获取会话列表（Better Auth）
  getSessions: async () => {
    const [sessionsResult, currentResult] = await Promise.all([
      authClient.listSessions(),
      authClient.getSession(),
    ])

    if (sessionsResult.error) {
      throw new Error(sessionsResult.error.message || '获取会话失败')
    }

    const currentToken = currentResult.data?.session?.token

    return (sessionsResult.data || []).map((session: any) => {
      const token = session.token || session.id
      return {
        id: token,
        token,
        ua: session.userAgent || '',
        ip: session.ipAddress || '',
        lastActiveAt: new Date(
          session.updatedAt || session.createdAt || Date.now(),
        ).toISOString(),
        current: currentToken ? token === currentToken : false,
      }
    }) as Session[]
  },

  // 删除指定会话
  deleteSession: async (token: string) => {
    const result = await authClient.revokeSession({ token })
    if (result.error) {
      throw new Error(result.error.message || '删除会话失败')
    }
  },

  // 删除所有其他会话
  deleteAllSessions: async () => {
    const result = await authClient.revokeOtherSessions()
    if (result.error) {
      throw new Error(result.error.message || '删除会话失败')
    }
  },
}
