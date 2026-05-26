import { Braces, FileCode2 } from 'lucide-react'
import type { TemplateTab, TemplateType } from './types/templates'

export const templateQueryKey = ['templates', 'email'] as const

export const templateTabs: Array<{
  icon: typeof FileCode2
  label: string
  value: TemplateTab
}> = [
  { icon: FileCode2, label: '邮件模板', value: 'email' },
  { icon: Braces, label: '预览 Markdown 模板', value: 'markdown' },
]

export const templateTypes: Array<{ label: string; value: TemplateType }> = [
  { label: '回复邮件（访客）', value: 'guest' },
  { label: '回复邮件（博主）', value: 'owner' },
  { label: '订阅邮件', value: 'newsletter' },
]
