import type { TokenModel } from '~/models/token'
import type { AuthnModel } from '~/models/authn'
import { request } from '~/utils/request'

export interface CreateTokenData {
  name: string
  expired?: Date | string
}

export interface PasskeyRegisterResponse {
  verified?: boolean
  [key: string]: any
}

export interface PasskeyAuthResponse {
  verified?: boolean
  token?: string
  [key: string]: any
}

export const authApi = {
  // === Token 管理 ===

  // 获取 Token 列表
  getTokens: () => request.get<{ data: TokenModel[] }>('/auth/token'),

  // 获取单个 Token
  getToken: (id: string) =>
    request.get<TokenModel>('/auth/token', { params: { id } }),

  // 创建 Token
  createToken: (data: CreateTokenData) =>
    request.post<TokenModel>('/auth/token', { data }),

  // 删除 Token
  deleteToken: (id: string) =>
    request.delete<void>('/auth/token', { params: { id } }),

  // === Passkey 管理 ===

  // 获取 Passkey 列表
  getPasskeys: () => request.get<AuthnModel[]>('/passkey/items'),

  // 删除 Passkey
  deletePasskey: (id: string) => request.delete<void>(`/passkey/${id}`),

  // 开始注册 Passkey
  startPasskeyRegister: () => request.post<any>('/passkey/register'),

  // 验证 Passkey 注册
  verifyPasskeyRegister: (data: any) =>
    request.post<PasskeyRegisterResponse>('/passkey/register/verify', { data }),

  // 开始 Passkey 认证
  startPasskeyAuth: () => request.post<any>('/passkey/authentication'),

  // 验证 Passkey 认证
  verifyPasskeyAuth: (data: any) =>
    request.post<PasskeyAuthResponse>('/passkey/authentication/verify', {
      data,
    }),

  // === 第三方认证 ===

  // 获取 Session
  getSession: () => request.get<any>('/auth/session'),

  // 作为 Owner 认证
  authAsOwner: () => request.patch<void>('/auth/as-owner'),
}
