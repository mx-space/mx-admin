import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  ExternalLink,
  Hammer,
  Layers,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import type { ReactNode } from 'react'
import type {
  SearchDocumentAdminRow,
  SearchIndexRefType,
} from '../api/search-index'

import {
  getSearchIndexDocuments,
  rebuildSearchIndex,
  rebuildSearchIndexDocument,
} from '../api/search-index'
import { Button } from '../ui/button'
import { cn } from '../ui/cn'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '../ui/layout'
import { MasterDetailLayout } from '../ui/page-layout'
import { Scroll } from '../ui/scroll'
import { SelectField } from '../ui/select'
import { TextInput } from '../ui/text-field'

const searchIndexQueryKey = ['search-index']

const refTypeOptions: Array<{
  label: string
  value: SearchIndexRefType | ''
}> = [
  { label: '全部类型', value: '' },
  { label: '博文 post', value: 'post' },
  { label: '手记 note', value: 'note' },
  { label: '页面 page', value: 'page' },
]

const refTypeLabel: Record<string, string> = {
  note: '手记',
  page: '页面',
  post: '博文',
}

const refTypeClassNames: Record<string, string> = {
  note: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300',
  page: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300',
  post: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300',
}

export function SearchIndexPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [refTypeFilter, setRefTypeFilter] = useState<SearchIndexRefType | ''>(
    '',
  )
  const [langFilter, setLangFilter] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const selectedId = searchParams.get('id')
  const [showDetailOnMobile, setShowDetailOnMobile] = useState(() =>
    Boolean(selectedId),
  )
  const queryParams = {
    keyword: keyword || undefined,
    lang: langFilter || undefined,
    page,
    refType: refTypeFilter || undefined,
    size: pageSize,
  }

  const documentsQuery = useQuery({
    placeholderData: (previous) => previous,
    queryFn: () => getSearchIndexDocuments(queryParams),
    queryKey: [...searchIndexQueryKey, queryParams],
  })

  const rows = useMemo(
    () => documentsQuery.data?.data ?? [],
    [documentsQuery.data],
  )
  const total = documentsQuery.data?.pagination.total ?? 0
  const pageCount = documentsQuery.data?.pagination.totalPage ?? 1
  const selectedRow = rows.find((row) => row.id === selectedId) ?? null

  const rebuildAllMutation = useMutation({
    mutationFn: rebuildSearchIndex,
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, '重建失败'))
    },
    onSuccess: async (result, force) => {
      toast.success(
        `${force ? '全量' : '增量'}重建完成 · total ${result.total} · +${result.created} ~${result.updated} -${result.deleted} =${result.skipped}`,
      )
      await queryClient.invalidateQueries({ queryKey: searchIndexQueryKey })
    },
  })

  const rebuildOneMutation = useMutation({
    mutationFn: (row: SearchDocumentAdminRow) =>
      rebuildSearchIndexDocument(row.refType, row.refId),
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, '重建失败'))
    },
    onSuccess: async (result) => {
      toast.success(`已重建 ${result.rebuilt} 行`)
      await queryClient.invalidateQueries({ queryKey: searchIndexQueryKey })
    },
  })

  const commitKeyword = () => {
    setKeyword(keywordInput.trim())
    setPage(1)
  }

  const resetFilters = () => {
    setRefTypeFilter('')
    setLangFilter('')
    setKeywordInput('')
    setKeyword('')
    setPage(1)
  }

  const selectRow = (row: SearchDocumentAdminRow) => {
    setSearchParams({ id: row.id })
    setShowDetailOnMobile(true)
  }

  const rebuildSelected = () => {
    if (!selectedRow) return
    rebuildOneMutation.mutate(selectedRow)
  }

  const selectedRebuilding =
    rebuildOneMutation.isPending &&
    rebuildOneMutation.variables?.id === selectedRow?.id

  return (
    <MasterDetailLayout
      defaultSize={40}
      maxSize={50}
      minSize={30}
      showDetailOnMobile={showDetailOnMobile}
      list={
        <section className="flex min-h-0 flex-col border-b border-neutral-200 lg:border-b-0 lg:border-r dark:border-neutral-800">
          <div
            className={cn(
              'flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800',
              APP_SHELL_HEADER_HEIGHT_CLASS,
            )}
          >
            <div className="min-w-0">
              <h2 className="text-sm font-medium">搜索索引</h2>
            </div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {total} 条
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                disabled={rebuildAllMutation.isPending}
                onClick={() => {
                  if (
                    window.confirm(
                      '按 sourceHash 比对，仅 upsert 变更行并清理孤立条目。',
                    )
                  ) {
                    rebuildAllMutation.mutate(false)
                  }
                }}
                type="button"
                variant="subtle"
              >
                {rebuildAllMutation.isPending &&
                rebuildAllMutation.variables === false ? (
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <Layers aria-hidden="true" className="size-4" />
                )}
                增量重建
              </Button>
              <Button
                className="text-amber-700 dark:text-amber-300"
                disabled={rebuildAllMutation.isPending}
                onClick={() => {
                  if (
                    window.confirm(
                      '将清空 search 表后重建全部文档，搜索功能将短暂不可用，确认继续？',
                    )
                  ) {
                    rebuildAllMutation.mutate(true)
                  }
                }}
                type="button"
                variant="subtle"
              >
                {rebuildAllMutation.isPending &&
                rebuildAllMutation.variables === true ? (
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <Hammer aria-hidden="true" className="size-4" />
                )}
                全量重建
              </Button>
              <Button
                disabled={documentsQuery.isFetching}
                onClick={() => {
                  void documentsQuery.refetch()
                }}
                type="button"
                variant="subtle"
              >
                <RefreshCw
                  aria-hidden="true"
                  className={cn(
                    'size-4',
                    documentsQuery.isFetching && 'animate-spin',
                  )}
                />
                刷新
              </Button>
            </div>
          </div>

          <form
            className="flex flex-col gap-2 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800"
            onSubmit={(event) => {
              event.preventDefault()
              commitKeyword()
            }}
          >
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
              />
              <TextInput
                controlClassName="h-9 pl-9 focus:border-neutral-400 focus:ring-0"
                onChange={setKeywordInput}
                placeholder="标题 / 正文关键词"
                value={keywordInput}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <SelectField
                aria-label="索引类型过滤"
                onValueChange={(value) => {
                  setRefTypeFilter(value)
                  setPage(1)
                }}
                options={refTypeOptions}
                value={refTypeFilter}
              />
              <TextInput
                controlClassName="h-9 focus:border-neutral-400 focus:ring-0"
                onChange={(value) => {
                  setLangFilter(value)
                  setPage(1)
                }}
                placeholder="lang (zh/en)"
                value={langFilter}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={resetFilters} type="button" variant="subtle">
                重置
              </Button>
              <Button type="submit">应用</Button>
            </div>
          </form>

          <Scroll className="flex-1">
            {documentsQuery.isLoading && rows.length === 0 ? (
              <SearchIndexSkeleton />
            ) : rows.length === 0 ? (
              <SearchIndexEmptyState />
            ) : (
              rows.map((row) => (
                <SearchIndexRow
                  key={row.id}
                  onSelect={() => selectRow(row)}
                  row={row}
                  selected={selectedId === row.id}
                />
              ))
            )}
          </Scroll>

          {pageCount > 1 ? (
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <SelectField
                aria-label="每页数量"
                onValueChange={(value) => {
                  setPageSize(value)
                  setPage(1)
                }}
                options={[20, 50, 100].map((size) => ({
                  label: `${size} / 页`,
                  value: size,
                }))}
                triggerClassName="h-8 text-xs"
                value={pageSize}
              />
              <div className="flex items-center gap-2">
                <Button
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  type="button"
                  variant="subtle"
                >
                  上一页
                </Button>
                <span className="text-xs tabular-nums text-neutral-500">
                  {page} / {pageCount}
                </span>
                <Button
                  disabled={page >= pageCount}
                  onClick={() =>
                    setPage((current) => Math.min(pageCount, current + 1))
                  }
                  type="button"
                  variant="subtle"
                >
                  下一页
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      }
      detail={
        <section className="min-h-0">
          {selectedRow ? (
            <SearchIndexDetail
              onBack={() => setShowDetailOnMobile(false)}
              onRebuild={rebuildSelected}
              rebuilding={selectedRebuilding}
              row={selectedRow}
            />
          ) : (
            <SearchIndexDetailEmptyState />
          )}
        </section>
      }
    />
  )
}

function SearchIndexRow(props: {
  onSelect: () => void
  row: SearchDocumentAdminRow
  selected: boolean
}) {
  const row = props.row

  return (
    <button
      className={cn(
        'flex w-full cursor-pointer items-start gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors last:border-b-0 dark:border-neutral-800/50',
        props.selected
          ? 'bg-neutral-100 dark:bg-neutral-900'
          : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/70',
      )}
      onClick={props.onSelect}
      type="button"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <RefTypeBadge refType={row.refType} />
          {row.lang ? <SmallBadge>{row.lang}</SmallBadge> : null}
          {!row.isPublished ? (
            <SmallBadge tone="warning">未发布</SmallBadge>
          ) : null}
          {row.hasPassword ? <SmallBadge>密码</SmallBadge> : null}
        </div>
        <h3 className="truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
          {row.title || <span className="text-neutral-400">(无标题)</span>}
        </h3>
        <div className="text-xs tabular-nums text-neutral-400">
          title {row.titleLength} · body {row.bodyLength}
        </div>
      </div>
      <div className="shrink-0 text-xs text-neutral-500 dark:text-neutral-400">
        {formatRelativeDate(row.modifiedAt)}
      </div>
    </button>
  )
}

function SearchIndexDetail(props: {
  onBack: () => void
  onRebuild: () => void
  rebuilding: boolean
  row: SearchDocumentAdminRow
}) {
  const row = props.row
  const editUrl = buildEditUrl(row.refType, row.refId)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={cn(
          'flex shrink-0 items-center gap-2 border-b border-neutral-200 px-4 dark:border-neutral-800',
          APP_SHELL_HEADER_HEIGHT_CLASS,
        )}
      >
        <button
          className="inline-flex size-8 items-center justify-center rounded text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 lg:hidden dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-50"
          onClick={props.onBack}
          type="button"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
        </button>
        <RefTypeBadge refType={row.refType} />
        <h2 className="min-w-0 flex-1 truncate text-base font-semibold text-neutral-950 dark:text-neutral-50">
          {row.title || <span className="text-neutral-400">(无标题)</span>}
        </h2>
      </div>

      <Scroll className="flex-1" innerClassName="px-5 py-4">
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
          <Field label="refId">
            <Code>{row.refId}</Code>
          </Field>
          <Field label="主语言">
            {row.lang ? <SmallBadge>{row.lang}</SmallBadge> : '默认'}
          </Field>
          <Field label="sourceHash">
            <Code title={row.sourceHash}>{row.sourceHash || '-'}</Code>
          </Field>
          <Field label="发布状态">
            <div className="flex flex-wrap items-center gap-1.5">
              {row.isPublished ? (
                <SmallBadge tone="success">已发布</SmallBadge>
              ) : (
                <SmallBadge tone="warning">未发布</SmallBadge>
              )}
              {row.hasPassword ? <SmallBadge>密码保护</SmallBadge> : null}
            </div>
          </Field>
          <Field label="标题长度">
            <span className="tabular-nums">{row.titleLength}</span>
          </Field>
          <Field label="正文长度">
            <span className="tabular-nums">{row.bodyLength}</span>
          </Field>
          <Field label="最后修改">{formatRelativeDate(row.modifiedAt)}</Field>
          <Field label="创建">{formatRelativeDate(row.createdAt)}</Field>
          {row.publicAt ? (
            <Field label="公开时间">{formatDateTime(row.publicAt)}</Field>
          ) : null}
        </div>
      </Scroll>

      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-neutral-200 px-5 py-4 dark:border-neutral-800">
        {editUrl ? (
          <Link
            className="outline-hidden inline-flex h-9 items-center justify-center gap-2 rounded border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-[var(--color-primary-shallow)] dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-900"
            to={editUrl}
          >
            <ExternalLink aria-hidden="true" className="size-4" />
            查看原文
          </Link>
        ) : null}
        <Button
          disabled={props.rebuilding}
          onClick={props.onRebuild}
          type="button"
        >
          {props.rebuilding ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <RotateCcw aria-hidden="true" className="size-4" />
          )}
          重建
        </Button>
      </div>
    </div>
  )
}

