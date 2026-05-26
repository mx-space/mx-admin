export function formatNullableDate(value: string | null | undefined) {
  if (!value) return '下次执行：未提供'

  return `下次执行：${formatDateTime(value)}`
}

export function formatDateTime(value: number | string) {
  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatLogTime(value: number) {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value))
}

export function formatRelativeDate(value: number) {
  const diff = Date.now() - value
  const absolute = Math.abs(diff)
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (absolute < minute) return '刚刚'
  if (absolute < hour) return `${Math.round(diff / minute)} 分钟前`
  if (absolute < day) return `${Math.round(diff / hour)} 小时前`

  return formatDateTime(value)
}
