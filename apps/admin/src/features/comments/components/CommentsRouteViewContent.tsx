import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCheck, MessageSquare, ShieldAlert, Trash2 } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import type { CommentModel } from '~/models/comment'

import {
  batchDeleteComments,
  batchUpdateCommentState,
  deleteComment,
  getComments,
  replyComment,
  updateCommentState,
} from '~/api/comments'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '~/constants/layout'
import { useI18n } from '~/i18n'
import { CommentState } from '~/models/comment'
import { confirmDialog } from '~/ui/feedback/confirm'
import { MasterDetailLayout } from '~/ui/layout/page-layout'
import { Button } from '~/ui/primitives/button'
import { Checkbox } from '~/ui/primitives/checkbox'
import { Scroll } from '~/ui/primitives/scroll'
import { SelectField } from '~/ui/primitives/select'
import { cn } from '~/utils/cn'

import {
  commentsPageSize,
  commentsQueryKey,
  getCommentFilters,
} from '../constants'
import { normalizeCommentState, readCommentPage } from '../utils/comments'
import { CommentDetail } from './CommentDetail'
import { CommentListItem } from './CommentListItem'
import { CommentEmptyState } from './CommentPrimitives'

export function CommentsRouteViewContent() {
  const { locale, t } = useI18n()
  const queryClient = useQueryClient()
  const commentFilters = useMemo(() => getCommentFilters(), [locale])
  const [searchParams, setSearchParams] = useSearchParams()
  const searchParamsKey = searchParams.toString()
  const [state, setState] = useState(() =>
    normalizeCommentState(searchParams.get('state')),
  )
  const [page, setPage] = useState(() =>
    readCommentPage(searchParams.get('page')),
  )
  const [selectedId, setSelectedId] = useState<string | null>(
    searchParams.get('id'),
  )
  const [selectedCommentSnapshot, setSelectedCommentSnapshot] =
    useState<CommentModel | null>(null)
  const [showDetailOnMobile, setShowDetailOnMobile] = useState(
    Boolean(searchParams.get('id')),
  )
  const [checkedIds, setCheckedIds] = useState<string[]>([])
  const [selectAllMode, setSelectAllMode] = useState(false)

  const commentsQuery = useQuery({
    placeholderData: (previous) => previous,
    queryFn: () => getComments({ page, size: commentsPageSize, state }),
    queryKey: [...commentsQueryKey, 'list', state, page, commentsPageSize],
  })

  const comments = commentsQuery.data?.data ?? []
  const pagination = commentsQuery.data?.pagination
  const selectedComment =
    comments.find((comment) => comment.id === selectedId) ??
    (selectedCommentSnapshot?.id === selectedId
      ? selectedCommentSnapshot
      : null)

  useLayoutEffect(() => {
    const nextState = normalizeCommentState(searchParams.get('state'))
    const nextPage = readCommentPage(searchParams.get('page'))
    const nextSelectedId = searchParams.get('id')

    setState((value) => (value === nextState ? value : nextState))
    setPage((value) => (value === nextPage ? value : nextPage))
    setSelectedId((value) =>
      value === nextSelectedId ? value : nextSelectedId,
    )
    setShowDetailOnMobile(Boolean(nextSelectedId))
    setCheckedIds([])
    setSelectAllMode(false)
    if (!nextSelectedId) setSelectedCommentSnapshot(null)
  }, [searchParamsKey])

  useEffect(() => {
    const next = new URLSearchParams()
    next.set('state', String(state))
    if (page > 1) next.set('page', String(page))
    if (selectedId) next.set('id', selectedId)
    if (next.toString() !== searchParamsKey) {
      setSearchParams(next, { replace: true })
    }
  }, [page, searchParamsKey, selectedId, setSearchParams, state])

  const invalidateComments = async () => {
    await queryClient.invalidateQueries({ queryKey: commentsQueryKey })
  }

  const stateMutation = useMutation({
    mutationFn: ({ id, nextState }: { id: string; nextState: CommentState }) =>
      updateCommentState(id, nextState),
    onSuccess: async () => {
      toast.success(t('comments.toast.updated'))
      await invalidateComments()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: async () => {
      toast.success(t('comments.toast.deleted'))
      setSelectedId(null)
      setSelectedCommentSnapshot(null)
      setShowDetailOnMobile(false)
      await invalidateComments()
    },
  })

  const batchStateMutation = useMutation({
    mutationFn: (nextState: CommentState) =>
      selectAllMode
        ? batchUpdateCommentState({
            all: true,
            currentState: state,
            state: nextState,
          })
        : batchUpdateCommentState({ ids: checkedIds, state: nextState }),
    onSuccess: async () => {
      toast.success(t('comments.toast.updated'))
      setCheckedIds([])
      setSelectAllMode(false)
      await invalidateComments()
    },
  })

  const batchDeleteMutation = useMutation({
    mutationFn: () =>
      selectAllMode
        ? batchDeleteComments({ all: true, state })
        : batchDeleteComments({ ids: checkedIds }),
    onSuccess: async () => {
      toast.success(t('comments.toast.deleted'))
      setCheckedIds([])
      setSelectAllMode(false)
      setSelectedId(null)
      setSelectedCommentSnapshot(null)
      setShowDetailOnMobile(false)
      await invalidateComments()
    },
  })

  const replyMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      replyComment(id, text),
    onSuccess: async () => {
      toast.success(t('comments.toast.replied'))
      await invalidateComments()
    },
  })

  const checkedSet = useMemo(() => new Set(checkedIds), [checkedIds])
  const allVisibleChecked =
    comments.length > 0 &&
    comments.every((comment) => checkedSet.has(comment.id))
  const selectedCount = selectAllMode
    ? (pagination?.total ?? 0)
    : checkedIds.length
  const hasSelection = selectedCount > 0

  const toggleChecked = (id: string, checked: boolean) => {
    setSelectAllMode(false)
    setCheckedIds((current) =>
      checked
        ? Array.from(new Set([...current, id]))
        : current.filter((x) => x !== id),
    )
  }

  const toggleVisible = (checked: boolean) => {
    setSelectAllMode(false)
    setCheckedIds(checked ? comments.map((comment) => comment.id) : [])
  }

  const changeFilter = (nextState: CommentState) => {
    setState(nextState)
    setPage(1)
    setCheckedIds([])
    setSelectAllMode(false)
    setSelectedId(null)
    setSelectedCommentSnapshot(null)
    setShowDetailOnMobile(false)
  }

  const selectComment = (comment: CommentModel) => {
    setSelectedId(comment.id)
    setSelectedCommentSnapshot({ ...comment })
    setShowDetailOnMobile(true)
  }

  const confirmDeleteComment = async (id: string) => {
    const confirmed = await confirmDialog({
      destructive: true,
      title: t('common.confirmDelete'),
      description: t('comments.confirmDelete.single'),
    })
    if (!confirmed) return
    deleteMutation.mutate(id)
  }

  const confirmBatchDelete = async () => {
    if (!hasSelection) return
    const confirmed = await confirmDialog({
      destructive: true,
      title: t('common.confirmDelete'),
      description: t('comments.confirmDelete.batch', { count: selectedCount }),
    })
    if (!confirmed) return
    batchDeleteMutation.mutate()
  }

  return (
    <MasterDetailLayout
      defaultSize={0.42}
      maxSize={0.5}
      minSize={0.25}
      showDetailOnMobile={showDetailOnMobile}
      list={
        <section className="flex h-full min-h-0 flex-col">
          <div
            className={cn(
              'flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800',
              APP_SHELL_HEADER_HEIGHT_CLASS,
            )}
          >
            <div className="flex items-center gap-2">
              <MessageSquare aria-hidden="true" className="size-4" />
              <SelectField
                aria-label={t('comments.filter.label')}
                options={commentFilters}
                onValueChange={changeFilter}
                triggerClassName="h-auto border-0 bg-transparent px-0 text-sm font-medium hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent"
                value={state}
              />
            </div>
            <span className="text-xs text-neutral-400">
              {pagination
                ? t('comments.list.totalCount', { count: pagination.total })
                : 'Comments'}
            </span>
          </div>

          {comments.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-4 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900/40">
              <Checkbox
                aria-label={t('comments.list.selectPage')}
                checked={allVisibleChecked}
                indeterminate={hasSelection && !allVisibleChecked}
                onCheckedChange={toggleVisible}
              />
              <span className="text-neutral-500 dark:text-neutral-400">
                {hasSelection
                  ? t('comments.list.selectedCount', { count: selectedCount })
                  : t('comments.list.selectAll')}
              </span>
              {allVisibleChecked &&
              pagination &&
              pagination.totalPages > 1 &&
              !selectAllMode ? (
                <button
                  className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                  onClick={() => setSelectAllMode(true)}
                  type="button"
                >
                  {t('comments.list.selectAllCount', {
                    count: pagination.total,
                  })}
                </button>
              ) : null}
            </div>
          ) : null}

          <Scroll className="flex-1">
            {commentsQuery.isLoading && comments.length === 0 ? (
              <div className="flex justify-center py-20">
                <div className="size-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-950 dark:border-neutral-700 dark:border-t-neutral-100" />
              </div>
            ) : comments.length === 0 ? (
              <CommentEmptyState />
            ) : (
              comments.map((comment) => (
                <CommentListItem
                  checked={checkedSet.has(comment.id)}
                  comment={comment}
                  key={comment.id}
                  onCheck={toggleChecked}
                  onSelect={() => selectComment(comment)}
                  selected={selectedId === comment.id}
                />
              ))
            )}
          </Scroll>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <div className="flex gap-2">
              <Button
                className="h-8 px-2"
                disabled={!hasSelection || state === CommentState.Read}
                onClick={() => batchStateMutation.mutate(CommentState.Read)}
                type="button"
                variant="subtle"
              >
                <CheckCheck aria-hidden="true" className="size-3.5" />
                {t('comments.action.markRead')}
              </Button>
              <Button
                className="h-8 px-2"
                disabled={!hasSelection || state === CommentState.Junk}
                onClick={() => batchStateMutation.mutate(CommentState.Junk)}
                type="button"
                variant="subtle"
              >
                <ShieldAlert aria-hidden="true" className="size-3.5" />
                {t('comments.action.markJunk')}
              </Button>
              <Button
                className="h-8 px-2 text-red-600 dark:text-red-400"
                disabled={!hasSelection}
                onClick={confirmBatchDelete}
                type="button"
                variant="subtle"
              >
                <Trash2 aria-hidden="true" className="size-3.5" />
                {t('common.delete')}
              </Button>
            </div>
            {pagination && pagination.totalPages > 1 ? (
              <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                <Button
                  className="h-8 px-2"
                  disabled={page <= 1}
                  onClick={() => {
                    setPage((current) => Math.max(1, current - 1))
                    setCheckedIds([])
                    setSelectAllMode(false)
                  }}
                  type="button"
                  variant="subtle"
                >
                  {t('common.pagination.previousPage')}
                </Button>
                <span>
                  {pagination.page} / {pagination.totalPages}
                </span>
                <Button
                  className="h-8 px-2"
                  disabled={page >= pagination.totalPages}
                  onClick={() => {
                    setPage((current) =>
                      Math.min(pagination.totalPages, current + 1),
                    )
                    setCheckedIds([])
                    setSelectAllMode(false)
                  }}
                  type="button"
                  variant="subtle"
                >
                  {t('common.pagination.nextPage')}
                </Button>
              </div>
            ) : null}
          </div>
        </section>
      }
      detail={
        <section className="h-full min-h-0">
          {selectedComment ? (
            <CommentDetail
              comment={selectedComment}
              currentState={state}
              onBack={() => setShowDetailOnMobile(false)}
              onDelete={confirmDeleteComment}
              onReply={(id, text) => replyMutation.mutateAsync({ id, text })}
              onStateChange={(id, nextState) =>
                stateMutation.mutate({ id, nextState })
              }
              replyPending={replyMutation.isPending}
            />
          ) : (
            <div className="flex h-full min-h-72 flex-col items-center justify-center text-center text-sm text-neutral-500 dark:text-neutral-400">
              <MessageSquare
                aria-hidden="true"
                className="mb-3 size-10 text-neutral-300 dark:text-neutral-700"
              />
              {t('comments.detail.empty')}
            </div>
          )}
        </section>
      }
    />
  )
}
