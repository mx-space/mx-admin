import type { CreateTopicData } from '~/api/topics'

export function getInitial(value: string) {
  const normalized = value.trim()
  if (!normalized) return '#'
  return normalized.length > 2 ? normalized.slice(0, 2) : normalized
}

export function validateTopicForm(data: CreateTopicData) {
  if (!data.name) return '请输入专栏名称'
  if (data.name.length > 50) return '名称不能超过 50 个字符'
  if (!data.slug) return '请输入专栏 ID'
  if (!/^[\w-]+$/.test(data.slug))
    return 'ID 只能包含字母、数字、下划线和连字符'
  if (!data.introduce) return '请输入简介'
  if (data.introduce.length > 100) return '简介不能超过 100 个字符'
  if (data.description && data.description.length > 500) {
    return '描述不能超过 500 个字符'
  }

  return null
}
