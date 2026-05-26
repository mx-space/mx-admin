import { Dialog } from '@base-ui/react/dialog'
import { useInfiniteQuery, useMutation } from '@tanstack/react-query'
import { Check, Inbox, Loader2, Plus, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { InfiniteData } from '@tanstack/react-query'
import type { PaginateResult } from '~/models/base'
import type { NoteModel } from '~/models/note'

import { getNotes, patchNote } from '~/api/notes'
import { Button } from '~/ui/primitives/button'
import { Scroll } from '~/ui/primitives/scroll'
import { TextInput } from '~/ui/primitives/text-field'
import { cn } from '~/utils/cn'

import { topicPickerPageSize } from '../constants'
import { getErrorMessage } from '../utils/errors'

export function AddNotesToTopicDialog(props: {
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
        size: topicPickerPageSize,
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
