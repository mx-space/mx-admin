import { Braces, FileCode2 } from 'lucide-react'
import type { TranslationKey } from '~/i18n/types'
import type { TemplateTab, TemplateType } from './types/templates'

export const templateQueryKey = ['templates', 'email'] as const

export const templateTabs: Array<{
  icon: typeof FileCode2
  labelKey: TranslationKey
  value: TemplateTab
}> = [
  { icon: FileCode2, labelKey: 'templates.tab.email', value: 'email' },
  { icon: Braces, labelKey: 'templates.tab.markdown', value: 'markdown' },
]

export const templateTypeOptions: Array<{
  labelKey: TranslationKey
  value: TemplateType
}> = [
  { labelKey: 'templates.type.guest', value: 'guest' },
  { labelKey: 'templates.type.owner', value: 'owner' },
  { labelKey: 'templates.type.newsletter', value: 'newsletter' },
]
