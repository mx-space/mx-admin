export function buildEditUrl(refType: string, refId: string) {
  switch (refType) {
    case 'note':
      return `/notes/edit?id=${encodeURIComponent(refId)}`
    case 'page':
      return `/pages/edit?id=${encodeURIComponent(refId)}`
    case 'post':
      return `/posts/edit?id=${encodeURIComponent(refId)}`
    default:
      return null
  }
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatRelativeDate(value: string) {
  const date = new Date(value)
  const diff = Date.now() - date.getTime()
  const absolute = Math.abs(diff)
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (Number.isNaN(date.getTime())) return '-'
  if (absolute < minute) return '刚刚'
  if (absolute < hour) return `${Math.round(diff / minute)} 分钟前`
  if (absolute < day) return `${Math.round(diff / hour)} 小时前`

  return formatDateTime(value)
}

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}
