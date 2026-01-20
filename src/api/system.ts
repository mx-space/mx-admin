import { request } from '~/utils/request'

export interface AppInfo {
  name: string
  version: string
  hash?: string
}

export interface InitData {
  username: string
  password: string
  name: string
  mail: string
  url: string
}

export interface DebugEventData {
  type: string
  payload: any
}

export interface PtyRecord {
  id: string
  data: any
}

export interface RegisterUserData {
  username: string
  password: string
  name?: string
  mail: string
  url?: string
  avatar?: string
  introduce?: string
}

export const systemApi = {
  // 获取应用信息
  getAppInfo: () => request.get<AppInfo>('/'),

  // 检查是否已初始化（静默错误）
  checkInit: async (): Promise<{ isInit: boolean }> => {
    try {
      return await request.get<{ isInit: boolean }>('/init')
    } catch (error: any) {
      // 404 或 403 表示已初始化
      if (error?.statusCode === 404 || error?.statusCode === 403) {
        return { isInit: true }
      }
      throw error
    }
  },

  // 初始化系统
  init: (data: InitData) => request.post<void>('/init', { data }),

  // 获取初始化默认配置
  getInitDefaultConfigs: () => request.get<any>('/init/configs/default'),

  // 更新初始化配置
  patchInitConfig: (key: string, data: any) =>
    request.patch<void>(`/init/configs/${key}`, { data }),

  // 从备份恢复
  restoreFromBackup: (formData: FormData, timeout?: number) =>
    request.post<void>('/init/restore', { data: formData, timeout }),

  // 注册用户
  registerUser: (data: RegisterUserData) =>
    request.post<void>('/user/register', { data }),

  // === Debug ===

  // 发送调试事件
  sendDebugEvent: (data: DebugEventData) =>
    request.post<void>('/debug/events', { data }),

  // 执行 Serverless 函数
  executeFunction: (data: { code: string; context?: any }) =>
    request.post<any>('/debug/function', { data }),

  // === PTY ===

  // 获取 PTY 记录
  getPtyRecords: () => request.get<PtyRecord[]>('/pty/record'),

  // === 内置函数 ===

  // 执行内置函数
  callBuiltInFunction: (name: string, params?: Record<string, any>) =>
    request.get<any>(`/fn/built-in/${name}`, { params }),

  // 获取函数类型定义
  getFnTypes: () => request.get<string>('/fn/types'),
}
