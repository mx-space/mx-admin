import { URL_REGEX, URL_TAIL_TRIM } from '../constants'

export function extractUrls(text: string): string[] {
  const matches = text.match(URL_REGEX)
  if (!matches) return []

  const seen = new Set<string>()
  const result: string[] = []

  for (let url of matches) {
    while (URL_TAIL_TRIM.test(url)) {
      url = url.replace(URL_TAIL_TRIM, '')
    }

    if (url && !seen.has(url)) {
      seen.add(url)
      result.push(url)
    }
  }

  return result
}

export function cleanErrorMessage(raw: string | null | undefined): string {
  if (!raw) return '解析失败'

  let message = raw.replace(/https?:\/\/\S+/g, '').trim()

  if (/\(404\)|\b404\b/.test(message)) {
    return '404 - 资源不存在，或私有内容无访问权'
  }

  if (/\b401\b|\b403\b|unauthor|forbidden/i.test(message)) {
    return '401/403 - 凭证缺失或权限不足'
  }

  if (/Provider disabled/i.test(message)) {
    return '未启用对应 provider，或链接未匹配任何 provider'
  }

  if (/Token missing/i.test(message)) {
    return '此 provider 需配置凭证'
  }

  message = message.replace(/[\s-]+$/, '').trim()

  return message.length > 100
    ? `${message.slice(0, 100)}...`
    : message || '解析失败'
}

export function hostnameOf(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, '')
  } catch {
    return value
  }
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}
