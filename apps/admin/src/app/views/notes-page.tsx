import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Bookmark,
  BookOpen,
  EyeOff,
  Heart,
  MapPin,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import type { PaginateResult } from '~/app/models/base'
import type { NoteModel } from '~/app/models/note'

import { WEB_URL } from '~/app/constants/env'
import { relativeTimeFromNow } from '~/app/utils/time'

import {
  deleteNote,
  getNotes,
  patchNote,
  patchNotePublish,
  searchNotes,
} from '../api/notes'
import { Button, ButtonLink } from '../ui/button'
import { cn } from '../ui/cn'
import { CompactPagination } from '../ui/compact-pagination'
import {
  ContentEntryListItem,
  ContentListStatusBadge,
} from '../ui/content-list-item'
import {
  ContentListPageHeader,
  ContentListToolbar,
} from '../ui/content-list-toolbar'
import { Scroll } from '../ui/scroll'
import { SelectField } from '../ui/select'

const notesQueryKey = ['notes']
const pageSize = 20
const filteredNotesFetchSize = 100
type NoteFilter = 'all' | 'bookmark' | 'unpublished'
type NoteSortKey = 'createdAt' | 'modifiedAt' | 'mood' | 'title' | 'weather'
type SortOrder = 'asc' | 'desc'

export function NotesPage() {
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
        ? searchNotes({ keyword, page, size: pageSize })
        : filter === 'all'
          ? getNotes({
              page,
              size: pageSize,
              sort_by: sortKey,
              sort_order: sortOrder,
            })
          : getFilteredNotes({
              filter,
              page,
              size: pageSize,
              sortKey,
              sortOrder,
            }),
    queryKey: [
      ...notesQueryKey,
      'list',
      { filter, keyword, page, size: pageSize, sortKey, sortOrder },
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
    mutationFn: (payload: {
      data: { mood?: string | null; weather?: string | null }
      id: string
    }) => patchNote(payload.id, payload.data),
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
  const summary = useMemo(() => {
    const total = pagination?.total ?? 0
    if (keyword) return `搜索：${keyword}，共 ${total} 条`
    if (filter === 'bookmark') return `回忆项，共 ${total} 条`
    if (filter === 'unpublished') return `草稿项，共 ${total} 条`
    return `共 ${total} 条手记`
  }, [filter, keyword, pagination?.total])

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
      <ContentListPageHeader
        action={
          <ButtonLink aria-label="新建手记" to="/notes/edit">
            <Plus aria-hidden="true" className="size-4" />
            <span className="hidden sm:inline">新建手记</span>
          </ButtonLink>
        }
        icon={<BookOpen aria-hidden="true" className="size-4" />}
        summary={summary}
        title="手记"
      />

      <ContentListToolbar
        actions={
          <Button
            aria-label="刷新手记列表"
            className="h-8 px-2.5 text-xs"
            disabled={notesQuery.isFetching}
            onClick={() => void notesQuery.refetch()}
            type="button"
            variant="subtle"
          >
            <RefreshCw
              aria-hidden="true"
              className={cn('size-4', notesQuery.isFetching && 'animate-spin')}
            />
            <span className="hidden sm:inline">
              {notesQuery.isFetching ? '同步中' : '刷新'}
            </span>
          </Button>
        }
        filters={
          <>
            <SelectField
              aria-label="手记过滤条件"
              disabled={Boolean(keyword)}
              onValueChange={(value) => {
                setFilter(value)
                setPage(1)
              }}
              options={[
                { label: '全部手记', value: 'all' },
                { label: '回忆项', value: 'bookmark' },
                { label: '草稿项', value: 'unpublished' },
              ]}
              triggerClassName="w-36 !h-8 text-xs"
              value={filter}
            />
            <SelectField
              aria-label="手记排序字段"
              disabled={Boolean(keyword)}
              onValueChange={(value) => {
                setSortKey(value)
                setPage(1)
              }}
              options={[
                { label: '创建时间', value: 'createdAt' },
                { label: '修改时间', value: 'modifiedAt' },
                { label: '标题', value: 'title' },
                { label: '心情', value: 'mood' },
                { label: '天气', value: 'weather' },
              ]}
              triggerClassName="w-36 !h-8 text-xs"
              value={sortKey}
            />
            <SelectField
              aria-label="手记排序方向"
              disabled={Boolean(keyword)}
              onValueChange={(value) => {
                setSortOrder(value)
                setPage(1)
              }}
              options={[
                { label: '降序', value: 'desc' },
                { label: '升序', value: 'asc' },
              ]}
              triggerClassName="w-28 !h-8 text-xs"
              value={sortOrder}
            />
          </>
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
          selectedLabel: `已选 ${selectedCount} 项`,
        }}
        summary={summary}
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
                deleting={deleteMutation.isPending}
                key={note.id}
                note={note}
                onDelete={(id) => {
                  if (window.confirm(`确认删除「${note.title}」？`)) {
                    deleteMutation.mutate(id)
                  }
                }}
                onPublishChange={(id, isPublished) =>
                  publishMutation.mutate({ id, isPublished })
                }
                onMetadataChange={(id, data) =>
                  patchMutation.mutate({ data, id })
                }
                onSelectedChange={(checked) => {
                  setSelectedIds((current) => {
                    const next = new Set(current)
                    if (checked) next.add(note.id)
                    else next.delete(note.id)
                    return next
                  })
                }}
                publishing={publishMutation.isPending}
                selected={selectedIds.has(note.id)}
                updatingMetadata={patchMutation.isPending}
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
            pageSize={pageSize}
            pageSizes={[pageSize]}
          />
        </div>
      ) : null}
    </section>
  )
}

