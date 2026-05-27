import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Hammer, Layers, Loader2, RefreshCw, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import type {
  SearchDocumentAdminRow,
  SearchIndexRefType,
} from '~/api/search-index'

import {
  getSearchIndexDocuments,
  rebuildSearchIndex,
  rebuildSearchIndexDocument,
} from '~/api/search-index'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '~/constants/layout'
import { useI18n } from '~/i18n'
import { MasterDetailLayout } from '~/ui/layout/page-layout'
import { Button } from '~/ui/primitives/button'
import { Scroll } from '~/ui/primitives/scroll'
import { SelectField } from '~/ui/primitives/select'
import { TextInput } from '~/ui/primitives/text-field'
import { cn } from '~/utils/cn'

import { refTypeOptionKeys, searchIndexQueryKey } from '../constants'
import { getErrorMessage } from '../utils/format'
import { SearchIndexDetail } from './SearchIndexDetail'
import { SearchIndexDetailEmptyState } from './SearchIndexDetailEmptyState'
import { SearchIndexEmptyState } from './SearchIndexEmptyState'
import { SearchIndexRow } from './SearchIndexRow'
import { SearchIndexSkeleton } from './SearchIndexSkeleton'

export function SearchIndexRouteViewContent() {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const refTypeOptions = refTypeOptionKeys.map((opt) => ({
    label: t(opt.labelKey),
    value: opt.value,
  }))
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
      toast.error(getErrorMessage(error, t('searchIndex.toast.rebuildFailed')))
    },
    onSuccess: async (result, force) => {
      toast.success(
        t('searchIndex.toast.rebuildAllDone', {
          created: result.created,
          deleted: result.deleted,
          scope: force
            ? t('searchIndex.scope.full')
            : t('searchIndex.scope.incremental'),
          skipped: result.skipped,
          total: result.total,
          updated: result.updated,
        }),
      )
      await queryClient.invalidateQueries({ queryKey: searchIndexQueryKey })
    },
  })

  const rebuildOneMutation = useMutation({
    mutationFn: (row: SearchDocumentAdminRow) =>
      rebuildSearchIndexDocument(row.refType, row.refId),
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, t('searchIndex.toast.rebuildFailed')))
    },
    onSuccess: async (result) => {
      toast.success(
        t('searchIndex.toast.rebuildOneDone', { count: result.rebuilt }),
      )
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
      showDetailOnMobile={showDetailOnMobile}
      list={
        <section className="flex min-h-0 flex-col">
          <div
            className={cn(
              'flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800',
              APP_SHELL_HEADER_HEIGHT_CLASS,
            )}
          >
            <div className="min-w-0">
              <h2 className="text-sm font-medium">{t('searchIndex.title')}</h2>
            </div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {t('searchIndex.countLabel', { count: total })}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                disabled={rebuildAllMutation.isPending}
                onClick={() => {
                  if (window.confirm(t('searchIndex.confirm.incremental'))) {
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
                {t('searchIndex.action.incrementalRebuild')}
              </Button>
              <Button
                className="text-amber-700 dark:text-amber-300"
                disabled={rebuildAllMutation.isPending}
                onClick={() => {
                  if (window.confirm(t('searchIndex.confirm.full'))) {
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
                {t('searchIndex.action.fullRebuild')}
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
                {t('searchIndex.action.refresh')}
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
                placeholder={t('searchIndex.search.placeholder')}
                value={keywordInput}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <SelectField
                aria-label={t('searchIndex.filter.typeAria')}
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
                placeholder={t('searchIndex.filter.langPlaceholder')}
                value={langFilter}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={resetFilters} type="button" variant="subtle">
                {t('searchIndex.action.resetFilters')}
              </Button>
              <Button type="submit">
                {t('searchIndex.action.applyFilters')}
              </Button>
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
                aria-label={t('searchIndex.pagination.pageSizeAria')}
                onValueChange={(value) => {
                  setPageSize(value)
                  setPage(1)
                }}
                options={[20, 50, 100].map((size) => ({
                  label: t('searchIndex.pagination.pageSize', { size }),
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
                  {t('common.pagination.previousPage')}
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
                  {t('common.pagination.nextPage')}
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
