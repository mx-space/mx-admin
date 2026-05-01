import { request } from '~/utils/request'

export const healthApi = {
  // 发送测试邮件
  sendTestEmail: () =>
    request.get<{ message?: string; trace?: string }>('/health/email/test'),
}