function NoteRow(props: {
  deleting: boolean
  note: NoteModel
  onDelete: (id: string) => void
  onMetadataChange: (
    id: string,
    data: { mood?: string | null; weather?: string | null },
  ) => void
  onPublishChange: (id: string, isPublished: boolean) => void
  onSelectedChange: (checked: boolean) => void
  publishing: boolean
  selected: boolean
  updatingMetadata: boolean
}) {
  const note = props.note
  const isFuture = note.publicAt && +new Date(note.publicAt) - Date.now() > 0
  const publicHref = `${WEB_URL}${buildNotePublicPath(note)}`
  const title = note.title || '未命名手记'
  const editPath = `/notes/edit?id=${encodeURIComponent(note.id)}`

  return (
    <ContentEntryListItem
      checkboxLabel={`选择手记「${title}」`}
      deleteDisabled={props.deleting}
      deleteTitle="删除手记"
      editTitle="编辑手记"
      editTo={editPath}
      externalHref={publicHref}
      leading={
        <>
          <span className="shrink-0 font-mono text-xs text-neutral-400">
            #{note.nid}
          </span>
          {!note.isPublished || isFuture ? (
            <EyeOff
              aria-hidden="true"
              className="size-3.5 shrink-0 text-neutral-500 dark:text-neutral-400"
            />
          ) : null}
          {note.bookmark ? (
            <Bookmark aria-hidden="true" className="size-3.5 text-red-500" />
          ) : null}
        </>
      }
      meta={
        <>
          <InlineTextEdit
            disabled={props.updatingMetadata}
            label="心情"
            onCommit={(value) =>
              props.onMetadataChange(note.id, { mood: value || null })
            }
            placeholder="心情"
            value={note.mood ?? ''}
          />
          <InlineTextEdit
            disabled={props.updatingMetadata}
            label="天气"
            onCommit={(value) =>
              props.onMetadataChange(note.id, { weather: value || null })
            }
            placeholder="天气"
            value={note.weather ?? ''}
          />
          <span className="font-mono text-xs text-neutral-400 dark:text-neutral-500">
            {note.slug || '-'}
          </span>
          {note.location ? (
            <span className="inline-flex max-w-40 items-center gap-1 truncate">
              <MapPin aria-hidden="true" className="size-3" />
              {note.location}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <BookOpen aria-hidden="true" className="size-3" />
            {formatCompactNumber(note.readCount ?? 0)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Heart aria-hidden="true" className="size-3" />
            {formatCompactNumber(note.likeCount ?? 0)}
          </span>
          <time dateTime={note.createdAt}>
            {relativeTimeFromNow(note.createdAt)}
          </time>
        </>
      }
      onDelete={() => props.onDelete(note.id)}
      onPublishToggle={() => props.onPublishChange(note.id, !note.isPublished)}
      onSelectedChange={props.onSelectedChange}
      openTitle="打开手记"
      publishDisabled={props.publishing}
      publishLabel={note.isPublished ? '下架' : '发布'}
      selected={props.selected}
      status={
        <ContentListStatusBadge active={Boolean(note.isPublished && !isFuture)}>
          {!note.isPublished ? '草稿' : isFuture ? '定时' : '已发布'}
        </ContentListStatusBadge>
      }
      title={title}
      titleTo={editPath}
    />
  )
}

function InlineTextEdit(props: {
  disabled: boolean
  label: string
  onCommit: (value: string) => void
  placeholder: string
  value: string
}) {
  const [value, setValue] = useState(props.value)

  useEffect(() => {
    setValue(props.value)
  }, [props.value])

  const commit = () => {
    const nextValue = value.trim()
    if (nextValue !== props.value) props.onCommit(nextValue)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur()
      return
    }
    if (event.key === 'Escape') {
      setValue(props.value)
      event.currentTarget.blur()
    }
  }

  return (
    <label className="inline-flex items-center gap-1">
      <span className="text-neutral-400 dark:text-neutral-500">
        {props.label}
      </span>
      <input
        aria-label={props.label}
        className="h-7 w-20 rounded border border-neutral-200 bg-white px-2 text-xs text-neutral-700 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-400 disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:focus:border-neutral-600"
        disabled={props.disabled}
        onBlur={commit}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={props.placeholder}
        value={value}
      />
    </label>
  )
}

function NotesSkeleton() {
  return (
    <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
      {Array.from({ length: 8 }).map((_, index) => (
        <div className="px-4 py-3" key={index}>
          <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
          <div className="mt-3 h-3 w-2/3 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
        </div>
      ))}
    </div>
  )
}

function NotesEmpty(props: { filter: NoteFilter; keyword: string }) {
  const isPlainEmpty = !props.keyword && props.filter === 'all'

  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center px-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
      <BookOpen
        aria-hidden="true"
        className="mb-4 size-10 text-neutral-300 dark:text-neutral-700"
      />
      <p>
        {props.keyword
          ? '没有匹配的手记'
          : props.filter === 'bookmark'
            ? '暂无回忆项'
            : props.filter === 'unpublished'
              ? '暂无草稿项'
              : '暂无手记'}
      </p>
      {isPlainEmpty ? (
        <ButtonLink className="mt-4" to="/notes/edit" variant="subtle">
          <Plus aria-hidden="true" className="size-4" />
          创建第一条手记
        </ButtonLink>
      ) : null}
    </div>
  )
}

function NotesError(props: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center px-4 text-center">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        手记加载失败
      </p>
      <Button className="mt-3" onClick={props.onRetry} type="button">
        重试
      </Button>
    </div>
  )
}

