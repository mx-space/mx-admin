import { Dialog } from '@base-ui/react/dialog'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  ArrowLeft,
  Check,
  Edit3,
  ExternalLink,
  Hash,
  Image,
  Inbox,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import { FormEvent, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import type { InfiniteData } from '@tanstack/react-query'
import type { Pager, PaginateResult } from '~/models/base'
import type { NoteModel } from '~/models/note'
import type { TopicModel } from '~/models/topic'
import type { CreateTopicData } from '../api/topics'

import { WEB_URL } from '~/constants/env'
import { relativeTimeFromNow } from '~/utils/time'

import { getNotes, patchNote } from '../api/notes'
import {
  createTopic,
  deleteTopic,
  getNotesByTopic,
  getTopic,
  getTopics,
  patchTopic,
  updateTopic,
} from '../api/topics'
import { Button } from '../ui/button'
import { cn } from '../ui/cn'
import { CompactPagination } from '../ui/compact-pagination'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '../ui/layout'
import { MasterDetailLayout } from '../ui/page-layout'
import { Scroll } from '../ui/scroll'
import { TextArea, TextInput } from '../ui/text-field'

const topicPageSize = 20
const topicNotesPageSize = 10

type TopicFormMode =
  | {
      kind: 'create'
    }
  | {
      id: string
      kind: 'edit'
    }

export function TopicsPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchParamsKey = searchParams.toString()
  const [page, setPage] = useState(readPositiveInt(searchParams.get('page')))
  const [selectedId, setSelectedId] = useState(searchParams.get('id') ?? '')
  const [formMode, setFormMode] = useState<TopicFormMode | null>(null)

  useLayoutEffect(() => {
    const nextPage = readPositiveInt(searchParams.get('page'))
    const nextSelectedId = searchParams.get('id') ?? ''

    setPage((value) => (value === nextPage ? value : nextPage))
    setSelectedId((value) =>
      value === nextSelectedId ? value : nextSelectedId,
    )
  }, [searchParamsKey])

  useEffect(() => {
    const next = new URLSearchParams()
    if (page > 1) next.set('page', String(page))
    if (selectedId) next.set('id', selectedId)
    if (next.toString() !== searchParamsKey) {
      setSearchParams(next, { replace: true })
    }
  }, [page, searchParamsKey, selectedId, setSearchParams])

  const topicsQuery = useQuery({
    placeholderData: (previous) => previous,
    queryFn: () => getTopics({ page, size: topicPageSize }),
    queryKey: ['topics', 'list', page, topicPageSize],
  })

  const topics = topicsQuery.data?.data ?? []
  const pagination = topicsQuery.data?.pagination

  useEffect(() => {
    if (!selectedId || topics.length === 0) return
    if (!topics.some((topic) => topic.id === selectedId)) {
      setSelectedId('')
    }
  }, [selectedId, topics])

  const invalidateTopics = async () => {
    await queryClient.invalidateQueries({ queryKey: ['topics'] })
  }

  const deleteMutation = useMutation({
    mutationFn: deleteTopic,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '删除专栏失败')),
    onSuccess: async () => {
      toast.success('专栏已删除')
      setSelectedId('')
      await invalidateTopics()
    },
  })

  return (
    <MasterDetailLayout
      defaultSize={0.34}
      maxSize={0.45}
      minSize={0.25}
      showDetailOnMobile={Boolean(selectedId)}
      list={
        <section className="flex h-full min-h-0 flex-col">
          <div
            className={cn(
              'flex shrink-0 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800',
              APP_SHELL_HEADER_HEIGHT_CLASS,
            )}
          >
            <div className="min-w-0">
              <h2 className="inline-flex items-center gap-2 text-sm font-medium">
                <Hash aria-hidden="true" className="size-4" />
                专栏列表
              </h2>
            </div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {pagination ? `${pagination.total} 个` : '加载中'}
            </span>
            <Button
              onClick={() => setFormMode({ kind: 'create' })}
              type="button"
              variant="subtle"
            >
              <Plus aria-hidden="true" className="size-4" />
              新建
            </Button>
          </div>

          <Scroll className="flex-1">
            {topicsQuery.isLoading && topics.length === 0 ? (
              <TopicListSkeleton />
            ) : topicsQuery.isError ? (
              <ListError onRetry={() => void topicsQuery.refetch()} />
            ) : topics.length === 0 ? (
              <ListEmpty onCreate={() => setFormMode({ kind: 'create' })} />
            ) : (
              topics.map((topic) => (
                <TopicRow
                  key={topic.id}
                  onSelect={() => setSelectedId(topic.id)}
                  selected={selectedId === topic.id}
                  topic={topic}
                />
              ))
            )}
          </Scroll>

          {pagination && pagination.totalPages > 1 ? (
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <span className="text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
                第 {pagination.page} 页
              </span>
              <CompactPagination
                onPageChange={setPage}
                onPageSizeChange={() => undefined}
                page={page}
                pageCount={pagination.totalPages}
                pageSize={topicPageSize}
                pageSizes={[topicPageSize]}
              />
            </div>
          ) : null}
        </section>
      }
      detail={
        <section className="h-full min-h-0">
          {selectedId ? (
            <TopicDetail
              deleting={deleteMutation.isPending}
              onBack={() => setSelectedId('')}
              onDelete={(topic) => {
                if (window.confirm(`确认删除「${topic.name}」？`)) {
                  deleteMutation.mutate(topic.id)
                }
              }}
              onEdit={(topic) => setFormMode({ id: topic.id, kind: 'edit' })}
              topicId={selectedId}
            />
          ) : (
            <TopicDetailEmpty />
          )}
        </section>
      }
    >
      {formMode ? (
        <TopicFormDialog
          mode={formMode}
          onClose={() => setFormMode(null)}
          onSaved={async (topic) => {
            setFormMode(null)
            setSelectedId(topic.id)
            await invalidateTopics()
          }}
        />
      ) : null}
    </MasterDetailLayout>
  )
}

