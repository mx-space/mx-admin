import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  ExternalLink,
  ImageIcon,
  Loader2,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import type { EnrichmentRow, EnrichmentRowDetail } from '~/models/enrichment'

import {
  getEnrichmentById,
  invalidateEnrichment,
  refreshEnrichment,
} from '~/api/enrichment'
import { Button } from '~/ui/button'
import { cn } from '~/ui/cn'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '~/ui/layout'
import { Scroll } from '~/ui/scroll'
import { relativeTimeFromNow } from '~/utils/time'

import { enrichmentQueryKey } from '../constants'
import { formatBytes, getErrorMessage } from '../utils/enrichment'
import {
  Code,
  DetailBlock,
  DetailLoading,
  Field,
  JsonBlock,
  ProviderBadge,
  SmallBadge,
} from './EnrichmentPrimitives'

export function CacheDetailPanel(props: {
  fallback: EnrichmentRow | null
  id: string
  invalidateAll: () => Promise<void>
  onBack: () => void
  onJumpToScreenshot: (id: string) => void
}) {
  const queryClient = useQueryClient()
  const detailQuery = useQuery({
    initialData: props.fallback
      ? {
          ...props.fallback,
          capture: null,
        }
      : undefined,
    queryFn: () => getEnrichmentById(props.id),
    queryKey: [...enrichmentQueryKey, 'cache', 'detail', props.id],
  })

  const row = detailQuery.data
  const refreshMutation = useMutation({
    mutationFn: () => {
      if (!row) throw new Error('数据未加载')
      return refreshEnrichment(row.provider, row.externalId, row.locale)
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '刷新失败')),
    onSuccess: async () => {
      toast.success('已刷新')
      await queryClient.invalidateQueries({ queryKey: enrichmentQueryKey })
    },
  })
  const invalidateMutation = useMutation({
    mutationFn: () => {
      if (!row) throw new Error('数据未加载')
      return invalidateEnrichment(row.provider, row.externalId)
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '失效失败')),
    onSuccess: async () => {
      toast.success('已失效')
      await props.invalidateAll()
    },
  })

  if (!row) {
    return <DetailLoading label="缓存详情加载中" />
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={cn(
          'flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800',
          APP_SHELL_HEADER_HEIGHT_CLASS,
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <button
            className="inline-flex size-8 items-center justify-center rounded text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 lg:hidden dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-50"
            onClick={props.onBack}
            type="button"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
          </button>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <ProviderBadge provider={row.provider} />
              <h2 className="truncate text-base font-semibold text-neutral-950 dark:text-neutral-50">
                {row.normalized.title || row.url}
              </h2>
              {detailQuery.isFetching ? (
                <Loader2
                  aria-hidden="true"
                  className="size-3.5 animate-spin text-neutral-400"
                />
              ) : null}
            </div>
            <p className="mt-1 truncate text-sm text-neutral-500 dark:text-neutral-400">
              {row.url}
            </p>
          </div>
        </div>
        <a
          className="inline-flex size-9 items-center justify-center rounded border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
          href={row.url}
          rel="noreferrer"
          target="_blank"
          title="打开原始链接"
        >
          <ExternalLink aria-hidden="true" className="size-4" />
        </a>
      </div>

      <Scroll className="flex-1" innerClassName="px-5 py-4">
        <NormalizedPreview row={row} />

        {row.capture ? (
          <DetailBlock title="截图">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                <span>
                  {row.capture.width} x {row.capture.height}
                </span>
                <span>{formatBytes(row.capture.bytes)}</span>
                <span>创建于 {relativeTimeFromNow(row.capture.createdAt)}</span>
                <span>
                  最近访问 {relativeTimeFromNow(row.capture.lastAccessedAt)}
                </span>
              </div>
              <Button
                onClick={() => props.onJumpToScreenshot(row.id)}
                type="button"
                variant="subtle"
              >
                <ImageIcon aria-hidden="true" className="size-4" />
                查看截图
              </Button>
            </div>
          </DetailBlock>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
          <Field label="External ID">
            <Code>{row.externalId}</Code>
          </Field>
          <Field label="Locale">{row.locale || 'default'}</Field>
          <Field label="抓取时间">{relativeTimeFromNow(row.fetchedAt)}</Field>
          <Field label="过期时间">
            {row.expiresAt ? relativeTimeFromNow(row.expiresAt) : '-'}
          </Field>
          <Field label="失败次数">
            <span className="tabular-nums">{row.failureCount}</span>
          </Field>
          <Field label="最后错误">{row.lastError || '-'}</Field>
        </div>

        <DetailBlock title="Raw">
          <JsonBlock value={row.raw} />
        </DetailBlock>
      </Scroll>

      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-neutral-200 px-5 py-4 dark:border-neutral-800">
        <Button
          disabled={refreshMutation.isPending}
          onClick={() => refreshMutation.mutate()}
          type="button"
          variant="subtle"
        >
          {refreshMutation.isPending ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <RefreshCw aria-hidden="true" className="size-4" />
          )}
          刷新
        </Button>
        <Button
          className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-950 dark:text-red-400 dark:hover:bg-red-950/30"
          disabled={invalidateMutation.isPending}
          onClick={() => {
            if (window.confirm('确认失效此缓存项？')) {
              invalidateMutation.mutate()
            }
          }}
          type="button"
          variant="subtle"
        >
          {invalidateMutation.isPending ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Trash2 aria-hidden="true" className="size-4" />
          )}
          失效
        </Button>
      </div>
    </div>
  )
}

function NormalizedPreview(props: { row: EnrichmentRowDetail }) {
  const result = props.row.normalized
  const image =
    result.previewImage ?? result.thumbnailImage ?? result.captureImage

  return (
    <section className="grid gap-4 border-b border-neutral-200 pb-5 md:grid-cols-[12rem_minmax(0,1fr)] dark:border-neutral-800">
      <div className="flex aspect-video items-center justify-center overflow-hidden rounded bg-neutral-100 dark:bg-neutral-900">
        {image?.url ? (
          <img
            alt={image.alt ?? result.title}
            className="h-full w-full object-cover"
            src={image.url}
          />
        ) : (
          <ImageIcon aria-hidden="true" className="size-8 text-neutral-300" />
        )}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <SmallBadge>{result.category}</SmallBadge>
          {result.subtype ? <SmallBadge>{result.subtype}</SmallBadge> : null}
        </div>
        <h3 className="mt-3 text-base font-semibold text-neutral-950 dark:text-neutral-50">
          {result.title || props.row.url}
        </h3>
        {result.description ? (
          <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
            {result.description}
          </p>
        ) : null}
        {result.attributes?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {result.attributes.slice(0, 8).map((attribute) => (
              <SmallBadge key={`${attribute.key}-${attribute.value}`}>
                {attribute.label ?? attribute.key}: {String(attribute.value)}
              </SmallBadge>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