function RefTypeBadge(props: { refType: string }) {
  return (
    <span
      className={cn(
        'inline-flex rounded border px-2 py-1 text-xs font-medium',
        refTypeClassNames[props.refType] ??
          'border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300',
      )}
    >
      {refTypeLabel[props.refType] ?? props.refType}
    </span>
  )
}

function SmallBadge(props: {
  children: ReactNode
  tone?: 'default' | 'success' | 'warning'
}) {
  const tone = props.tone ?? 'default'
  const className = {
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

function Field(props: { children: ReactNode; label: string }) {
  return (
    <div className="min-w-0 space-y-1">
      <div className="text-xs text-neutral-500 dark:text-neutral-400">
        {props.label}
      </div>
      <div className="text-neutral-950 dark:text-neutral-50">
        {props.children}
      </div>
    </div>
  )
}

function Code(props: { children: ReactNode; title?: string }) {
  return (
    <code
      className="block truncate rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
      title={props.title}
    >
      {props.children}
    </code>
  )
}

function SearchIndexSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          className="h-20 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900"
          key={index}
        />
      ))}
    </div>
  )
}

function SearchIndexEmptyState() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
      <Search
        aria-hidden="true"
        className="mb-4 size-10 text-neutral-300 dark:text-neutral-700"
      />
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        暂无匹配的索引行
      </p>
    </div>
  )
}

function SearchIndexDetailEmptyState() {
  return (
    <div className="flex h-full min-h-72 flex-col items-center justify-center px-6 text-center">
      <Search
        aria-hidden="true"
        className="mb-4 size-10 text-neutral-300 dark:text-neutral-700"
      />
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        请从左侧选择一条索引行
      </p>
    </div>
  )
}

function buildEditUrl(refType: string, refId: string) {
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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

function formatRelativeDate(value: string) {
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

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}
