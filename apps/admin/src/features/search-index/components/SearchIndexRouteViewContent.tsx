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
import { MasterDetailLayout } from '~/ui/layout/page-layout'
import { Button } from '~/ui/primitives/button'
import { Scroll } from '~/ui/primitives/scroll'
import { SelectField } from '~/ui/primitives/select'
import { TextInput } from '~/ui/primitives/text-field'
import { cn } from '~/utils/cn'

import { refTypeOptions, searchIndexQueryKey } from '../constants'
import { getErrorMessage } from '../utils/format'
import { SearchIndexDetail } from './SearchIndexDetail'
import { SearchIndexDetailEmptyState } from './SearchIndexDetailEmptyState'
import { SearchIndexEmptyState } from './SearchIndexEmptyState'
import { SearchIndexRow } from './SearchIndexRow'
import { SearchIndexSkeleton } from './SearchIndexSkeleton'

export function SearchIndexRouteViewContent() {
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
