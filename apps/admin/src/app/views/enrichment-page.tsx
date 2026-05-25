import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  DatabaseZap,
  Eraser,
  ExternalLink,
  ImageIcon,
  Loader2,
  RefreshCw,
  Save,
  Search,
  Trash2,
} from 'lucide-react'
import { FormEvent, useEffect, useLayoutEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import type {
  EnrichmentCaptureJoinedRow,
  EnrichmentCaptureQuota,
  EnrichmentProbeResult,
  EnrichmentProviderMeta,
  EnrichmentRow,
  EnrichmentRowDetail,
} from '~/app/models/enrichment'
import type { ReactNode } from 'react'

import { relativeTimeFromNow } from '~/app/utils/time'

import {
  deleteEnrichmentCapture,
  getEnrichmentById,
  getEnrichmentCaptureQuota,
  getEnrichmentCaptures,
  getEnrichmentList,
  getEnrichmentProviders,
  invalidateEnrichment,
  probeEnrichment,
  recaptureEnrichment,
  refreshEnrichment,
} from '../api/enrichment'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { cn } from '../ui/cn'
import { CompactPagination } from '../ui/compact-pagination'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '../ui/layout'
import { MasterDetailLayout } from '../ui/page-layout'
import { Scroll } from '../ui/scroll'
import { SelectField } from '../ui/select'
import { TextInput } from '../ui/text-field'

type EnrichmentSource = 'cache' | 'probe' | 'screenshots'
type CacheFilterMode = 'all' | 'failed'
type ProbeHistoryEntry = {
  createdAt: number
  id: string
  result: EnrichmentProbeResult
  url: string
}

const defaultPageSize = 20
const enrichmentQueryKey = ['enrichment']

function isEnrichmentSource(value: unknown): value is EnrichmentSource {
  return value === 'cache' || value === 'probe' || value === 'screenshots'
}

export function EnrichmentPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchParamsKey = searchParams.toString()
  const initialSourceParam = searchParams.get('source')
  const initialSource = isEnrichmentSource(initialSourceParam)
    ? initialSourceParam
    : 'cache'
  const initialSelectedId = searchParams.get('id')
  const [source, setSource] = useState<EnrichmentSource>(initialSource)
  const [selectedCacheId, setSelectedCacheId] = useState<string | null>(
    initialSource === 'cache' ? initialSelectedId : null,
  )
  const [selectedCaptureId, setSelectedCaptureId] = useState<string | null>(
    initialSource === 'screenshots' ? initialSelectedId : null,
  )
  const [selectedProbeId, setSelectedProbeId] = useState<string | null>(null)
  const [showDetailOnMobile, setShowDetailOnMobile] = useState(
    Boolean(initialSelectedId),
  )
  const [cachePage, setCachePage] = useState(1)
  const [cachePageSize, setCachePageSize] = useState(defaultPageSize)
  const [capturePage, setCapturePage] = useState(1)
  const [capturePageSize, setCapturePageSize] = useState(defaultPageSize)
  const [filterMode, setFilterMode] = useState<CacheFilterMode>('all')
  const [captureSort, setCaptureSort] = useState<
    'bytes' | 'created' | 'last_accessed'
  >('last_accessed')
  const [captureOrder, setCaptureOrder] = useState<'asc' | 'desc'>('desc')
  const [probeHistory, setProbeHistory] = useState<ProbeHistoryEntry[]>([])

  const cacheQuery = useQuery({
    enabled: source === 'cache',
    placeholderData: (previous) => previous,
    queryFn: () =>
      getEnrichmentList({
        onlyFailed: filterMode === 'failed',
        page: cachePage,
        size: cachePageSize,
      }),
    queryKey: [
      ...enrichmentQueryKey,
      'cache',
      { filterMode, page: cachePage, size: cachePageSize },
    ],
  })

  const captureQuery = useQuery({
    enabled: source === 'screenshots',
    placeholderData: (previous) => previous,
    queryFn: () =>
      getEnrichmentCaptures({
        order: captureOrder,
        page: capturePage,
        size: capturePageSize,
        sort: captureSort,
      }),
    queryKey: [
      ...enrichmentQueryKey,
      'captures',
      {
        order: captureOrder,
        page: capturePage,
        size: capturePageSize,
        sort: captureSort,
      },
    ],
  })

  const quotaQuery = useQuery({
    enabled: source === 'screenshots',
    queryFn: getEnrichmentCaptureQuota,
    queryKey: [...enrichmentQueryKey, 'captures', 'quota'],
    staleTime: 30_000,
  })

  const providersQuery = useQuery({
    enabled: source === 'cache',
    queryFn: getEnrichmentProviders,
    queryKey: [...enrichmentQueryKey, 'providers'],
    staleTime: 30_000,
  })

  const cacheRows = cacheQuery.data?.data ?? []
  const cachePager = cacheQuery.data?.pagination
  const selectedCache =
    cacheRows.find((row) => row.id === selectedCacheId) ?? null
  const captureRows = captureQuery.data?.data ?? []
  const capturePager = captureQuery.data?.pagination
  const selectedCapture =
    captureRows.find((row) => row.enrichmentId === selectedCaptureId) ?? null
  const selectedProbe =
    probeHistory.find((entry) => entry.id === selectedProbeId) ?? null

  useLayoutEffect(() => {
    const nextSourceParam = searchParams.get('source')
    const nextSource = isEnrichmentSource(nextSourceParam)
      ? nextSourceParam
      : 'cache'
    const nextSelectedId = searchParams.get('id')

    setSource((value) => (value === nextSource ? value : nextSource))
    setSelectedProbeId(null)

    if (nextSource === 'cache') {
      setSelectedCacheId((value) =>
        value === nextSelectedId ? value : nextSelectedId,
      )
      setSelectedCaptureId(null)
    } else if (nextSource === 'screenshots') {
      setSelectedCacheId(null)
      setSelectedCaptureId((value) =>
        value === nextSelectedId ? value : nextSelectedId,
      )
    } else {
      setSelectedCacheId(null)
      setSelectedCaptureId(null)
    }

    setShowDetailOnMobile(Boolean(nextSelectedId) && nextSource !== 'probe')
  }, [searchParamsKey])

  useEffect(() => {
    const next = new URLSearchParams()
    const selectedId =
      source === 'cache'
        ? selectedCacheId
        : source === 'screenshots'
          ? selectedCaptureId
          : null

    if (source !== 'cache') next.set('source', source)
    if (selectedId) next.set('id', selectedId)

    if (next.toString() !== searchParamsKey) {
      setSearchParams(next, { replace: true })
    }
  }, [
    searchParamsKey,
    selectedCacheId,
    selectedCaptureId,
    setSearchParams,
    source,
  ])

  const setSourceAndReset = (next: EnrichmentSource) => {
    setSource(next)
    setSelectedCacheId(null)
    setSelectedCaptureId(null)
    setSelectedProbeId(null)
    setShowDetailOnMobile(false)
  }

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({ queryKey: enrichmentQueryKey })
  }

  return (
    <MasterDetailLayout
      defaultSize={source === 'probe' ? 28 : 40}
      maxSize={source === 'probe' ? 35 : 50}
      minSize={source === 'probe' ? 22 : 30}
      showDetailOnMobile={showDetailOnMobile}
      list={
        <section className="flex h-full min-h-0 flex-col border-b border-neutral-200 lg:border-b-0 lg:border-r dark:border-neutral-800">
          <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <SourceSwitcher onChange={setSourceAndReset} value={source} />
            {source === 'cache' ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <FilterSegment
                    onChange={(next) => {
                      setFilterMode(next)
                      setCachePage(1)
                    }}
                    value={filterMode}
                  />
                  {providersQuery.data ? (
                    <ProviderStatusBar providers={providersQuery.data} />
                  ) : null}
                </div>
                <Button
                  disabled={cacheQuery.isFetching}
                  onClick={() => void cacheQuery.refetch()}
                  type="button"
                  variant="subtle"
                >
                  <RefreshCw
                    aria-hidden="true"
                    className={cn(
                      'size-4',
                      cacheQuery.isFetching && 'animate-spin',
                    )}
                  />
                  刷新
                </Button>
              </div>
            ) : null}
            {source === 'screenshots' ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <CaptureControls
                  onOrderChange={(next) => {
                    setCaptureOrder(next)
                    setCapturePage(1)
                  }}
                  onSortChange={(next) => {
                    setCaptureSort(next)
                    setCapturePage(1)
                  }}
                  order={captureOrder}
                  sort={captureSort}
                />
                <Button
                  disabled={captureQuery.isFetching}
                  onClick={() => {
                    void captureQuery.refetch()
                    void quotaQuery.refetch()
                  }}
                  type="button"
                  variant="subtle"
                >
                  <RefreshCw
                    aria-hidden="true"
                    className={cn(
                      'size-4',
                      captureQuery.isFetching && 'animate-spin',
                    )}
                  />
                  刷新
                </Button>
              </div>
            ) : null}
          </div>

          {source === 'cache' ? (
            <CacheListPanel
              filterMode={filterMode}
              loading={cacheQuery.isLoading}
              onPageChange={setCachePage}
              onPageSizeChange={(size) => {
                setCachePageSize(size)
                setCachePage(1)
              }}
              onSelect={(row) => {
                setSelectedCacheId(row.id)
                setShowDetailOnMobile(true)
              }}
              page={cachePage}
              pageCount={cachePager?.totalPage ?? 1}
              pageSize={cachePageSize}
              rows={cacheRows}
              selectedId={selectedCacheId}
              total={cachePager?.total ?? 0}
            />
          ) : null}

          {source === 'screenshots' ? (
            <CaptureListPanel
              loading={captureQuery.isLoading}
              onPageChange={setCapturePage}
              onPageSizeChange={(size) => {
                setCapturePageSize(size)
                setCapturePage(1)
              }}
              onSelect={(row) => {
                setSelectedCaptureId(row.enrichmentId)
                setShowDetailOnMobile(true)
              }}
              page={capturePage}
              pageCount={capturePager?.totalPage ?? 1}
              pageSize={capturePageSize}
              quota={
                quotaQuery.data
                  ? `${formatBytes(quotaQuery.data.used.totalBytes)} / ${formatBytes(
                      quotaQuery.data.cap.maxTotalBytes,
                    )}`
                  : null
              }
              rows={captureRows}
              selectedId={selectedCaptureId}
              total={capturePager?.total ?? 0}
            />
          ) : null}

          {source === 'probe' ? (
            <ProbeListPanel
              history={probeHistory}
              onClear={() => {
                setProbeHistory([])
                setSelectedProbeId(null)
                setShowDetailOnMobile(false)
              }}
              onSelect={(entry) => {
                setSelectedProbeId(entry.id)
                setShowDetailOnMobile(true)
              }}
              selectedId={selectedProbeId}
            />
          ) : null}
        </section>
      }
      detail={
        <section className="min-h-0">
          {source === 'cache' ? (
            selectedCacheId ? (
              <CacheDetailPanel
                fallback={selectedCache}
                id={selectedCacheId}
                invalidateAll={invalidateAll}
                onBack={() => setShowDetailOnMobile(false)}
                onJumpToScreenshot={(id) => {
                  setSource('screenshots')
                  setSelectedCacheId(null)
                  setSelectedCaptureId(id)
                  setSelectedProbeId(null)
                  setShowDetailOnMobile(true)
                }}
              />
            ) : (
              <DetailEmpty label="选择缓存项查看详情。" />
            )
          ) : null}

          {source === 'screenshots' ? (
            selectedCapture ? (
              <CaptureDetail
                invalidateAll={invalidateAll}
                onDeleted={(id) => {
                  if (selectedCaptureId === id) {
                    setSelectedCaptureId(null)
                    setShowDetailOnMobile(false)
                  }
                }}
                onBack={() => setShowDetailOnMobile(false)}
                quota={quotaQuery.data ?? null}
                row={selectedCapture}
              />
            ) : (
              <DetailEmpty label="选择截图记录查看详情。" />
            )
          ) : null}

          {source === 'probe' ? (
            <ProbeConsole
              onProbed={(entry) => {
                setProbeHistory((current) => [entry, ...current].slice(0, 20))
                setSelectedProbeId(entry.id)
                setShowDetailOnMobile(true)
              }}
              onBack={() => setShowDetailOnMobile(false)}
              selected={selectedProbe}
            />
          ) : null}
        </section>
      }
    />
  )
}

