import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpen, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { FormEvent, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import type {
  NoteFilter,
  NoteMetadataUpdate,
  NoteSortKey,
  SortOrder,
} from '../types/notes'

import {
  deleteNote,
  getNotes,
  patchNote,
  patchNotePublish,
  searchNotes,
} from '~/api/notes'
import {
  ContentListHeader,
  ContentListToolbar,
  SortMenu,
} from '~/features/_shared/components/content-list-toolbar'
import { CompactPagination } from '~/ui/data/compact-pagination'
import { ButtonLink } from '~/ui/primitives/button'
import { Scroll } from '~/ui/primitives/scroll'
import { SelectField } from '~/ui/primitives/select'
import { cn } from '~/utils/cn'

import {
  noteFilterOptions,
  noteSortOptions,
  notesPageSize,
  notesQueryKey,
} from '../constants'
import { getErrorMessage } from '../utils/errors'
import { getFilteredNotes } from '../utils/get-filtered-notes'
import {
  readNoteFilter,
  readNoteSortKey,
  readPage,
  readSortOrder,
} from '../utils/search-params'
import { NoteRow } from './NoteRow'
import { NotesEmpty } from './NotesEmpty'
import { NotesError } from './NotesError'
import { NotesSkeleton } from './NotesSkeleton'

export function NotesRouteViewContent() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(readPage(searchParams.get('page')))
  const [keywordInput, setKeywordInput] = useState(
    searchParams.get('keyword') ?? '',
  )
  const [keyword, setKeyword] = useState(searchParams.get('keyword') ?? '')
  const [filter, setFilter] = useState<NoteFilter>(
    readNoteFilter(searchParams.get('filter')),
  )
  const [sortKey, setSortKey] = useState<NoteSortKey>(
    readNoteSortKey(searchParams.get('sort')),
  )
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    readSortOrder(searchParams.get('order')),
  )
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const searchParamsKey = searchParams.toString()

  useLayoutEffect(() => {
    const nextPage = readPage(searchParams.get('page'))
    const nextKeyword = searchParams.get('keyword') ?? ''
    const nextFilter = readNoteFilter(searchParams.get('filter'))
    const nextSortKey = readNoteSortKey(searchParams.get('sort'))
    const nextSortOrder = readSortOrder(searchParams.get('order'))

    setPage((value) => (value === nextPage ? value : nextPage))
    setKeyword((value) => (value === nextKeyword ? value : nextKeyword))
    setKeywordInput((value) => (value === nextKeyword ? value : nextKeyword))
    setFilter((value) => (value === nextFilter ? value : nextFilter))
    setSortKey((value) => (value === nextSortKey ? value : nextSortKey))
    setSortOrder((value) => (value === nextSortOrder ? value : nextSortOrder))
  }, [searchParamsKey])

  const notesQuery = useQuery({
    placeholderData: (previous) => previous,
    queryFn: () =>
      keyword
        ? searchNotes({ keyword, page, size: notesPageSize })
        : filter === 'all'
          ? getNotes({
              page,
              size: notesPageSize,
              sort_by: sortKey,
              sort_order: sortOrder,
            })
          : getFilteredNotes({
              filter,
              page,
              size: notesPageSize,
              sortKey,
              sortOrder,
            }),
    queryKey: [
      ...notesQueryKey,
      'list',
      { filter, keyword, page, size: notesPageSize, sortKey, sortOrder },
    ],
  })

  const notes = notesQuery.data?.data ?? []
  const pagination = notesQuery.data?.pagination

  const invalidateNotes = async () => {
    await queryClient.invalidateQueries({ queryKey: notesQueryKey })
  }

  useEffect(() => {
    const nextParams = new URLSearchParams()
    if (page > 1) nextParams.set('page', String(page))
    if (keyword) nextParams.set('keyword', keyword)
    if (filter !== 'all') nextParams.set('filter', filter)
    if (sortKey !== 'createdAt') nextParams.set('sort', sortKey)
    if (sortOrder !== 'desc') nextParams.set('order', sortOrder)
    if (nextParams.toString() !== searchParamsKey) {
      setSearchParams(nextParams, { replace: true })
    }
  }, [
    filter,
    keyword,
    page,
    searchParamsKey,
    setSearchParams,
    sortKey,
    sortOrder,
  ])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [filter, keyword, page, sortKey, sortOrder])

  const publishMutation = useMutation({
    mutationFn: (payload: { id: string; isPublished: boolean }) =>
      patchNotePublish(payload.id, payload.isPublished),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '更新失败')),
    onSuccess: invalidateNotes,
  })

  const patchMutation = useMutation({
    mutationFn: (payload: { data: NoteMetadataUpdate; id: string }) =>
      patchNote(payload.id, payload.data),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '更新失败')),
    onSuccess: invalidateNotes,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteNote,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '删除失败')),
    onSuccess: async (_, id) => {
      toast.success('手记已删除')
      setSelectedIds((current) => {
        const next = new Set(current)
        next.delete(id)
        return next
      })
      await invalidateNotes()
    },
  })

  const batchDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(ids.map((id) => deleteNote(id)))
      const successfulIds = ids.filter(
        (_, index) => results[index].status === 'fulfilled',
      )

      return {
        failedCount: ids.length - successfulIds.length,
        successfulIds,
        successCount: successfulIds.length,
      }
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '批量删除失败')),
    onSuccess: async ({ failedCount, successfulIds, successCount }) => {
      setSelectedIds((current) => {
        const next = new Set(current)
        successfulIds.forEach((id) => next.delete(id))
        return next
      })
      if (failedCount > 0) {
        toast.warning(`删除完成：成功 ${successCount}，失败 ${failedCount}`)
      } else {
        toast.success(`成功删除 ${successCount} 条手记`)
      }
      await invalidateNotes()
    },
  })

  const selectedCount = selectedIds.size
  const visibleIds = notes.map((note) => note.id)
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id))
  const count = useMemo(() => {
    if (!pagination) return null
    return `${pagination.total} 条`
  }, [pagination])

  const onSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPage(1)
    setKeyword(keywordInput.trim())
  }

  const toggleAllVisible = (checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      for (const id of visibleIds) {
        if (checked) next.add(id)
        else next.delete(id)
      }
      return next
    })
  }

  return (
    <section className="flex h-full min-h-0 flex-col bg-white dark:bg-neutral-950">
      <ContentListHeader
        action={
          <ButtonLink aria-label="新建手记" to="/notes/edit">
            <Plus aria-hidden="true" className="size-4" />
            <span className="hidden sm:inline">新建手记</span>
          </ButtonLink>
        }
        count={count}
        icon={<BookOpen aria-hidden="true" className="size-4" />}
        title="手记"
      />

      <ContentListToolbar
        extraActions={
          <button
            aria-label="刷新手记列表"
            className="outline-hidden inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-[var(--color-primary-shallow)] disabled:pointer-events-none disabled:opacity-50 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
            disabled={notesQuery.isFetching}
            onClick={() => void notesQuery.refetch()}
            type="button"
          >
            <RefreshCw
              aria-hidden="true"
              className={cn(
                'size-3.5',
                notesQuery.isFetching && 'animate-spin',
              )}
            />
          </button>
        }
        filters={
          <SelectField
            aria-label="手记过滤条件"
            disabled={Boolean(keyword)}
            onValueChange={(value) => {
              setFilter(value)
              setPage(1)
            }}
            options={noteFilterOptions}
            triggerClassName="w-28 !h-7 !border-transparent !bg-transparent text-xs hover:!bg-neutral-100 dark:hover:!bg-neutral-900"
            value={filter}
          />
        }
        sortMenu={
          <SortMenu<NoteSortKey>
            disabled={Boolean(keyword)}
            field={sortKey}
            onChange={({ field, order }) => {
              setSortKey(field)
              setSortOrder(order)
              setPage(1)
            }}
            options={noteSortOptions}
            order={sortOrder}
          />
        }
        hasSearch={Boolean(keyword)}
        onClearSearch={() => {
          setKeywordInput('')
          setKeyword('')
          setPage(1)
        }}
        onSearch={onSearch}
        onSearchValueChange={setKeywordInput}
        searchPlaceholder="搜索标题或正文"
        searchValue={keywordInput}
        selection={{
          allVisibleSelected,
          bulkActionDisabled:
            selectedCount === 0 || batchDeleteMutation.isPending,
          bulkActionIcon: <Trash2 aria-hidden="true" className="size-4" />,
          bulkActionLabel: '批量删除',
          hasVisibleItems: notes.length > 0,
          indeterminate: selectedCount > 0 && !allVisibleSelected,
          onBulkAction: () => {
            if (window.confirm(`确认删除选中的 ${selectedCount} 条手记？`)) {
              batchDeleteMutation.mutate(Array.from(selectedIds))
            }
          },
          onToggleAllVisible: toggleAllVisible,
          selectAllLabel: '选择当前页',
          selectedCount,
          selectedLabel: `已选 ${selectedCount} 项`,
        }}
      />

      <Scroll className="min-h-0 flex-1">
        {notesQuery.isLoading && notes.length === 0 ? (
          <NotesSkeleton />
        ) : notesQuery.isError ? (
          <NotesError onRetry={() => void notesQuery.refetch()} />
        ) : notes.length === 0 ? (
          <NotesEmpty filter={filter} keyword={keyword} />
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
            {notes.map((note) => (
              <NoteRow
                key={note.id}
                note={note}
                onDelete={(id) => {
                  if (window.confirm(`确认删除「${note.title}」？`)) {
                    deleteMutation.mutate(id)
                  }
                }}
                onMetadataChange={(id, data) =>
                  patchMutation.mutate({ data, id })
                }
                onPublishChange={(id, isPublished) =>
                  publishMutation.mutate({ id, isPublished })
                }
                onSelectedChange={(checked) => {
                  setSelectedIds((current) => {
                    const next = new Set(current)
                    if (checked) next.add(note.id)
                    else next.delete(note.id)
                    return next
                  })
                }}
                selected={selectedIds.has(note.id)}
              />
            ))}
          </div>
        )}
      </Scroll>

      {pagination && pagination.totalPages > 1 ? (
        <div className="flex shrink-0 items-center justify-end border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <CompactPagination
            onPageChange={setPage}
            onPageSizeChange={() => undefined}
            page={page}
            pageCount={pagination.totalPages}
            pageSize={notesPageSize}
            pageSizes={[notesPageSize]}
          />
        </div>
      ) : null}
    </section>
  )
}
