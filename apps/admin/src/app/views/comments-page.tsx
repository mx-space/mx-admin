import { Popover } from '@base-ui/react/popover'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CheckCheck,
  ChevronRight,
  Globe,
  Inbox,
  Mail,
  MessageSquare,
  Monitor,
  Send,
  ShieldAlert,
  Smartphone,
  SmilePlus,
  Trash2,
} from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import type { CommentModel } from '~/app/models/comment'
import type { FormEvent, KeyboardEvent } from 'react'

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
import { getOwner } from '../api/options'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { cn } from '../ui/cn'
import { IpInfoPopover } from '../ui/ip-info-popover'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '../ui/layout'
import { MarkdownRender } from '../ui/markdown-render'
import { MasterDetailLayout } from '../ui/page-layout'
import { Scroll } from '../ui/scroll'
import { SelectField } from '../ui/select'
import { TextArea } from '../ui/text-field'

const pageSize = 20

interface LocalReply {
  createdAt: string
  id: string
  text: string
}

const quickEmojis = [
  '😀',
  '😄',
  '😂',
  '😊',
  '😍',
  '🥳',
  '😢',
  '😭',
  '😅',
  '🤔',
  '👍',
  '👎',
  '👏',
  '🙏',
  '💪',
  '🔥',
  '✨',
  '❤️',
  '💔',
  '🎉',
  '🌹',
  '🍻',
  '☕',
  '🚀',
]

const filters = [
  { label: '待审核', value: CommentState.Unread },
  { label: '已读', value: CommentState.Read },
  { label: '垃圾桶', value: CommentState.Junk },
]

