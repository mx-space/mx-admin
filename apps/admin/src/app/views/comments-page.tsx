import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CheckCheck,
  ChevronRight,
  Inbox,
  Mail,
  MapPin,
  MessageSquare,
  Monitor,
  Send,
  ShieldAlert,
  Smartphone,
  Trash2,
} from 'lucide-react'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import type { CommentModel } from '~/app/models/comment'

import { WEB_URL } from '~/app/constants/env'
import { CommentState } from '~/app/models/comment'

import {
  batchDeleteComments,
  batchUpdateCommentState,
  deleteComment,
  getComments,
  replyComment,
  updateCommentState,
} from '../api/comments'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { cn } from '../ui/cn'
import { SelectField } from '../ui/select'
import { TextArea } from '../ui/text-field'

const pageSize = 20

const filters = [
  { label: '待审核', value: CommentState.Unread },
  { label: '已读', value: CommentState.Read },
  { label: '垃圾桶', value: CommentState.Junk },
]

export function CommentsPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [state, setState] = useState(() =>
    normalizeState(searchParams.get('state')),
  )
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(
    searchParams.get('id'),
  )
  const [checkedIds, setCheckedIds] = useState<string[]>([])
  const [selectAllMode, setSelectAllMode] = useState(false)

  const commentsQuery = useQuery({
    queryFn: () => getComments({ page, size: pageSize, state }),
    queryKey: ['comments', 'list', state, page, pageSize],
  })

  const comments = commentsQuery.data?.data ?? []
  const pagination = commentsQuery.data?.pagination
  const selectedComment =
    comments.find((comment) => comment.id === selectedId) ?? null

  useEffect(() => {
    const next = new URLSearchParams()
    next.set('state', String(state))
    if (selectedId) next.set('id', selectedId)
    setSearchParams(next, { replace: true })
  }, [selectedId, setSearchParams, state])

  useEffect(() => {
    if (selectedId && comments.length > 0 && !selectedComment) {
      setSelectedId(null)
    }
  }, [comments, selectedComment, selectedId])

  const invalidateComments = async () => {
    await queryClient.invalidateQueries({ queryKey: ['comments'] })
  }

  const stateMutation = useMutation({
    mutationFn: ({ id, nextState }: { id: string; nextState: CommentState }) =>
      updateCommentState(id, nextState),
    onSuccess: async () => {
      toast.success('操作成功')
      await invalidateComments()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: async () => {
      toast.success('删除成功')
      setSelectedId(null)
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
      toast.success('操作成功')
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
      toast.success('删除成功')
      setCheckedIds([])
      setSelectAllMode(false)
      setSelectedId(null)
      await invalidateComments()
    },
  })

  const replyMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      replyComment(id, text),
    onSuccess: async () => {
      toast.success('回复成功')
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
  }

  return (
    <div className="grid min-h-[calc(100vh-8rem)] grid-cols-1 overflow-hidden rounded border border-neutral-200 bg-white lg:grid-cols-[minmax(320px,0.42fr)_1fr] dark:border-neutral-800 dark:bg-neutral-950">
      <section className="flex min-h-0 flex-col border-b border-neutral-200 lg:border-b-0 lg:border-r dark:border-neutral-800">
        <div className="flex min-h-12 items-center justify-between gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <MessageSquare aria-hidden="true" className="size-4" />
            <SelectField
              aria-label="评论状态"
              options={filters}
              onValueChange={changeFilter}
              triggerClassName="h-auto border-0 bg-transparent px-0 text-sm font-medium hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent"
              value={state}
            />
          </div>
          <span className="text-xs text-neutral-400">
            {pagination ? `${pagination.total} 条` : 'Comments'}
          </span>
        </div>

        {comments.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-4 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900/40">
            <Checkbox
              aria-label="选择当前页评论"
              checked={allVisibleChecked}
              indeterminate={hasSelection && !allVisibleChecked}
              onCheckedChange={toggleVisible}
            />
            <span className="text-neutral-500 dark:text-neutral-400">
              {hasSelection ? `已选 ${selectedCount} 项` : '全选'}
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
                选择全部 {pagination.total} 条
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto">
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
                onSelect={() => setSelectedId(comment.id)}
                selected={selectedId === comment.id}
              />
            ))
          )}
        </div>

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
              已读
            </Button>
            <Button
              className="h-8 px-2"
              disabled={!hasSelection || state === CommentState.Junk}
              onClick={() => batchStateMutation.mutate(CommentState.Junk)}
              type="button"
              variant="subtle"
            >
              <ShieldAlert aria-hidden="true" className="size-3.5" />
              垃圾
            </Button>
            <Button
              className="h-8 px-2 text-red-600 dark:text-red-400"
              disabled={!hasSelection}
              onClick={() => batchDeleteMutation.mutate()}
              type="button"
              variant="subtle"
            >
              <Trash2 aria-hidden="true" className="size-3.5" />
              删除
            </Button>
          </div>
          {pagination && pagination.totalPages > 1 ? (
            <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
              <Button
                className="h-8 px-2"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                type="button"
                variant="subtle"
              >
                上一页
              </Button>
              <span>
                {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                className="h-8 px-2"
                disabled={page >= pagination.totalPages}
                onClick={() =>
                  setPage((current) =>
                    Math.min(pagination.totalPages, current + 1),
                  )
                }
                type="button"
                variant="subtle"
              >
                下一页
              </Button>
            </div>
          ) : null}
        </div>
      </section>

      <section className="min-h-0">
        {selectedComment ? (
          <CommentDetail
            comment={selectedComment}
            currentState={state}
            onDelete={(id) => deleteMutation.mutate(id)}
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
            选择一条评论
          </div>
        )}
      </section>
    </div>
  )
}

