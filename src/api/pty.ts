import { request } from '~/utils/request'

export interface PTYRecord {
  id: string
  command: string
  output: string
  exitCode?: number
  created: string
  duration?: number
}

export const ptyApi = {
  // 获取 PTY 记录列表
  getRecords: () => request.get<PTYRecord[]>('/pty/record'),

  // 获取单个 PTY 记录
  getRecord: (id: string) => request.get<PTYRecord>(`/pty/record/${id}`),

  // 删除 PTY 记录
  deleteRecord: (id: string) => request.delete<void>(`/pty/record/${id}`),

  // 清空所有记录
  clearRecords: () => request.delete<void>('/pty/record'),
}
