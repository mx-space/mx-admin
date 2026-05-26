import { ListPlus, Shield, User } from 'lucide-react'
import type { MetaFieldType, MetaPresetScope } from '~/models/meta-preset'
import type {
  AIProviderType,
  OauthProviderType,
  SettingsGroupSummary,
} from './types/settings'

export const settingsQueryKey = ['settings'] as const
export const metaPresetsQueryKey = ['meta-presets'] as const
export const accountQueryKey = ['settings', 'account'] as const

export const aiProviderTypeOptions: Array<{
  label: string
  value: AIProviderType
}> = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'OpenAI Compatible', value: 'openai-compatible' },
  { label: 'Anthropic', value: 'anthropic' },
  { label: 'OpenRouter', value: 'openrouter' },
]

export const socialOptions = [
  { label: 'GitHub', value: 'github' },
  { label: 'Weibo', value: 'weibo' },
  { label: '网易云', value: 'netease' },
  { label: '哔哩哔哩', value: 'bilibili' },
] as const

export const staticGroupsBefore: SettingsGroupSummary[] = [
  {
    description: '个人资料',
    icon: User,
    key: 'user',
    title: '用户',
    type: 'user',
  },
]

export const staticGroupsAfter: SettingsGroupSummary[] = [
  {
    description: '登录、认证、凭证',
    icon: Shield,
    key: 'account',
    title: '账号安全',
    type: 'account',
  },
  {
    description: '预设模板',
    icon: ListPlus,
    key: 'meta-preset',
    title: 'Meta 预设',
    type: 'meta-preset',
  },
]

export const oauthProviders = [
  { label: 'GitHub', type: 'github' },
  { label: 'Google', type: 'google' },
] as const satisfies Array<{ label: string; type: OauthProviderType }>

export const fieldTypeLabels: Record<MetaFieldType, string> = {
  boolean: '开关',
  checkbox: '复选框',
  'multi-select': '多选',
  number: '数字',
  object: '对象',
  select: '单选',
  tags: '标签',
  text: '文本',
  textarea: '多行文本',
  url: 'URL',
}

export const scopeLabels: Record<MetaPresetScope, string> = {
  both: '通用',
  note: '笔记',
  post: '博文',
}

export const fieldTypeOptions: Array<{ label: string; value: MetaFieldType }> =
  [
    { label: '文本', value: 'text' },
    { label: '多行文本', value: 'textarea' },
    { label: '数字', value: 'number' },
    { label: 'URL', value: 'url' },
    { label: '单选', value: 'select' },
    { label: '多选', value: 'multi-select' },
    { label: '复选框', value: 'checkbox' },
    { label: '标签', value: 'tags' },
    { label: '开关', value: 'boolean' },
    { label: '对象', value: 'object' },
  ]

export const scopeOptions: Array<{ label: string; value: MetaPresetScope }> = [
  { label: '博文', value: 'post' },
  { label: '笔记', value: 'note' },
  { label: '通用', value: 'both' },
]

export const typesWithOptions: MetaFieldType[] = [
  'checkbox',
  'multi-select',
  'select',
]