function CommentListItem(props: {
  checked: boolean
  comment: CommentModel
  onCheck: (id: string, checked: boolean) => void
  onSelect: () => void
  selected: boolean
}) {
  const commentText = props.comment.isDeleted
    ? '该评论已删除'
    : props.comment.text

  return (
    <article
      className={cn(
        'flex cursor-pointer gap-3 border-b border-neutral-100 px-4 py-3 transition-colors last:border-b-0 dark:border-neutral-900',
        props.selected
          ? 'bg-neutral-100 dark:bg-neutral-900'
          : props.checked
            ? 'bg-neutral-50 dark:bg-neutral-900/60'
            : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/40',
      )}
      onClick={props.onSelect}
    >
      <Checkbox
        aria-label="选择评论"
        checked={props.checked}
        className="mt-1 shrink-0"
        onCheckedChange={(checked) => props.onCheck(props.comment.id, checked)}
        onClick={(event) => event.stopPropagation()}
      />
      <Avatar comment={props.comment} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {props.comment.author || '匿名'}
          </span>
          {props.comment.parentCommentId ? (
            <span className="text-xs text-neutral-400">回复</span>
          ) : null}
          <time
            className="ml-auto shrink-0 text-xs text-neutral-400"
            dateTime={props.comment.createdAt}
          >
            {formatDate(props.comment.createdAt)}
          </time>
        </div>
        <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-sm text-neutral-600 dark:text-neutral-400">
          {commentText}
        </p>
        {props.comment.isWhispers ? (
          <span className="mt-2 inline-flex rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            悄悄话
          </span>
        ) : null}
      </div>
    </article>
  )
}

