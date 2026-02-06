import type { TokenModel } from '~/models/token'

import { authClient } from '~/utils/authjs/auth'
import { request } from '~/utils/request'

export interface CreateTokenData {
  name: string
  expired?: Date | string
}

export interface PasskeyItem {
  id: string
  name?: string
  credentialID: string
  publicKey: string
  createdAt: string
}

export const authApi = {
  // === Token 管理 ===

  // 获取 Token 列表
  getTokens: () => request.get<TokenModel[]>('/auth/token'),

  // 获取单个 Token
  getToken: (id: string) =>
    request.get<TokenModel>('/auth/token', { params: { id } }),

  // 创建 Token
  createToken: (data: CreateTokenData) =>
    request.post<TokenModel>('/auth/token', { data }),

  // 删除 Token
  deleteToken: (id: string) =>
    request.delete<void>('/auth/token', { params: { id } }),

  // === Passkey 管理（使用 Better Auth 客户端）===

  // 获取 Passkey 列表
  getPasskeys: async () => {
    const result = await authClient.passkey.listUserPasskeys()
    if (result.error) {
      throw new Error(result.error.message)
    }
    return (result.data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      credentialID: p.id,
      publicKey: p.publicKey,
      createdAt: p.createdAt,
    }))
  },

  // 删除 Passkey
  deletePasskey: async (id: string) => {
    const result = await authClient.passkey.deletePasskey({ id })
    if (result.error) {
      throw new Error(result.error.message)
    }
  },

  // === 第三方认证 ===

  // 获取 Session
  getSession: () => request.get<any>('/auth/session'),

  // 作为 Owner 认证
  authAsOwner: () => request.patch<void>('/auth/as-owner'),
}
