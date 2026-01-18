import type { UserModel } from '~/models/user'

import { request } from '~/utils/request'

export interface LoginData {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  expiresIn: number
}

export interface UpdateUserData {
  name?: string
  username?: string
  mail?: string
  url?: string
  avatar?: string
  introduce?: string
  socialIds?: Record<string, string | number>
  password?: string
}

export interface ChangePasswordData {
  oldPassword: string
  newPassword: string
}

export interface Session {
  id: string
  ua: string
  ip: string
  lastActiveAt: string
  current?: boolean
}

export const userApi = {
  // 获取当前用户信息
  getMaster: () => request.get<UserModel>('/master'),

  // 检查是否已登录
  checkLogged: () => request.get<{ ok: number }>('/master/check_logged'),

  // 登录
  login: (data: LoginData) =>
    request.post<LoginResponse>('/master/login', { data }),

  // 通过 Token 刷新登录
  loginWithToken: () => request.put<{ token: string }>('/master/login'),

  // 检查是否可登录
  checkAllowLogin: () =>
    request.get<{ allowPassword: boolean; allowPasskey: boolean }>(
      '/user/allow-login',
    ),

  // 获取允许的登录方式（别名）
  getAllowLogin: () =>
    request.get<{
      password: boolean
      passkey: boolean
      github: boolean
      google: boolean
    }>('/user/allow-login'),

  // 更新用户信息
  updateMaster: (data: UpdateUserData) =>
    request.patch<UserModel>('/master', { data }),

  // 修改密码
  changePassword: (data: ChangePasswordData) =>
    request.patch<void>('/master/password', { data }),

  // 登出
  logout: (params?: { all?: boolean }) =>
    request.post<void>('/user/logout', { params }),

  // 获取会话列表
  getSessions: () => request.get<{ data: Session[] }>('/user/session'),

  // 删除指定会话
  deleteSession: (id: string) => request.delete<void>(`/user/session/${id}`),

  // 删除所有其他会话
  deleteAllSessions: () => request.delete<void>('/user/session/all'),
}
