import { request } from '~/utils/request'

export interface CronJob {
  name: string
  description?: string
  cron: string
  enabled: boolean
  nextRunTime?: string
  lastRunTime?: string
}

export interface LogFile {
  filename: string
  name: string
  size: string
  type: string
  modified: string
}

export const healthApi = {
  // === Cron 任务管理 ===

  // 获取 Cron 任务列表（后端使用 @Bypass 直接返回对象）
  getCronList: () => request.get<Record<string, CronJob>>('/health/cron'),

  // 手动运行 Cron 任务
  runCron: (name: string) => request.post<void>(`/health/cron/run/${name}`),

  // === 日志管理 ===

  // 获取日志文件列表（响应会被自动解包）
  getLogList: () => request.get<LogFile[]>('/health/log'),

  // 获取日志文件内容
  getLogContent: (filename: string) =>
    request.get<string>(`/health/log/${filename}`),

  // 删除日志文件
  deleteLog: (filename: string) =>
    request.delete<void>(`/health/log/${filename}`),

  // 清空日志文件
  clearLog: (filename: string) =>
    request.put<void>(`/health/log/${filename}/clear`),
}
