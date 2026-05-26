import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Edit3, Image, Loader2, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { TopicModel } from '~/models/topic'

import { patchNote } from '~/api/notes'
import { getNotesByTopic, getTopic, patchTopic } from '~/api/topics'
import { Button } from '~/ui/button'
import { cn } from '~/ui/cn'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '~/ui/layout'
import { Scroll } from '~/ui/scroll'

import { topicNotesPageSize } from '../constants'
import { getErrorMessage } from '../utils/errors'
import { AddNotesToTopicDialog } from './AddNotesToTopicDialog'
import { DetailError } from './DetailError'
import { TopicDetailSkeleton } from './TopicDetailSkeleton'
import { TopicNotesSection } from './TopicNotesSection'
import { TopicSummary } from './TopicSummary'

export function TopicDetail(props: {
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