function SourceSwitcher(props: {
  onChange: (source: EnrichmentSource) => void
  value: EnrichmentSource
}) {
  const items: Array<{ label: string; value: EnrichmentSource }> = [
    { label: '缓存', value: 'cache' },
    { label: '截图', value: 'screenshots' },
    { label: '探针', value: 'probe' },
  ]

  return (
    <div className="inline-flex w-full items-center gap-1 rounded bg-neutral-100/80 p-1 dark:bg-neutral-800/60">
      {items.map((item) => (
        <button
          className={cn(
            'flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors',
            props.value === item.value
              ? 'bg-white text-neutral-950 shadow-sm ring-1 ring-black/[0.04] dark:bg-neutral-700 dark:text-neutral-50 dark:ring-white/10'
              : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200',
          )}
          key={item.value}
          onClick={() => props.onChange(item.value)}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

function FilterSegment(props: {
  onChange: (mode: CacheFilterMode) => void
  value: CacheFilterMode
}) {
  const items: Array<{ label: string; value: CacheFilterMode }> = [
    { label: '全部', value: 'all' },
    { label: '仅失败', value: 'failed' },
  ]

  return (
    <div className="inline-flex items-center gap-0.5 rounded border border-neutral-200 p-0.5 dark:border-neutral-800">
      {items.map((item) => (
        <button
          className={cn(
            'rounded px-2.5 py-1 text-xs transition-colors',
            props.value === item.value
              ? 'bg-neutral-950 text-white dark:bg-neutral-50 dark:text-neutral-950'
              : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800',
          )}
          key={item.value}
          onClick={() => props.onChange(item.value)}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

function CaptureControls(props: {
  onOrderChange: (order: 'asc' | 'desc') => void
  onSortChange: (sort: 'bytes' | 'created' | 'last_accessed') => void
  order: 'asc' | 'desc'
  sort: 'bytes' | 'created' | 'last_accessed'
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <SelectField
        aria-label="截图排序字段"
        onValueChange={props.onSortChange}
        options={[
          { label: '最近访问', value: 'last_accessed' },
          { label: '创建时间', value: 'created' },
          { label: '体积', value: 'bytes' },
        ]}
        value={props.sort}
      />
      <SelectField
        aria-label="截图排序方向"
        onValueChange={props.onOrderChange}
        options={[
          { label: '倒序', value: 'desc' },
          { label: '正序', value: 'asc' },
        ]}
        value={props.order}
      />
    </div>
  )
}

function CacheListPanel(props: {
  filterMode: CacheFilterMode
  loading: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onSelect: (row: EnrichmentRow) => void
  page: number
  pageCount: number
  pageSize: number
  rows: EnrichmentRow[]
  selectedId: null | string
  total: number
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-neutral-200 px-4 py-2 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
        共 {props.total} 条缓存
      </div>
      <Scroll className="flex-1">
        {props.loading && props.rows.length === 0 ? (
          <ListLoading />
        ) : props.rows.length === 0 ? (
          <ListEmpty
            label={props.filterMode === 'failed' ? '没有失败缓存' : '暂无缓存'}
          />
        ) : (
          props.rows.map((row) => (
            <CacheRow
              key={row.id}
              onSelect={() => props.onSelect(row)}
              row={row}
              selected={props.selectedId === row.id}
            />
          ))
        )}
      </Scroll>
      {props.pageCount > 1 ? (
        <div className="flex shrink-0 items-center justify-end border-t border-neutral-200 px-3 py-2 dark:border-neutral-800">
          <CompactPagination
            onPageChange={props.onPageChange}
            onPageSizeChange={props.onPageSizeChange}
            page={props.page}
            pageCount={props.pageCount}
            pageSize={props.pageSize}
          />
        </div>
      ) : null}
    </div>
  )
}

function CacheRow(props: {
  onSelect: () => void
  row: EnrichmentRow
  selected: boolean
}) {
  const row = props.row

  return (
    <button
      className={cn(
        'flex w-full items-start gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors last:border-b-0 dark:border-neutral-800/50',
        props.selected
          ? 'bg-neutral-100 dark:bg-neutral-900'
          : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/70',
      )}
      onClick={props.onSelect}
      type="button"
    >
      <ProviderBadge provider={row.provider} />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
          {row.normalized.title || row.url}
        </h3>
        <p className="mt-1 truncate text-xs text-neutral-500 dark:text-neutral-400">
          {row.normalized.category}
          {row.normalized.subtype ? ` · ${row.normalized.subtype}` : ''}
        </p>
        <p className="mt-1 truncate text-xs text-neutral-400">{row.url}</p>
      </div>
      <div className="shrink-0 text-right text-xs tabular-nums text-neutral-400">
        {row.failureCount > 0 ? (
          <span className="text-red-500">{row.failureCount} 次失败</span>
        ) : (
          relativeTimeFromNow(row.fetchedAt)
        )}
      </div>
    </button>
  )
}

function CacheDetailPanel(props: {
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

function CaptureListPanel(props: {
  loading: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onSelect: (row: EnrichmentCaptureJoinedRow) => void
  page: number
  pageCount: number
  pageSize: number
  quota: null | string
  rows: EnrichmentCaptureJoinedRow[]
  selectedId: null | string
  total: number
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-neutral-200 px-4 py-2 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
        共 {props.total} 张截图
        {props.quota ? ` · ${props.quota}` : ''}
      </div>
      <Scroll className="flex-1">
        {props.loading && props.rows.length === 0 ? (
          <ListLoading />
        ) : props.rows.length === 0 ? (
          <ListEmpty label="暂无截图" />
        ) : (
          props.rows.map((row) => (
            <CaptureRow
              key={row.enrichmentId}
              onSelect={() => props.onSelect(row)}
              row={row}
              selected={props.selectedId === row.enrichmentId}
            />
          ))
        )}
      </Scroll>
      {props.pageCount > 1 ? (
        <div className="flex shrink-0 items-center justify-end border-t border-neutral-200 px-3 py-2 dark:border-neutral-800">
          <CompactPagination
            onPageChange={props.onPageChange}
            onPageSizeChange={props.onPageSizeChange}
            page={props.page}
            pageCount={props.pageCount}
            pageSize={props.pageSize}
            pageSizes={[10, 20, 50]}
          />
        </div>
      ) : null}
    </div>
  )
}

function CaptureRow(props: {
  onSelect: () => void
  row: EnrichmentCaptureJoinedRow
  selected: boolean
}) {
  return (
    <button
      className={cn(
        'flex w-full items-start gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors last:border-b-0 dark:border-neutral-800/50',
        props.selected
          ? 'bg-neutral-100 dark:bg-neutral-900'
          : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/70',
      )}
      onClick={props.onSelect}
      type="button"
    >
      <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded bg-neutral-100 dark:bg-neutral-900">
        <img
          alt=""
          className="h-full w-full object-cover"
          src={props.row.publicUrl}
        />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
          {props.row.title || props.row.url}
        </h3>
        <p className="mt-1 truncate text-xs text-neutral-500 dark:text-neutral-400">
          {props.row.provider} · {formatBytes(props.row.bytes)} ·{' '}
          {props.row.width} x {props.row.height}
        </p>
        <p className="mt-1 truncate text-xs text-neutral-400">
          {props.row.url}
        </p>
      </div>
    </button>
  )
}

function CaptureDetail(props: {
  invalidateAll: () => Promise<void>
  onDeleted: (id: string) => void
  onBack: () => void
  quota: EnrichmentCaptureQuota | null
  row: EnrichmentCaptureJoinedRow
}) {
  const recaptureDisabledReason = getRecaptureDisabledReason(props.quota)
  const recaptureMutation = useMutation({
    mutationFn: () => recaptureEnrichment(props.row.enrichmentId),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '重抓失败')),
    onSuccess: async () => {
      toast.success('已重新抓取')
      await props.invalidateAll()
    },
  })
  const deleteMutation = useMutation({
    mutationFn: () => deleteEnrichmentCapture(props.row.enrichmentId),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '删除失败')),
    onSuccess: async () => {
      toast.success('截图已删除')
      props.onDeleted(props.row.enrichmentId)
      await props.invalidateAll()
    },
  })

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
            <h2 className="truncate text-base font-semibold text-neutral-950 dark:text-neutral-50">
              {props.row.title || props.row.url}
            </h2>
            <p className="mt-1 truncate text-sm text-neutral-500 dark:text-neutral-400">
              {props.row.provider} · {props.quota?.fetchMode ?? 'capture'}
            </p>
          </div>
        </div>
        <a
          className="inline-flex size-9 items-center justify-center rounded border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
          href={props.row.url}
          rel="noreferrer"
          target="_blank"
          title="打开原始链接"
        >
          <ExternalLink aria-hidden="true" className="size-4" />
        </a>
      </div>
      <Scroll className="flex-1" innerClassName="px-5 py-4">
        <div
          className="overflow-hidden rounded border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900"
          style={
            props.row.palette?.dominant
              ? { backgroundColor: props.row.palette.dominant }
              : undefined
          }
        >
          <a
            className="block"
            href={props.row.publicUrl}
            rel="noreferrer"
            target="_blank"
          >
            <img
              alt={props.row.title || props.row.url}
              className="max-h-[32rem] w-full object-contain"
              src={props.row.publicUrl}
            />
          </a>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
          <Field label="Provider">{props.row.provider}</Field>
          <Field label="External ID">
            <Code>{props.row.externalId}</Code>
          </Field>
          <Field label="尺寸">
            {props.row.width} x {props.row.height}
          </Field>
          <Field label="体积">{formatBytes(props.row.bytes)}</Field>
          <Field label="创建时间">
            {relativeTimeFromNow(props.row.createdAt)}
          </Field>
          <Field label="最近访问">
            {relativeTimeFromNow(props.row.lastAccessedAt)}
          </Field>
          <Field label="Object Key">
            <Code>{props.row.objectKey}</Code>
          </Field>
          <Field label="Enrichment ID">
            <Code>{props.row.enrichmentId}</Code>
          </Field>
        </div>
        {props.row.palette?.swatches?.length ? (
          <DetailBlock title="调色板">
            <div className="flex items-center gap-1.5">
              {props.row.palette.swatches.slice(0, 5).map((color) => (
                <span
                  className="block size-7 rounded border border-neutral-200 dark:border-neutral-800"
                  key={color}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </DetailBlock>
        ) : null}
      </Scroll>
      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-neutral-200 px-5 py-4 dark:border-neutral-800">
        <Button
          disabled={recaptureMutation.isPending || !!recaptureDisabledReason}
          onClick={() => recaptureMutation.mutate()}
          title={recaptureDisabledReason ?? '重新截图'}
          type="button"
          variant="subtle"
        >
          {recaptureMutation.isPending ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Camera aria-hidden="true" className="size-4" />
          )}
          重新截图
        </Button>
        <Button
          className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-950 dark:text-red-400 dark:hover:bg-red-950/30"
          disabled={deleteMutation.isPending}
          onClick={() => {
            if (window.confirm('确认删除此截图？')) deleteMutation.mutate()
          }}
          type="button"
          variant="subtle"
        >
          {deleteMutation.isPending ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Trash2 aria-hidden="true" className="size-4" />
          )}
          删除
        </Button>
      </div>
    </div>
  )
}

function ProbeListPanel(props: {
  history: ProbeHistoryEntry[]
  onClear: () => void
  onSelect: (entry: ProbeHistoryEntry) => void
  selectedId: null | string
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2 dark:border-neutral-800">
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {props.history.length} 条探针历史
        </span>
        <Button
          disabled={props.history.length === 0}
          onClick={props.onClear}
          type="button"
          variant="subtle"
        >
          <Eraser aria-hidden="true" className="size-4" />
          清空
        </Button>
      </div>
      <Scroll className="flex-1">
        {props.history.length === 0 ? (
          <ListEmpty label="暂无探针历史" />
        ) : (
          props.history.map((entry) => (
            <button
              className={cn(
                'flex w-full items-start gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors last:border-b-0 dark:border-neutral-800/50',
                props.selectedId === entry.id
                  ? 'bg-neutral-100 dark:bg-neutral-900'
                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/70',
              )}
              key={entry.id}
              onClick={() => props.onSelect(entry)}
              type="button"
            >
              {entry.result.error ? (
                <AlertCircle
                  aria-hidden="true"
                  className="mt-0.5 size-4 text-red-500"
                />
              ) : (
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 size-4 text-emerald-500"
                />
              )}
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
                  {entry.result.matched?.provider ?? 'unknown'}
                </h3>
                <p className="mt-1 truncate text-xs text-neutral-500 dark:text-neutral-400">
                  {entry.url}
                </p>
              </div>
            </button>
          ))
        )}
      </Scroll>
    </div>
  )
}

function ProbeConsole(props: {
  onBack: () => void
  onProbed: (entry: ProbeHistoryEntry) => void
  selected: ProbeHistoryEntry | null
}) {
  const [url, setUrl] = useState('')
  const [useCache, setUseCache] = useState(false)
  const probeMutation = useMutation({
    mutationFn: () => probeEnrichment(url.trim(), useCache),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '探针失败')),
    onSuccess: (result) => {
      const entry = {
        createdAt: Date.now(),
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        result,
        url: url.trim(),
      }
      props.onProbed(entry)
    },
  })

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!url.trim()) return
    probeMutation.mutate()
  }

  const activeResult = probeMutation.data ?? props.selected?.result ?? null

  return (
    <div className="flex h-full min-h-0 flex-col">
      <form
        className="flex shrink-0 flex-col gap-3 border-b border-neutral-200 px-5 py-4 dark:border-neutral-800"
        onSubmit={onSubmit}
      >
        <div className="flex items-center gap-2 lg:hidden">
          <button
            className="inline-flex size-8 items-center justify-center rounded text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-50"
            onClick={props.onBack}
            type="button"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
          </button>
          <span className="text-sm font-medium text-neutral-950 dark:text-neutral-50">
            探针
          </span>
        </div>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
          />
          <TextInput
            controlClassName="h-9 pl-9 focus:border-neutral-400"
            onChange={setUrl}
            placeholder="https://..."
            value={url}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Checkbox
            checked={useCache}
            label="如已有缓存则使用缓存"
            onCheckedChange={setUseCache}
          />
          <Button
            disabled={probeMutation.isPending || !url.trim()}
            type="submit"
          >
            {probeMutation.isPending ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <DatabaseZap aria-hidden="true" className="size-4" />
            )}
            探测
          </Button>
        </div>
      </form>
      <Scroll className="flex-1" innerClassName="px-5 py-4">
        {activeResult ? (
          <ProbeResult result={activeResult} />
        ) : (
          <DetailEmpty label="输入链接后运行探针。" />
        )}
      </Scroll>
    </div>
  )
}

function ProbeResult(props: { result: EnrichmentProbeResult }) {
  const queryClient = useQueryClient()
  const canPersist =
    !props.result.cached && !props.result.error && !!props.result.matched
  const persistMutation = useMutation({
    mutationFn: () => {
      const matched = props.result.matched
      if (!matched) throw new Error('未匹配 provider')
      return refreshEnrichment(matched.provider, matched.externalId)
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '持久化失败')),
    onSuccess: async () => {
      toast.success('已持久化')
      await queryClient.invalidateQueries({ queryKey: enrichmentQueryKey })
    },
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {props.result.error ? (
          <SmallBadge tone="danger">{props.result.error.code}</SmallBadge>
        ) : props.result.matched ? (
          <SmallBadge tone="success">
            {props.result.matched.provider} · {props.result.matched.externalId}
          </SmallBadge>
        ) : (
          <SmallBadge tone="warning">无匹配 provider</SmallBadge>
        )}
        <SmallBadge>{props.result.cached ? '使用缓存' : '强制刷新'}</SmallBadge>
      </div>
      {props.result.error ? (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/40 dark:text-red-300">
          {props.result.error.message}
        </div>
      ) : null}
      {props.result.result ? (
        <section className="rounded border border-neutral-200 p-4 dark:border-neutral-800">
          <h3 className="text-base font-semibold text-neutral-950 dark:text-neutral-50">
            {props.result.result.title}
          </h3>
          {props.result.result.description ? (
            <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
              {props.result.result.description}
            </p>
          ) : null}
        </section>
      ) : null}
      <JsonBlock value={props.result.result ?? props.result} />
      {canPersist ? (
        <div className="flex justify-end">
          <Button
            disabled={persistMutation.isPending}
            onClick={() => persistMutation.mutate()}
            type="button"
          >
            {persistMutation.isPending ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Save aria-hidden="true" className="size-4" />
            )}
            持久化结果
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function ProviderStatusBar(props: { providers: EnrichmentProviderMeta[] }) {
  const ready = props.providers.filter((provider) => provider.ready).length

  return (
    <div className="flex flex-wrap gap-2">
      <SmallBadge
        tone={ready === props.providers.length ? 'success' : 'warning'}
      >
        {ready}/{props.providers.length} ready
      </SmallBadge>
      {props.providers.slice(0, 4).map((provider) => (
        <SmallBadge
          key={provider.name}
          tone={provider.ready ? 'success' : 'default'}
        >
          {provider.displayName}
        </SmallBadge>
      ))}
    </div>
  )
}

function DetailBlock(props: { children: ReactNode; title: string }) {
  return (
    <section className="mt-6">
      <h3 className="mb-2 text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">
        {props.title}
      </h3>
      {props.children}
    </section>
  )
}

function Field(props: { children: ReactNode; label: string }) {
  return (
    <div className="min-w-0 space-y-1">
      <div className="text-xs text-neutral-500 dark:text-neutral-400">
        {props.label}
      </div>
      <div className="min-w-0 text-neutral-950 dark:text-neutral-50">
        {props.children}
      </div>
    </div>
  )
}

function Code(props: { children: ReactNode }) {
  return (
    <code className="block truncate rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
      {props.children}
    </code>
  )
}

function JsonBlock(props: { value: unknown }) {
  return (
    <Scroll
      className="rounded border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900"
      orientation="both"
      viewportClassName="max-h-72"
    >
      <pre className="p-3 text-xs leading-5 text-neutral-800 dark:text-neutral-200">
        {JSON.stringify(props.value, null, 2)}
      </pre>
    </Scroll>
  )
}

function ProviderBadge(props: { provider: string }) {
  return (
    <span className="inline-flex shrink-0 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
      {props.provider}
    </span>
  )
}

function SmallBadge(props: {
  children: ReactNode
  tone?: 'danger' | 'default' | 'success' | 'warning'
}) {
  const tone = props.tone ?? 'default'
  const className = {
    danger:
      'border-red-200 bg-red-50 text-red-700 dark:border-red-950 dark:bg-red-950/40 dark:text-red-300',
    default:
      'border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300',
    success:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300',
    warning:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300',
  }[tone]

  return (
    <span
      className={cn('inline-flex rounded border px-2 py-1 text-xs', className)}
    >
      {props.children}
    </span>
  )
}

function ListLoading() {
  return (
    <div className="flex min-h-[24rem] items-center justify-center">
      <Loader2
        aria-hidden="true"
        className="size-5 animate-spin text-neutral-400"
      />
    </div>
  )
}

function ListEmpty(props: { label: string }) {
  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center px-4 text-center">
      <DatabaseZap aria-hidden="true" className="size-8 text-neutral-300" />
      <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
        {props.label}
      </p>
    </div>
  )
}

function DetailEmpty(props: { label: string }) {
  return (
    <div className="flex h-full min-h-[24rem] flex-col items-center justify-center px-4 text-center">
      <DatabaseZap aria-hidden="true" className="size-8 text-neutral-300" />
      <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
        {props.label}
      </p>
    </div>
  )
}

function DetailLoading(props: { label: string }) {
  return (
    <div className="flex h-full min-h-[24rem] flex-col items-center justify-center px-4 text-center">
      <Loader2
        aria-hidden="true"
        className="size-5 animate-spin text-neutral-400"
      />
      <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
        {props.label}
      </p>
    </div>
  )
}

function formatBytes(bytes: number | null | undefined) {
  if (bytes == null || Number.isNaN(bytes)) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function getRecaptureDisabledReason(quota: EnrichmentCaptureQuota | null) {
  if (!quota) return '配额信息加载中'
  if (!quota.enabled) return '截图功能未启用'
  if (quota.fetchMode !== 'browser') return '当前抓取模式不支持重新截图'
  return null
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}