function TopicRow(props: {
  onSelect: () => void
  selected: boolean
  topic: TopicModel
}) {
  return (
    <button
      className={cn(
        'flex w-full items-center gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors last:border-b-0 dark:border-neutral-800/60',
        props.selected
          ? 'bg-neutral-100 dark:bg-neutral-900'
          : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/70',
      )}
      onClick={props.onSelect}
      type="button"
    >
      <TopicAvatar topic={props.topic} />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
          {props.topic.name}
        </h3>
        <p className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate font-mono text-xs text-neutral-400">
          <Hash aria-hidden="true" className="size-3 shrink-0" />
          {props.topic.slug}
        </p>
      </div>
    </button>
  )
}

function TopicDetail(props: {
  deleting: boolean
  onBack: () => void
  onDelete: (topic: TopicModel) => void
  onEdit: (topic: TopicModel) => void
  topicId: string
}) {
  const queryClient = useQueryClient()
  const [notesPage, setNotesPage] = useState(1)
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false)

  const topicQuery = useQuery({
    queryFn: () => getTopic(props.topicId),
    queryKey: ['topics', 'detail', props.topicId],
  })
  const notesQuery = useQuery({
    placeholderData: (previous) => previous,
    queryFn: () =>
      getNotesByTopic(props.topicId, {
        page: notesPage,
        size: topicNotesPageSize,
      }),
    queryKey: ['topics', 'notes', props.topicId, notesPage],
  })

  useEffect(() => {
    setNotesPage(1)
  }, [props.topicId])

  const topic = topicQuery.data
  const notes = notesQuery.data?.data ?? []
  const notesPagination = notesQuery.data?.pagination

  const patchTopicMutation = useMutation({
    mutationFn: (icon: string) => patchTopic(props.topicId, { icon }),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '更新图标失败')),
    onSuccess: async () => {
      toast.success('图标已更新')
      await queryClient.invalidateQueries({
        queryKey: ['topics', 'detail', props.topicId],
      })
      await queryClient.invalidateQueries({ queryKey: ['topics', 'list'] })
    },
  })

  const removeNoteMutation = useMutation({
    mutationFn: (noteId: string) => patchNote(noteId, { topicId: null }),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '移除关联失败')),
    onSuccess: async () => {
      toast.success('已移除手记的专栏引用')
      await queryClient.invalidateQueries({
        queryKey: ['topics', 'notes', props.topicId],
      })
      await queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })

  const promptIcon = () => {
    if (!topic) return
    const icon = window.prompt('图标 URL', topic.icon ?? '')
    if (icon === null) return
    patchTopicMutation.mutate(icon.trim())
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
          <h2 className="truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
            专栏详情
          </h2>
        </div>
        {topic ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button onClick={promptIcon} type="button" variant="subtle">
              {patchTopicMutation.isPending ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <Image aria-hidden="true" className="size-4" />
              )}
              图标
            </Button>
            <Button
              onClick={() => props.onEdit(topic)}
              type="button"
              variant="subtle"
            >
              <Edit3 aria-hidden="true" className="size-4" />
              编辑
            </Button>
            <Button
              className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-950 dark:text-red-400 dark:hover:bg-red-950/30"
              disabled={props.deleting}
              onClick={() => props.onDelete(topic)}
              type="button"
              variant="subtle"
            >
              {props.deleting ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <Trash2 aria-hidden="true" className="size-4" />
              )}
              删除
            </Button>
          </div>
        ) : null}
      </div>

      <Scroll className="flex-1" innerClassName="p-5">
        {topicQuery.isLoading ? (
          <TopicDetailSkeleton />
        ) : topicQuery.isError || !topic ? (
          <DetailError onRetry={() => void topicQuery.refetch()} />
        ) : (
          <>
            <TopicSummary topic={topic} />
            <TopicNotesSection
              loading={notesQuery.isLoading && notes.length === 0}
              notes={notes}
              onAdd={() => setIsAddNoteOpen(true)}
              onRemove={(note) => {
                if (window.confirm(`确认从专栏中移除「${note.title}」？`)) {
                  removeNoteMutation.mutate(note.id!)
                }
              }}
              pagination={notesPagination}
              page={notesPage}
              removing={removeNoteMutation.isPending}
              setPage={setNotesPage}
            />
            <AddNotesToTopicDialog
              onClose={() => setIsAddNoteOpen(false)}
              onSuccess={async () => {
                setIsAddNoteOpen(false)
                setNotesPage(1)
                await queryClient.invalidateQueries({
                  queryKey: ['topics', 'notes', props.topicId],
                })
                await queryClient.invalidateQueries({ queryKey: ['notes'] })
              }}
              open={isAddNoteOpen}
              topicId={props.topicId}
            />
          </>
        )}
      </Scroll>
    </div>
  )
}

