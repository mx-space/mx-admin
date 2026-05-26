import type { EnrichmentCaptureQuota } from '~/models/enrichment'
import type { EnrichmentSource } from '../types/enrichment'

export function isEnrichmentSource(value: unknown): value is EnrichmentSource {
  return value === 'cache' || value === 'probe' || value === 'screenshots'
}

export function formatBytes(bytes: number | null | undefined) {
  if (bytes == null || Number.isNaN(bytes)) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

export function getRecaptureDisabledReason(
  quota: EnrichmentCaptureQuota | null,
) {
  if (!quota) return '配额信息加载中'
  if (!quota.enabled) return '截图功能未启用'
  if (quota.fetchMode !== 'browser') return '当前抓取模式不支持重新截图'
  return null
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}