function buildNotePublicPath(
  note: Pick<NoteModel, 'createdAt' | 'nid' | 'slug'>,
) {
  if (note.slug) {
    const date = new Date(note.createdAt)
    return `/notes/${date.getUTCFullYear()}/${
      date.getUTCMonth() + 1
    }/${date.getUTCDate()}/${note.slug}`
  }

  return `/notes/${note.nid}`
}

function formatCompactNumber(value: number) {
  const digits = String(value).length

  if (digits < 4) return value
  if (digits < 7) return `${(value / 1000).toFixed(1)}K`
  if (digits < 10) return `${(value / 1000000).toFixed(1)}M`

  return `${(value / 1000000000).toFixed(1)}B`
}

function readPage(value: string | null) {
  const page = Number(value)
  return Number.isFinite(page) && page > 0 ? page : 1
}

async function getFilteredNotes(params: {
  filter: Exclude<NoteFilter, 'all'>
  page: number
  size: number
  sortKey: NoteSortKey
  sortOrder: SortOrder
}): Promise<PaginateResult<NoteModel>> {
  const firstPage = await getNotes({
    page: 1,
    size: filteredNotesFetchSize,
    sort_by: params.sortKey,
    sort_order: params.sortOrder,
  })
  const remainingPages = Array.from(
    { length: Math.max(firstPage.pagination.totalPages - 1, 0) },
    (_, index) => index + 2,
  )
  const remainingResults = await Promise.all(
    remainingPages.map((page) =>
      getNotes({
        page,
        size: filteredNotesFetchSize,
        sort_by: params.sortKey,
        sort_order: params.sortOrder,
      }),
    ),
  )
  const filteredNotes = [firstPage, ...remainingResults]
    .flatMap((result) => result.data)
    .filter((note) =>
      params.filter === 'bookmark' ? note.bookmark : !note.isPublished,
    )
  const start = (params.page - 1) * params.size
  const totalPages = Math.max(1, Math.ceil(filteredNotes.length / params.size))

  return {
    data: filteredNotes.slice(start, start + params.size),
    pagination: {
      page: params.page,
      size: params.size,
      total: filteredNotes.length,
      totalPages,
    },
  }
}

function readNoteFilter(value: string | null): NoteFilter {
  if (value === 'bookmark' || value === 'unpublished') return value
  return 'all'
}

function readNoteSortKey(value: string | null): NoteSortKey {
  if (
    value === 'modifiedAt' ||
    value === 'mood' ||
    value === 'title' ||
    value === 'weather'
  ) {
    return value
  }
  return 'createdAt'
}

function readSortOrder(value: string | null): SortOrder {
  return value === 'asc' ? 'asc' : 'desc'
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}