function CommentDetail(props: {
  comment: CommentModel
  currentState: CommentState
  onDelete: (id: string) => void
  onReply: (id: string, text: string) => Promise<unknown>
  onStateChange: (id: string, state: CommentState) => void
  replyPending: boolean
}) {
  const [reply, setReply] = useState('')
  const commentText = props.comment.isDeleted
    ? '该评论已删除'
    : props.comment.text
  const refLink = getReferenceLink(props.comment)
  const device = getDeviceInfo(props.comment.agent)

  useEffect(() => {
    setReply('')
  }, [props.comment.id])

  const submitReply = async (event: FormEvent) => {
    event.preventDefault()
    const text = reply.trim()
    if (!text) return
    await props.onReply(props.comment.id, text)
    setReply('')
  }

  return (
    <div className="flex h-full min-h-[calc(100vh-8rem)] flex-col">
      <div className="flex min-h-12 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800">
        <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          评论详情
        </h2>
        <div className="flex gap-2">
          <Button
            className="h-8 px-2"
            disabled={props.currentState === CommentState.Read}
            onClick={() =>
              props.onStateChange(props.comment.id, CommentState.Read)
            }
            type="button"
            variant="subtle"
          >
            <CheckCheck aria-hidden="true" className="size-3.5" />
            已读
          </Button>
          <Button
            className="h-8 px-2"
            disabled={props.currentState === CommentState.Junk}
            onClick={() =>
              props.onStateChange(props.comment.id, CommentState.Junk)
            }
            type="button"
            variant="subtle"
          >
            <ShieldAlert aria-hidden="true" className="size-3.5" />
            垃圾
          </Button>
          <Button
            className="h-8 px-2 text-red-600 dark:text-red-400"
            onClick={() => props.onDelete(props.comment.id)}
            type="button"
            variant="subtle"
          >
            <Trash2 aria-hidden="true" className="size-3.5" />
            删除
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {props.comment.parent ? (
            <div className="border-l-2 border-neutral-200 pl-4 text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
              <div className="mb-1 font-medium text-neutral-700 dark:text-neutral-300">
                @{props.comment.parent.author || '上级评论'}
              </div>
              <p className="line-clamp-2 whitespace-pre-wrap">
                {props.comment.parent.isDeleted
                  ? '该评论已删除'
                  : props.comment.parent.text}
              </p>
            </div>
          ) : null}

          <div className="flex items-center gap-3">
            <Avatar comment={props.comment} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {props.comment.author || '匿名'}
                </span>
                {props.comment.isWhispers ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                    悄悄话
                  </span>
                ) : null}
              </div>
              <time
                className="text-xs text-neutral-500"
                dateTime={props.comment.editedAt ?? props.comment.createdAt}
              >
                {formatDate(props.comment.editedAt ?? props.comment.createdAt)}
              </time>
            </div>
          </div>

          <p className="whitespace-pre-wrap text-base leading-7 text-neutral-900 dark:text-neutral-100">
            {commentText}
          </p>

          {props.comment.ref?.title && refLink ? (
            <a
              className="flex items-center gap-2 rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
              href={refLink}
              rel="noreferrer"
              target="_blank"
            >
              <span className="text-neutral-400">来源</span>
              <span className="truncate font-medium">
                {props.comment.ref.title}
              </span>
              <ChevronRight aria-hidden="true" className="ml-auto size-4" />
            </a>
          ) : null}

          <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 xl:grid-cols-3">
            <MetaItem label="IP 地址">
              {props.comment.ip ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin
                    aria-hidden="true"
                    className="size-3.5 text-neutral-400"
                  />
                  {props.comment.ip}
                </span>
              ) : (
                '未知'
              )}
            </MetaItem>
            <MetaItem label="访问设备">
              <span className="inline-flex min-w-0 items-center gap-1.5">
                {device.isMobile ? (
                  <Smartphone
                    aria-hidden="true"
                    className="size-3.5 shrink-0 text-neutral-400"
                  />
                ) : (
                  <Monitor
                    aria-hidden="true"
                    className="size-3.5 shrink-0 text-neutral-400"
                  />
                )}
                <span className="truncate" title={props.comment.agent}>
                  {device.label}
                </span>
              </span>
            </MetaItem>
            {props.comment.mail ? (
              <MetaItem label="电子邮箱">
                <a
                  className="inline-flex min-w-0 items-center gap-1.5 hover:underline"
                  href={`mailto:${props.comment.mail}`}
                >
                  <Mail
                    aria-hidden="true"
                    className="size-3.5 shrink-0 text-neutral-400"
                  />
                  <span className="truncate">{props.comment.mail}</span>
                </a>
              </MetaItem>
            ) : null}
          </dl>
        </div>
      </div>

      {props.currentState !== CommentState.Junk ? (
        <form
          className="border-t border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
          onSubmit={submitReply}
        >
          <div className="mx-auto flex max-w-3xl gap-2">
            <TextArea
              className="flex-1"
              controlClassName="min-h-20 resize-y focus:border-neutral-400 dark:focus:border-neutral-600"
              onChange={setReply}
              placeholder="写下你的回复..."
              value={reply}
            />
            <Button
              className="self-end"
              disabled={!reply.trim() || props.replyPending}
              type="submit"
            >
              <Send aria-hidden="true" className="size-4" />
              发送
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  )
}

function CommentEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Inbox
        aria-hidden="true"
        className="mb-4 size-10 text-neutral-300 dark:text-neutral-700"
      />
      <p className="text-sm text-neutral-500 dark:text-neutral-400">暂无评论</p>
    </div>
  )
}

function Avatar(props: { comment: CommentModel; size: 'lg' | 'sm' }) {
  const sizeClass = props.size === 'lg' ? 'size-12 text-base' : 'size-8 text-sm'

  if (props.comment.avatar) {
    return (
      <img
        alt=""
        className={cn('shrink-0 rounded-full object-cover', sizeClass)}
        src={props.comment.avatar}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-neutral-100 font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-300',
        sizeClass,
      )}
    >
      {(props.comment.author || '?').slice(0, 1).toUpperCase()}
    </div>
  )
}

function MetaItem(props: { children: React.ReactNode; label: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
        {props.label}
      </dt>
      <dd className="mt-1 min-w-0 text-neutral-900 dark:text-neutral-100">
        {props.children}
      </dd>
    </div>
  )
}

function getReferenceLink(comment: CommentModel) {
  const ref = comment.ref
  if (!ref) return ''

  switch (comment.refType) {
    case 'post':
      return ref.category?.slug && ref.slug
        ? `${WEB_URL}/posts/${ref.category.slug}/${ref.slug}`
        : ''
    case 'note':
      return ref.nid ? `${WEB_URL}/notes/${ref.nid}` : ''
    case 'page':
      return ref.slug ? `${WEB_URL}/${ref.slug}` : ''
    case 'recently':
      return ref.id ? `${WEB_URL}/thinking/${ref.id}` : ''
    default:
      return ''
  }
}

function getDeviceInfo(agent?: string) {
  const value = agent?.toLowerCase() ?? ''
  return {
    isMobile:
      value.includes('mobile') ||
      value.includes('android') ||
      value.includes('iphone'),
    label: agent?.split(' ')[0] || '未知设备',
  }
}

function normalizeState(value: string | null): CommentState {
  const numeric = Number(value)
  return filters.some((filter) => filter.value === numeric)
    ? numeric
    : CommentState.Unread
}

function formatDate(value?: string | null) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}