export function CommentsPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchParamsKey = searchParams.toString()
  const [state, setState] = useState(() =>
    normalizeState(searchParams.get('state')),
  )
  const [page, setPage] = useState(() => readPage(searchParams.get('page')))
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
    queryFn: () => getComments({ page, size: pageSize, state }),
    queryKey: ['comments', 'list', state, page, pageSize],
  })

  const comments = commentsQuery.data?.data ?? []
  const pagination = commentsQuery.data?.pagination
  const selectedComment =
    comments.find((comment) => comment.id === selectedId) ??
    (selectedCommentSnapshot?.id === selectedId
      ? selectedCommentSnapshot
      : null)

  useLayoutEffect(() => {
    const nextState = normalizeState(searchParams.get('state'))
    const nextPage = readPage(searchParams.get('page'))
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
      setSelectedCommentSnapshot(null)
      setShowDetailOnMobile(false)
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
    setSelectedCommentSnapshot(null)
    setShowDetailOnMobile(false)
  }

  const selectComment = (comment: CommentModel) => {
    setSelectedId(comment.id)
    setSelectedCommentSnapshot({ ...comment })
    setShowDetailOnMobile(true)
  }

  const confirmDeleteComment = (id: string) => {
    if (!window.confirm('确定要删除这条评论吗？')) return
    deleteMutation.mutate(id)
  }

  const confirmBatchDelete = () => {
    if (!hasSelection) return
    if (!window.confirm(`确定要删除选中的 ${selectedCount} 条评论吗？`)) return
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
                onClick={confirmBatchDelete}
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
                  onClick={() => {
                    setPage((current) => Math.max(1, current - 1))
                    setCheckedIds([])
                    setSelectAllMode(false)
                  }}
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
                  下一页
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
              选择一条评论
            </div>
          )}
        </section>
      }
    />
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
  onBack: () => void
  onDelete: (id: string) => void
  onReply: (id: string, text: string) => Promise<unknown>
  onStateChange: (id: string, state: CommentState) => void
  replyPending: boolean
}) {
  const [reply, setReply] = useState('')
  const [localReplies, setLocalReplies] = useState<LocalReply[]>([])
  const replyInputRef = useRef<HTMLTextAreaElement | null>(null)
  const ownerQuery = useQuery({
    queryFn: getOwner,
    queryKey: ['comments', 'owner'],
    staleTime: 5 * 60 * 1000,
  })
  const commentText = props.comment.isDeleted
    ? '该评论已删除'
    : props.comment.text
  const refLink = getReferenceLink(props.comment)
  const device = getDeviceInfo(props.comment.agent)
  const ownerName =
    ownerQuery.data?.name ||
    ownerQuery.data?.username ||
    ownerQuery.data?.handle ||
    '我'

  useEffect(() => {
    setReply('')
    setLocalReplies([])
  }, [props.comment.id])

  const submitReply = async (event: FormEvent) => {
    event.preventDefault()
    await sendReply()
  }

  const sendReply = async () => {
    const text = reply.trim()
    if (!text) return
    await props.onReply(props.comment.id, text)
    setReply('')
    setLocalReplies((current) => [
      ...current,
      {
        createdAt: new Date().toISOString(),
        id: `${Date.now()}`,
        text,
      },
    ])
  }

  const handleReplyKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault()
      if (!props.replyPending) {
        void sendReply()
      }
    }
  }

  const insertEmoji = (emoji: string) => {
    const input = replyInputRef.current
    if (!input) {
      setReply((current) => `${current}${emoji}`)
      return
    }

    const start = input.selectionStart
    const end = input.selectionEnd
    const next = `${reply.slice(0, start)}${emoji}${reply.slice(end)}`
    setReply(next)

    window.requestAnimationFrame(() => {
      input.focus()
      const cursor = start + emoji.length
      input.setSelectionRange(cursor, cursor)
    })
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={cn(
          'flex shrink-0 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800',
          APP_SHELL_HEADER_HEIGHT_CLASS,
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <Button
            aria-label="返回评论列表"
            className="h-8 px-2 lg:hidden"
            onClick={props.onBack}
            type="button"
            variant="subtle"
          >
            <ChevronRight aria-hidden="true" className="size-4 rotate-180" />
          </Button>
          <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            评论详情
          </h2>
        </div>
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

      <Scroll className="flex-1" innerClassName="p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {props.comment.parent ? (
            <div className="border-l-2 border-neutral-200 pl-4 text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
              <div className="mb-1 font-medium text-neutral-700 dark:text-neutral-300">
                @{props.comment.parent.author || '上级评论'}
              </div>
              {props.comment.parent.isDeleted ? (
                <p className="line-clamp-2 whitespace-pre-wrap">该评论已删除</p>
              ) : (
                <MarkdownRender
                  className="line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400"
                  text={props.comment.parent.text}
                />
              )}
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

          {props.comment.isDeleted ? (
            <p className="whitespace-pre-wrap text-base leading-7 text-neutral-900 dark:text-neutral-100">
              {commentText}
            </p>
          ) : (
            <MarkdownRender
              className="text-base leading-7 text-neutral-900 dark:text-neutral-100"
              text={commentText}
            />
          )}

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
                <IpInfoPopover ip={props.comment.ip} />
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
            {props.comment.url ? (
              <MetaItem label="站点地址">
                <a
                  className="inline-flex min-w-0 items-center gap-1.5 hover:underline"
                  href={props.comment.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  <Globe
                    aria-hidden="true"
                    className="size-3.5 shrink-0 text-neutral-400"
                  />
                  <span className="truncate">{props.comment.url}</span>
                </a>
              </MetaItem>
            ) : null}
          </dl>

          {localReplies.length > 0 ? (
            <div className="space-y-4 border-t border-neutral-100 pt-6 dark:border-neutral-800">
              <h3 className="text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">
                新增回复
              </h3>
              {localReplies.map((item) => (
                <div className="flex gap-3" key={item.id}>
                  <OwnerReplyAvatar
                    avatar={ownerQuery.data?.avatar || ownerQuery.data?.image}
                    name={ownerName}
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {ownerName}
                      </span>
                      <time
                        className="shrink-0 text-xs text-neutral-400"
                        dateTime={item.createdAt}
                      >
                        {formatDate(item.createdAt)}
                      </time>
                    </div>
                    <MarkdownRender
                      className="text-sm text-neutral-700 dark:text-neutral-300"
                      text={item.text}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </Scroll>

      {props.currentState !== CommentState.Junk ? (
        <form
          className="border-t border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
          onSubmit={submitReply}
        >
          <div className="mx-auto max-w-3xl">
            <div className="overflow-hidden rounded border border-neutral-200 bg-white shadow-sm focus-within:border-neutral-400 focus-within:ring-1 focus-within:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus-within:border-neutral-600 dark:focus-within:ring-neutral-600">
              <TextArea
                controlClassName="min-h-20 resize-y border-0 focus:border-transparent focus:ring-0 dark:border-0"
                onChange={setReply}
                onKeyDown={handleReplyKeyDown}
                placeholder="写下你的回复..."
                ref={replyInputRef}
                value={reply}
              />
              <div className="flex items-center justify-between gap-2 border-t border-neutral-100 bg-neutral-50 px-2 py-1.5 dark:border-neutral-800 dark:bg-neutral-900/50">
                <EmojiPopover onSelect={insertEmoji} />
                <div className="flex items-center gap-3">
                  <span className="hidden text-xs text-neutral-400 sm:block">
                    ⌘/Ctrl + Enter 发送
                  </span>
                  <Button
                    disabled={!reply.trim() || props.replyPending}
                    type="submit"
                  >
                    <Send aria-hidden="true" className="size-4" />
                    发送回复
                  </Button>
                </div>
              </div>
            </div>
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

function OwnerReplyAvatar(props: { avatar?: null | string; name: string }) {
  if (props.avatar) {
    return (
      <img
        alt=""
        className="size-8 shrink-0 rounded-full object-cover"
        src={props.avatar}
      />
    )
  }

  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-300">
      {props.name.slice(0, 1).toUpperCase()}
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

function EmojiPopover(props: { onSelect: (emoji: string) => void }) {
  const [open, setOpen] = useState(false)

  return (
    <Popover.Root onOpenChange={setOpen} open={open}>
      <Popover.Trigger
        aria-label="插入表情"
        className="inline-flex size-8 items-center justify-center rounded text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
        type="button"
      >
        <SmilePlus aria-hidden="true" className="size-4" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner align="start" side="top" sideOffset={8}>
          <Popover.Popup className="z-50 grid w-64 grid-cols-8 gap-1 rounded border border-neutral-200 bg-white p-2 shadow-xl outline-none dark:border-neutral-800 dark:bg-neutral-950">
            {quickEmojis.map((emoji) => (
              <button
                className="flex size-7 items-center justify-center rounded text-lg transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
                key={emoji}
                onClick={() => {
                  props.onSelect(emoji)
                  setOpen(false)
                }}
                type="button"
              >
                {emoji}
              </button>
            ))}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
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

function readPage(value: string | null) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
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