function TopicSummary(props: { topic: TopicModel }) {
  return (
    <section className="mb-6 rounded border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
      <div className="flex items-start gap-4">
        <TopicAvatar className="size-14 text-lg" topic={props.topic} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold text-neutral-950 dark:text-neutral-50">
            {props.topic.name}
          </h3>
          <p className="mt-1 inline-flex items-center gap-1 font-mono text-xs text-neutral-500 dark:text-neutral-400">
            <Hash aria-hidden="true" className="size-3" />
            {props.topic.slug}
          </p>
          {props.topic.introduce ? (
            <p className="mt-3 text-sm text-neutral-700 dark:text-neutral-300">
              {props.topic.introduce}
            </p>
          ) : null}
          {props.topic.description ? (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              {props.topic.description}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function TopicNotesSection(props: {
  loading: boolean
  notes: Partial<NoteModel>[]
  onAdd: () => void
  onRemove: (note: Partial<NoteModel>) => void
  page: number
  pagination?: Pager
  removing: boolean
  setPage: (page: number) => void
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          包含的手记
          {props.pagination ? (
            <span className="ml-1 text-xs text-neutral-400">
              ({props.pagination.total})
            </span>
          ) : null}
        </h3>
        <Button className="h-8 px-2" onClick={props.onAdd} type="button">
          <Plus aria-hidden="true" className="size-4" />
          添加
        </Button>
      </div>

      {props.loading ? (
        <NoteListSkeleton />
      ) : props.notes.length === 0 ? (
        <p className="rounded border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-400">
          暂无手记。
        </p>
      ) : (
        <div className="overflow-hidden rounded border border-neutral-200 dark:border-neutral-800">
          {props.notes.map((note) => (
            <NoteRow
              key={note.id}
              note={note}
              onRemove={() => props.onRemove(note)}
              removing={props.removing}
            />
          ))}
        </div>
      )}

      {props.pagination && props.pagination.totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
            第 {props.page} 页
          </span>
          <CompactPagination
            onPageChange={props.setPage}
            onPageSizeChange={() => undefined}
            page={props.page}
            pageCount={props.pagination.totalPages}
            pageSize={topicNotesPageSize}
            pageSizes={[topicNotesPageSize]}
          />
        </div>
      ) : null}
    </section>
  )
}

function AddNotesToTopicDialog(props: {
  onClose: () => void
  onSuccess: () => Promise<void>
  open: boolean
  topicId: string
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    if (!props.open) {
      setSelectedIds(new Set())
      setKeyword('')
    }
  }, [props.open])

  const notesQuery = useInfiniteQuery<
    PaginateResult<NoteModel>,
    Error,
    InfiniteData<PaginateResult<NoteModel>, number>,
    readonly ['notes', 'topic-picker', string],
    number
  >({
    enabled: props.open,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getNotes({
        page: pageParam,
        size: 50,
      }),
    queryKey: ['notes', 'topic-picker', props.topicId] as const,
  })

  const notes = useMemo(
    () => notesQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [notesQuery.data],
  )
  const filteredNotes = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()
    if (!normalizedKeyword) return notes

    return notes.filter((note) => {
      const title = note.title.toLowerCase()
      const slug = note.slug?.toLowerCase() ?? ''
      const nid = String(note.nid)

      return (
        title.includes(normalizedKeyword) ||
        slug.includes(normalizedKeyword) ||
        nid.includes(normalizedKeyword)
      )
    })
  }, [keyword, notes])

  const addMutation = useMutation({
    mutationFn: async () => {
      const noteIds = Array.from(selectedIds)
      await Promise.all(
        noteIds.map((noteId) => patchNote(noteId, { topicId: props.topicId })),
      )
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '添加手记失败')),
    onSuccess: async () => {
      toast.success('添加成功')
      setSelectedIds(new Set())
      await props.onSuccess()
    },
  })

  const toggleNote = (noteId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(noteId)) next.delete(noteId)
      else next.add(noteId)
      return next
    })
  }

  const selectedCount = selectedIds.size

  return (
    <Dialog.Root
      onOpenChange={(open) => {
        if (!open) props.onClose()
      }}
      open={props.open}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Popup className="outline-hidden fixed left-1/2 top-1/2 z-50 flex max-h-[min(84vh,42rem)] w-[min(92vw,34rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
            <div>
              <Dialog.Title className="text-base font-semibold text-neutral-950 dark:text-neutral-50">
                添加手记到专栏
              </Dialog.Title>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                选择一个或多个手记后批量加入当前专栏。
              </p>
            </div>
            <Dialog.Close
              aria-label="关闭"
              className="inline-flex size-8 items-center justify-center rounded text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-50"
            >
              <X aria-hidden="true" className="size-4" />
            </Dialog.Close>
          </div>

          <div className="shrink-0 border-b border-neutral-200 px-5 py-3 dark:border-neutral-800">
            <TextInput
              onChange={setKeyword}
              placeholder="按标题、slug 或编号筛选"
              value={keyword}
            />
          </div>

          <Scroll className="min-h-0 flex-1">
            {notesQuery.isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    className="h-12 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900"
                    key={index}
                  />
                ))}
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center px-5 text-center">
                <Inbox aria-hidden="true" className="size-9 text-neutral-300" />
                <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
                  暂无可选手记。
                </p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filteredNotes.map((note) => {
                  const selected = selectedIds.has(note.id)
                  const alreadyInTopic = note.topicId === props.topicId

                  return (
                    <button
                      className={cn(
                        'flex w-full items-center gap-3 px-5 py-3 text-left transition-colors',
                        alreadyInTopic
                          ? 'cursor-not-allowed opacity-55'
                          : selected
                            ? 'bg-neutral-100 dark:bg-neutral-900'
                            : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/70',
                      )}
                      disabled={alreadyInTopic}
                      key={note.id}
                      onClick={() => toggleNote(note.id)}
                      type="button"
                    >
                      <span
                        className={cn(
                          'inline-flex size-5 shrink-0 items-center justify-center rounded border text-white',
                          selected
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]'
                            : 'border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-950',
                        )}
                      >
                        {selected ? (
                          <Check aria-hidden="true" className="size-3.5" />
                        ) : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="shrink-0 font-mono text-xs text-neutral-400">
                            #{note.nid}
                          </span>
                          <span className="truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
                            {note.title || '未命名手记'}
                          </span>
                        </span>
                        <span className="mt-1 flex items-center gap-2 text-xs text-neutral-400">
                          {note.slug ? (
                            <span className="truncate font-mono">
                              {note.slug}
                            </span>
                          ) : null}
                          {alreadyInTopic ? <span>已在当前专栏</span> : null}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </Scroll>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-neutral-200 px-5 py-4 dark:border-neutral-800">
            <Button
              disabled={
                !notesQuery.hasNextPage || notesQuery.isFetchingNextPage
              }
              onClick={() => void notesQuery.fetchNextPage()}
              type="button"
              variant="subtle"
            >
              {notesQuery.isFetchingNextPage ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : null}
              {notesQuery.hasNextPage ? '加载更多' : '已全部加载'}
            </Button>
            <div className="flex items-center gap-2">
              <Button onClick={props.onClose} type="button" variant="subtle">
                取消
              </Button>
              <Button
                disabled={selectedCount === 0 || addMutation.isPending}
                onClick={() => addMutation.mutate()}
                type="button"
              >
                {addMutation.isPending ? (
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <Plus aria-hidden="true" className="size-4" />
                )}
                添加 {selectedCount > 0 ? `(${selectedCount})` : ''}
              </Button>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function NoteRow(props: {
  note: Partial<NoteModel>
  onRemove: () => void
  removing: boolean
}) {
  const title = props.note.title || '未命名手记'
  const externalHref = props.note.id ? `${WEB_URL}/notes/${props.note.id}` : '#'

  return (
    <div className="group flex items-center justify-between gap-4 border-b border-neutral-100 px-4 py-3 last:border-b-0 dark:border-neutral-800">
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {typeof props.note.nid === 'number' ? (
            <span className="shrink-0 font-mono text-xs text-neutral-400">
              #{props.note.nid}
            </span>
          ) : null}
          <p className="truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
            {title}
          </p>
          {props.note.createdAt ? (
            <time
              className="shrink-0 text-xs text-neutral-400"
              dateTime={props.note.createdAt}
            >
              {relativeTimeFromNow(props.note.createdAt)}
            </time>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <a
          className="inline-flex size-8 items-center justify-center rounded border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
          href={externalHref}
          rel="noreferrer"
          target="_blank"
          title="打开手记"
        >
          <ExternalLink aria-hidden="true" className="size-4" />
        </a>
        {props.note.id ? (
          <Link
            className="inline-flex size-8 items-center justify-center rounded border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
            to={`/notes?keyword=${encodeURIComponent(title)}`}
            title="在手记列表中查找"
          >
            <Edit3 aria-hidden="true" className="size-4" />
          </Link>
        ) : null}
        <button
          className="inline-flex size-8 items-center justify-center rounded border border-red-200 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-950 dark:text-red-400 dark:hover:bg-red-950/30"
          disabled={props.removing || !props.note.id}
          onClick={props.onRemove}
          title="移出专栏"
          type="button"
        >
          {props.removing ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <X aria-hidden="true" className="size-4" />
          )}
        </button>
      </div>
    </div>
  )
}

function TopicFormDialog(props: {
  mode: TopicFormMode
  onClose: () => void
  onSaved: (topic: TopicModel) => Promise<void>
}) {
  const isEdit = props.mode.kind === 'edit'
  const editId = props.mode.kind === 'edit' ? props.mode.id : null
  const topicQuery = useQuery({
    enabled: isEdit,
    queryFn: () => getTopic(editId ?? ''),
    queryKey: ['topics', 'detail', editId ?? 'new'],
  })
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [introduce, setIntroduce] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('')

  useEffect(() => {
    if (!topicQuery.data) return
    setName(topicQuery.data.name)
    setSlug(topicQuery.data.slug)
    setIntroduce(topicQuery.data.introduce ?? '')
    setDescription(topicQuery.data.description ?? '')
    setIcon(topicQuery.data.icon ?? '')
  }, [topicQuery.data])

  const mutation = useMutation({
    mutationFn: (data: CreateTopicData) =>
      editId ? updateTopic(editId, data) : createTopic(data),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '专栏保存失败')),
    onSuccess: async (topic) => {
      toast.success(isEdit ? '专栏已更新' : '专栏已创建')
      await props.onSaved(topic)
    },
  })

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = {
      description: description.trim(),
      icon: icon.trim(),
      introduce: introduce.trim(),
      name: name.trim(),
      slug: slug.trim(),
    }

    const validationError = validateTopicForm(data)
    if (validationError) {
      toast.error(validationError)
      return
    }

    mutation.mutate(data)
  }

  return (
    <Dialog.Root
      onOpenChange={(open) => {
        if (!open) props.onClose()
      }}
      open
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Popup className="outline-hidden fixed left-1/2 top-1/2 z-50 w-[min(92vw,36rem)] -translate-x-1/2 -translate-y-1/2 rounded border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
          <form onSubmit={onSubmit}>
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
              <div>
                <Dialog.Title className="text-base font-semibold text-neutral-950 dark:text-neutral-50">
                  {isEdit ? '编辑专栏' : '新建专栏'}
                </Dialog.Title>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  专栏用于组织手记，并提供公开展示入口。
                </p>
              </div>
              <Dialog.Close
                aria-label="关闭"
                className="inline-flex size-8 items-center justify-center rounded text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-50"
              >
                <X aria-hidden="true" className="size-4" />
              </Dialog.Close>
            </div>

            {isEdit && topicQuery.isLoading ? (
              <div className="flex min-h-80 items-center justify-center">
                <Loader2
                  aria-hidden="true"
                  className="size-6 animate-spin text-neutral-400"
                />
              </div>
            ) : (
              <div className="grid gap-4 px-5 py-4">
                <TextInput
                  autoFocus
                  label="名称"
                  labelClassName="text-xs text-neutral-500 dark:text-neutral-400"
                  maxLength={50}
                  onChange={setName}
                  required
                  value={name}
                />
                <div>
                  <TextInput
                    controlClassName="font-mono"
                    label="ID (Slug)"
                    labelClassName="text-xs text-neutral-500 dark:text-neutral-400"
                    onChange={setSlug}
                    required
                    value={slug}
                  />
                  <p className="mt-1 text-xs text-neutral-400">
                    只能包含字母、数字、下划线和连字符。
                  </p>
                </div>
                <TextInput
                  label="简介"
                  labelClassName="text-xs text-neutral-500 dark:text-neutral-400"
                  maxLength={100}
                  onChange={setIntroduce}
                  required
                  value={introduce}
                />
                <TextInput
                  label="图标 URL"
                  labelClassName="text-xs text-neutral-500 dark:text-neutral-400"
                  onChange={setIcon}
                  value={icon}
                />
                <TextArea
                  controlClassName="min-h-28"
                  label="详细描述"
                  labelClassName="text-xs text-neutral-500 dark:text-neutral-400"
                  maxLength={500}
                  onChange={setDescription}
                  value={description}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-neutral-200 px-5 py-4 dark:border-neutral-800">
              <Button onClick={props.onClose} type="button" variant="subtle">
                取消
              </Button>
              <Button
                disabled={
                  mutation.isPending || (isEdit && topicQuery.isLoading)
                }
                type="submit"
              >
                {mutation.isPending ? (
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <Save aria-hidden="true" className="size-4" />
                )}
                保存
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function TopicAvatar(props: { className?: string; topic: TopicModel }) {
  const label = useMemo(() => getInitial(props.topic.name), [props.topic.name])

  if (props.topic.icon) {
    return (
      <img
        alt={`${props.topic.name} 图标`}
        className={cn('size-10 shrink-0 rounded object-cover', props.className)}
        loading="lazy"
        src={props.topic.icon}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded bg-neutral-100 text-sm font-semibold text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300',
        props.className,
      )}
    >
      {label}
    </div>
  )
}

function TopicListSkeleton() {
  return (
    <div>
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3 dark:border-neutral-800/60"
          key={index}
        >
          <div className="size-10 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
          <div className="min-w-0 flex-1">
            <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
            <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
          </div>
        </div>
      ))}
    </div>
  )
}

function NoteListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          className="h-12 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900"
          key={index}
        />
      ))}
    </div>
  )
}

function TopicDetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 flex items-start gap-4 rounded border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
        <div className="size-14 rounded bg-neutral-100 dark:bg-neutral-900" />
        <div className="flex-1">
          <div className="h-5 w-40 rounded bg-neutral-100 dark:bg-neutral-900" />
          <div className="mt-3 h-4 w-28 rounded bg-neutral-100 dark:bg-neutral-900" />
          <div className="mt-4 h-4 w-full rounded bg-neutral-100 dark:bg-neutral-900" />
        </div>
      </div>
      <NoteListSkeleton />
    </div>
  )
}

function TopicDetailEmpty() {
  return (
    <div className="flex h-full min-h-[28rem] items-center justify-center px-4 text-center">
      <div>
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 dark:bg-neutral-900">
          <Hash aria-hidden="true" className="size-7" />
        </div>
        <h2 className="mt-4 text-base font-medium text-neutral-950 dark:text-neutral-50">
          选择一个专栏
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          从左侧列表选择专栏查看详情。
        </p>
      </div>
    </div>
  )
}

function ListEmpty(props: { onCreate: () => void }) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center px-4 text-center">
      <Inbox aria-hidden="true" className="size-9 text-neutral-300" />
      <p className="mt-3 text-sm font-medium text-neutral-700 dark:text-neutral-200">
        暂无专栏
      </p>
      <Button className="mt-3" onClick={props.onCreate} type="button">
        新建专栏
      </Button>
    </div>
  )
}

function ListError(props: { onRetry: () => void }) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
        专栏加载失败
      </p>
      <Button className="mt-3" onClick={props.onRetry} type="button">
        重试
      </Button>
    </div>
  )
}

function DetailError(props: { onRetry: () => void }) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
        专栏详情加载失败
      </p>
      <Button className="mt-3" onClick={props.onRetry} type="button">
        重试
      </Button>
    </div>
  )
}

function validateTopicForm(data: CreateTopicData) {
  if (!data.name) return '请输入专栏名称'
  if (data.name.length > 50) return '名称不能超过 50 个字符'
  if (!data.slug) return '请输入专栏 ID'
  if (!/^[\w-]+$/.test(data.slug))
    return 'ID 只能包含字母、数字、下划线和连字符'
  if (!data.introduce) return '请输入简介'
  if (data.introduce.length > 100) return '简介不能超过 100 个字符'
  if (data.description && data.description.length > 500) {
    return '描述不能超过 500 个字符'
  }

  return null
}

function readPositiveInt(value: null | string) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

function getInitial(value: string) {
  const normalized = value.trim()
  if (!normalized) return '#'
  return normalized.length > 2 ? normalized.slice(0, 2) : normalized
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}
