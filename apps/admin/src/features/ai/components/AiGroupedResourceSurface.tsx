import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useEffect, useLayoutEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import type { ArticleInfo } from '~/api/ai'
import type { ReactNode } from 'react'
import type { GroupedItemAction, GroupedResourceItem } from '../types/ai'

import { APP_SHELL_HEADER_HEIGHT_CLASS } from '~/constants/layout'
import { useI18n } from '~/i18n'
import { CompactPagination } from '~/ui/data/compact-pagination'
import { MasterDetailLayout } from '~/ui/layout/page-layout'
import { Button } from '~/ui/primitives/button'
import { Scroll } from '~/ui/primitives/scroll'
import { TextInput } from '~/ui/primitives/text-field'
import { cn } from '~/utils/cn'

import { groupedPageSize } from '../constants'
import {
  formatDateString,
  getErrorMessage,
  getGroupedActionSuccessMessage,
} from '../utils/ai'
import { Code, SmallBadge } from './AiPrimitives'
import {
  GroupedResourceSkeleton,
  ResourceEmpty,
  ResourceError,
} from './GroupedResourceStates'

export function AiGroupedResourceSurface<
  TItem extends GroupedResourceItem,
  TResponse,
>(props: {
  createTask?: (
    article: ArticleInfo,
  ) => Promise<{ created: boolean; taskId: string }>
  createTaskLabel?: string
  deleteItem: (id: string) => Promise<unknown>
  getGroups: (
    response: TResponse,
  ) => Array<{ article: ArticleInfo; items: TItem[] }>
  getPreview: (item: TItem) => string
  headerAction?: ReactNode
  itemActions?: (item: TItem) => GroupedItemAction[]
  queryFn: (params: {
    page: number
    search?: string
    size?: number
  }) => Promise<TResponse>
  queryKey: string
  title: string
}) {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(
    () => searchParams.get('id'),
  )
  const [showDetailOnMobile, setShowDetailOnMobile] = useState(() =>
    Boolean(searchParams.get('id')),
  )
  const searchParamsKey = searchParams.toString()
  const selectedArticleParam = searchParams.get('id')

  const params = {
    page,
    search: search.trim() || undefined,
    size: groupedPageSize,
  }

  const query = useQuery({
    placeholderData: (previous) => previous,
    queryFn: () => props.queryFn(params),
    queryKey: ['ai', props.queryKey, params],
  })

  const groups = query.data ? props.getGroups(query.data) : []
  const pagination = (
    query.data as
      | { pagination?: { total?: number; totalPage?: number } }
      | undefined
  )?.pagination
  const total =
    pagination?.total ??
    groups.reduce((sum, group) => sum + group.items.length, 0)
  const pageCount = Math.max(
    1,
    pagination?.totalPage ?? Math.ceil(total / groupedPageSize),
  )
  const selectedGroup =
    groups.find((group) => group.article.id === selectedArticleId) ?? null

  useLayoutEffect(() => {
    setSelectedArticleId((value) =>
      value === selectedArticleParam ? value : selectedArticleParam,
    )
    setShowDetailOnMobile(Boolean(selectedArticleParam))
  }, [searchParamsKey, selectedArticleParam])

  useEffect(() => {
    const next = new URLSearchParams(searchParams)

    if (selectedArticleId) {
      next.set('id', selectedArticleId)
    } else {
      next.delete('id')
    }

    if (next.toString() !== searchParamsKey) {
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, searchParamsKey, selectedArticleId, setSearchParams])

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['ai', props.queryKey] })
    await queryClient.invalidateQueries({ queryKey: ['ai', 'tasks'] })
  }

  const deleteMutation = useMutation({
    mutationFn: props.deleteItem,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, t('ai.toast.deleteFailed'))),
    onSuccess: async () => {
      toast.success(t('ai.toast.deleted'))
      await invalidate()
    },
  })

  const createMutation = useMutation({
    mutationFn: (article: ArticleInfo) => {
      if (!props.createTask) {
        return Promise.resolve({ created: false, taskId: '' })
      }

      return props.createTask(article)
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, t('ai.toast.taskCreateFailed'))),
    onSuccess: async (result) => {
      if (!result) return
      toast.success(
        result.created ? t('ai.toast.taskCreated') : t('ai.toast.taskExists'),
      )
      await invalidate()
    },
  })

  const itemMutation = useMutation({
    mutationFn: async (action: GroupedItemAction) => ({
      action,
      result: await action.run(),
    }),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, t('ai.toast.taskCreateFailed'))),
    onSuccess: async ({ action, result }) => {
      const message =
        action.getSuccessMessage?.(result, t) ??
        getGroupedActionSuccessMessage(result, t)

      if (message) toast.success(message)
      await invalidate()
    },
  })

  const selectGroup = (articleId: string) => {
    setSelectedArticleId(articleId)
    setShowDetailOnMobile(true)
  }

  return (
    <MasterDetailLayout
      showDetailOnMobile={showDetailOnMobile}
      list={
        <section className="flex h-full min-h-0 flex-col bg-white dark:bg-neutral-950">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <div>
              <h2 className="text-sm font-medium text-neutral-950 dark:text-neutral-50">
                {props.title}
              </h2>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                {t('ai.grouped.recordCount', { count: total })}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative block">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
                />
                <TextInput
                  controlClassName="h-9 w-64 pl-9 focus:border-neutral-400"
                  onChange={(value) => {
                    setSearch(value)
                    setPage(1)
                  }}
                  placeholder={t('ai.filter.searchPlaceholder')}
                  value={search}
                />
              </label>
              {props.headerAction}
              <Button
                disabled={query.isFetching}
                onClick={() => void query.refetch()}
                type="button"
                variant="subtle"
              >
                <RefreshCw
                  aria-hidden="true"
                  className={cn('size-4', query.isFetching && 'animate-spin')}
                />
                {t('ai.action.refresh')}
              </Button>
            </div>
          </div>

          <Scroll className="flex-1">
            {query.isLoading && groups.length === 0 ? (
              <GroupedResourceSkeleton />
            ) : query.isError ? (
              <ResourceError onRetry={() => void query.refetch()} />
            ) : groups.length === 0 ? (
              <ResourceEmpty label={props.title} />
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
                {groups.map((group) => (
                  <article
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 transition-colors',
                      selectedArticleId === group.article.id
                        ? 'bg-neutral-100 dark:bg-neutral-900'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/70',
                    )}
                    key={`${group.article.type}-${group.article.id}`}
                  >
                    <button
                      className="min-w-0 flex-1 text-left"
                      onClick={() => selectGroup(group.article.id)}
                      type="button"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <SmallBadge>{group.article.type}</SmallBadge>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {t('ai.grouped.itemCount', {
                            count: group.items.length,
                          })}
                        </span>
                      </div>
                      <h3 className="mt-2 truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
                        {group.article.title || group.article.id}
                      </h3>
                      <Code>{group.article.id}</Code>
                    </button>
                    {props.createTask ? (
                      <Button
                        className="shrink-0"
                        disabled={createMutation.isPending}
                        onClick={() => createMutation.mutate(group.article)}
                        type="button"
                        variant="subtle"
                      >
                        {createMutation.isPending ? (
                          <Loader2
                            aria-hidden="true"
                            className="size-4 animate-spin"
                          />
                        ) : (
                          <Sparkles aria-hidden="true" className="size-4" />
                        )}
                        {props.createTaskLabel ?? t('ai.action.create')}
                      </Button>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </Scroll>

          {pageCount > 1 ? (
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <span className="text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
                {t('ai.page.pageIndex', { page })}
              </span>
              <CompactPagination
                onPageChange={setPage}
                onPageSizeChange={() => undefined}
                page={page}
                pageCount={pageCount}
                pageSize={groupedPageSize}
                pageSizes={[groupedPageSize]}
              />
            </div>
          ) : null}
        </section>
      }
      detail={
        <section className="h-full min-h-0 bg-white dark:bg-neutral-950">
          {selectedGroup ? (
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
                    onClick={() => setShowDetailOnMobile(false)}
                    type="button"
                  >
                    <ArrowLeft aria-hidden="true" className="size-4" />
                  </button>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <SmallBadge>{selectedGroup.article.type}</SmallBadge>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {t('ai.grouped.itemCount', {
                          count: selectedGroup.items.length,
                        })}
                      </span>
                    </div>
                    <h2 className="mt-1 truncate text-sm font-semibold text-neutral-950 dark:text-neutral-50">
                      {selectedGroup.article.title || selectedGroup.article.id}
                    </h2>
                  </div>
                </div>
                {props.createTask ? (
                  <Button
                    disabled={createMutation.isPending}
                    onClick={() => createMutation.mutate(selectedGroup.article)}
                    type="button"
                    variant="subtle"
                  >
                    {createMutation.isPending ? (
                      <Loader2
                        aria-hidden="true"
                        className="size-4 animate-spin"
                      />
                    ) : (
                      <Sparkles aria-hidden="true" className="size-4" />
                    )}
                    {props.createTaskLabel ?? t('ai.action.create')}
                  </Button>
                ) : null}
              </div>

              <Scroll className="flex-1" innerClassName="px-4 py-4">
                <div className="space-y-3">
                  {selectedGroup.items.map((item) => {
                    const itemActions = props.itemActions?.(item) ?? []

                    return (
                      <div
                        className="rounded border border-neutral-200 p-3 dark:border-neutral-800"
                        key={item.id}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <SmallBadge tone="info">{item.lang}</SmallBadge>
                            <span className="text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
                              {formatDateString(item.createdAt)}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {itemActions.map((action) => (
                              <Button
                                disabled={itemMutation.isPending}
                                key={action.label}
                                onClick={() => itemMutation.mutate(action)}
                                type="button"
                                variant="subtle"
                              >
                                {action.label}
                              </Button>
                            ))}
                            <Button
                              className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-950 dark:text-red-400 dark:hover:bg-red-950/30"
                              disabled={deleteMutation.isPending}
                              onClick={() => {
                                if (
                                  window.confirm(t('ai.confirm.deleteRecord'))
                                ) {
                                  deleteMutation.mutate(item.id)
                                }
                              }}
                              type="button"
                              variant="subtle"
                            >
                              <Trash2 aria-hidden="true" className="size-4" />
                              {t('ai.action.delete')}
                            </Button>
                          </div>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-neutral-700 dark:text-neutral-300">
                          {props.getPreview(item) || '-'}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </Scroll>
            </div>
          ) : (
            <ResourceEmpty
              label={t('ai.empty.itemSelect', { label: props.title })}
            />
          )}
        </section>
      }
    />
  )
}
