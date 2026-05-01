import { request } from '~/utils/request'

export interface EmailTemplate {
  subject: string
  content: string
  type: string
}

export interface UpdateTemplateData {
  subject?: string
  content?: string
}

export const templatesApi = {
  // 获取邮件模板（后端直接返回模板对象）
  getEmailTemplate: (type: string) =>
    request.get<EmailTemplate>(`/options/email/template`, {
      params: { type },
    }),

  // 更新邮件模板
  updateEmailTemplate: (type: string, data: UpdateTemplateData) =>
    request.put<void>(`/options/email/template`, { data: { ...data, type } }),

  // 删除邮件模板（恢复默认）
  deleteEmailTemplate: (params: { type: string }) =>
    request.delete<void>(`/options/email/template`, { params }),
}
