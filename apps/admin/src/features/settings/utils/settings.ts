import { ListPlus, Mail, Settings, Shield, User } from 'lucide-react'
import type { ConfigFormField } from '~/api/options'
import type { CreateMetaPresetDto, MetaPresetField } from '~/models/meta-preset'
import type {
  AIConfig,
  AIProviderConfig,
  AIProviderType,
} from '../types/settings'

import { aiProviderTypeOptions, typesWithOptions } from '../constants'

export function getGroupIcon(icon: string) {
  const iconMap: Record<string, typeof User> = {
    bell: Mail,
    database: Settings,
    globe: Settings,
    search: Settings,
    settings: Settings,
    shield: Shield,
    sparkles: Settings,
    user: User,
    'file-text': Settings,
    'list-plus': ListPlus,
  }
  return iconMap[icon] ?? Settings
}

export function shouldShowField(
  field: ConfigFormField,
  formData: Record<string, unknown>,
  sectionPrefix: string,
) {
  const showWhen = field.ui.showWhen
  if (!showWhen) return true

  return Object.entries(showWhen).every(([key, expected]) => {
    const actual = getPath(formData, `${sectionPrefix}.${key}`)
    const values = Array.isArray(expected) ? expected : [expected]
    return values.some((value) => String(actual) === String(value))
  })
}

export function getPath(source: unknown, path: string) {
  return path.split('.').reduce<unknown>((current, key) => {
    if (!current || typeof current !== 'object') return undefined
    return (current as Record<string, unknown>)[key]
  }, source)
}

export function setPathImmutable<T extends Record<string, unknown>>(
  source: T,
  path: string,
  value: unknown,
): T {
  const [head, ...rest] = path.split('.')
  if (!head) return source

  if (rest.length === 0) return { ...source, [head]: value }

  const current =
    source[head] && typeof source[head] === 'object'
      ? (source[head] as Record<string, unknown>)
      : {}

  return {
    ...source,
    [head]: setPathImmutable(current, rest.join('.'), value),
  }
}

export function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value ?? {})) as T
}

export function isDeepEqual(left: unknown, right: unknown) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null)
}

export function stringValue(value: unknown) {
  if (value === undefined || value === null) return ''
  return String(value)
}

export function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatDateTimeInputValue(value: Date) {
  const offsetDate = new Date(
    value.getTime() - value.getTimezoneOffset() * 60_000,
  )
  return offsetDate.toISOString().slice(0, 16)
}

export function normalizeAIConfig(value: unknown): AIConfig {
  if (!value || typeof value !== 'object') {
    return { providers: [] }
  }
  const config = value as AIConfig
  return {
    ...config,
    providers: (config.providers ?? []).map((provider) => ({
      apiKey: provider.apiKey ?? '',
      defaultModel: provider.defaultModel ?? '',
      enabled: Boolean(provider.enabled),
      endpoint: provider.endpoint ?? '',
      id: provider.id || crypto.randomUUID(),
      name: provider.name ?? '',
      type: provider.type ?? 'openai',
    })),
  }
}

export function formatAIProviderLabel(provider: AIProviderConfig) {
  const name = provider.name.trim()
  if (name) return name
  return (
    aiProviderTypeOptions.find((option) => option.value === provider.type)
      ?.label ?? provider.type
  )
}

export function getDefaultAIModel(type: AIProviderType) {
  switch (type) {
    case 'anthropic':
      return 'claude-sonnet-4.5'
    case 'openai':
      return 'gpt-5-mini'
    case 'openrouter':
      return 'anthropic/claude-sonnet-4.5'
    case 'openai-compatible':
      return ''
  }
}

export function getAIProviderNamePlaceholder(type: AIProviderType) {
  switch (type) {
    case 'anthropic':
      return '如 Claude Sonnet'
    case 'openai':
      return '如 OpenAI GPT'
    case 'openrouter':
      return '如 OpenRouter'
    case 'openai-compatible':
      return '如 DeepSeek'
  }
}

export function getAIProviderKeyPlaceholder(type: AIProviderType) {
  switch (type) {
    case 'anthropic':
      return 'sk-ant-...'
    case 'openrouter':
      return 'sk-or-...'
    case 'openai':
    case 'openai-compatible':
      return 'sk-...'
  }
}

export function getAIProviderModelPlaceholder(type: AIProviderType) {
  switch (type) {
    case 'anthropic':
      return '如 claude-sonnet-4.5'
    case 'openai':
      return '如 gpt-5-mini'
    case 'openrouter':
      return '如 anthropic/claude-sonnet-4.5'
    case 'openai-compatible':
      return '如 deepseek-chat'
  }
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export function emptyMetaPreset(): CreateMetaPresetDto {
  return {
    enabled: true,
    key: '',
    label: '',
    scope: 'both',
    type: 'text',
  }
}

export function metaPresetToForm(preset: MetaPresetField): CreateMetaPresetDto {
  return {
    allowCustomOption: preset.allowCustomOption,
    children: preset.children,
    description: preset.description ?? '',
    enabled: preset.enabled,
    key: preset.key,
    label: preset.label,
    options: preset.options,
    placeholder: preset.placeholder ?? '',
    scope: preset.scope,
    type: preset.type,
  }
}

export function validateMetaPreset(form: CreateMetaPresetDto) {
  if (!form.key.trim()) return '请输入字段 Key'
  if (!/^[\w-]+$/.test(form.key))
    return 'Key 只能包含字母、数字、下划线和连字符'
  if (!form.label.trim()) return '请输入显示名称'
  if (typesWithOptions.includes(form.type) && !form.options?.length) {
    return '请至少添加一个选项'
  }
  if (form.type === 'object' && !form.children?.length) {
    return '请至少添加一个子字段'
  }
  return null
}
