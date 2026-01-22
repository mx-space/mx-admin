import { request } from '~/utils/request'

export interface CronJob {
  name: string
  description?: string
  cron: string
  enabled: boolean
  nextRunTime?: string
  lastRunTime?: string
}

export const healthApi = {
  // === Cron 任务管理 ===

  // 获取 Cron 任务列表（后端使用 @Bypass 直接返回对象）
  getCronList: () => request.get<Record<string, CronJob>>('/health/cron'),

  // 手动运行 Cron 任务
  runCron: (name: string) => request.post<void>(`/health/cron/run/${name}`),
}
