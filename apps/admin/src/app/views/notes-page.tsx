import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Bookmark,
  BookOpen,
  ExternalLink,
  Heart,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import type { NoteModel } from '~/app/models/note'

import { WEB_URL } from '~/app/constants/env'
import { relativeTimeFromNow } from '~/app/utils/time'

import { deleteNote, getNotes, patchNotePublish } from '../api/notes'
import { Button, ButtonLink } from '../ui/button'
import { cn } from '../ui/cn'
import { CompactPagination } from '../ui/compact-pagination'
import { Panel } from '../ui/panel'

const notesQueryKey = ['notes']
const pageSize = 20

export function NotesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)

  const notesQuery = useQuery({
    placeholderData: (previous) => previous,
    queryFn: () =>
      getNotes({
        page,
        size: pageSize,
        sort_by: 'createdAt',
        sort_order: 'desc',
      }),
    queryKey: [...notesQueryKey, 'list', { page, size: pageSize }],
  })

  const notes = notesQuery.data?.data ?? []
  const pagination = notesQuery.data?.pagination

  const invalidateNotes = async () => {
    await queryClient.invalidateQueries({ queryKey: notesQueryKey })
  }

  const publishMutation = useMutation({
    mutationFn: (payload: { id: string; isPublished: boolean }) =>
      patchNotePublish(payload.id, payload.isPublished),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '更新失败')),
    onSuccess: invalidateNotes,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteNote,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '删除失败')),
    onSuccess: async () => {
      toast.success('手记已删除')
      await invalidateNotes()
    },
  })

  return (
    <Panel
      description="手记列表、发布状态和公开地址。"
      title={
        <span className="inline-flex items-center gap-2">
          <BookOpen aria-hidden="true" className="size-4" />
          手记
        </span>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          共 {pagination?.total ?? 0} 条手记
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <ButtonLink to="/notes/edit">
            <Plus aria-hidden="true" className="size-4" />
            新建手记
          </ButtonLink>
          <Button
            disabled={notesQuery.isFetching}
            onClick={() => void notesQuery.refetch()}
            type="button"
            variant="subtle"
          >
            <RefreshCw
              aria-hidden="true"
              className={cn('size-4', notesQuery.isFetching && 'animate-spin')}
            />
            刷新
          </Button>
        </div>
      </div>

      <div className="min-h-[32rem]">
        {notesQuery.isLoading && notes.length === 0 ? (
          <NotesSkeleton />
        ) : notesQuery.isError ? (
          <NotesError onRetry={() => void notesQuery.refetch()} />
        ) : notes.length === 0 ? (
          <NotesEmpty />
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
                publishing={publishMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {pagination && pagination.totalPages > 1 ? (
        <div className="flex items-center justify-end border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
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
    </Panel>
  )
}

function NoteRow(props: {
  deleting: boolean
  note: NoteModel
  onDelete: (id: string) => void
  onPublishChange: (id: string, isPublished: boolean) => void
  publishing: boolean
}) {
  const note = props.note
  const isFuture = note.publicAt && +new Date(note.publicAt) - Date.now() > 0
  const publicHref = `${WEB_URL}${buildNotePublicPath(note)}`

  return (
    <article className="grid gap-3 px-4 py-3 transition-colors hover:bg-neutral-50 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center dark:hover:bg-neutral-900/50">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 font-mono text-xs text-neutral-400">
            #{note.nid}
          </span>
          {note.bookmark ? (
            <Bookmark aria-hidden="true" className="size-3.5 text-red-500" />
          ) : null}
          <h3 className="truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
            {note.title || '未命名手记'}
          </h3>
          <StatusBadge active={note.isPublished && !isFuture}>
            {!note.isPublished ? '草稿' : isFuture ? '定时' : '已发布'}
          </StatusBadge>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
          {note.mood ? <span>{note.mood}</span> : null}
          {note.weather ? <span>{note.weather}</span> : null}
          {note.location ? (
            <span className="inline-flex max-w-40 items-center gap-1 truncate">
              <MapPin aria-hidden="true" className="size-3" />
              {note.location}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <BookOpen aria-hidden="true" className="size-3" />
            {note.readCount ?? 0}
          </span>
          <span className="inline-flex items-center gap-1">
            <Heart aria-hidden="true" className="size-3" />
            {note.likeCount ?? 0}
          </span>
          <time dateTime={note.createdAt}>
            {relativeTimeFromNow(note.createdAt)}
          </time>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          disabled={props.publishing}
          onClick={() => props.onPublishChange(note.id, !note.isPublished)}
          type="button"
          variant="subtle"
        >
          {note.isPublished ? '下架' : '发布'}
        </Button>
        <ButtonLink
          className="size-9 px-0"
          title="编辑手记"
          to={`/notes/edit?id=${encodeURIComponent(note.id)}`}
          variant="subtle"
        >
          <Pencil aria-hidden="true" className="size-4" />
        </ButtonLink>
        <a
          className="inline-flex size-9 items-center justify-center rounded border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
          href={publicHref}
          rel="noreferrer"
          target="_blank"
          title="打开手记"
        >
          <ExternalLink aria-hidden="true" className="size-4" />
        </a>
        <button
          className="inline-flex size-9 items-center justify-center rounded border border-red-200 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-950 dark:text-red-400 dark:hover:bg-red-950/30"
          disabled={props.deleting}
          onClick={() => props.onDelete(note.id)}
          title="删除手记"
          type="button"
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </button>
      </div>
    </article>
  )
}

function StatusBadge(props: { active: boolean; children: string }) {
  return (
    <span
      className={cn(
        'shrink-0 rounded px-1.5 py-0.5 text-xs leading-4',
        props.active
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
          : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400',
      )}
    >
      {props.children}
    </span>
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

function NotesEmpty() {
  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center px-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
      暂无手记
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

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}
