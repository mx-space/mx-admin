import { useQuery } from '@tanstack/react-query'
import {
  CheckCheck,
  ChevronRight,
  Globe,
  Mail,
  Monitor,
  Send,
  ShieldAlert,
  Smartphone,
  Trash2,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { CommentModel } from '~/models/comment'
import type { FormEvent, KeyboardEvent } from 'react'
import type { LocalReply } from '../types/comments'

import { getOwner } from '~/api/options'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '~/constants/layout'
import { IpInfoPopover } from '~/features/_shared/components/ip-info-popover'
import { CommentState } from '~/models/comment'
import { Button } from '~/ui/primitives/button'
import { MarkdownRender } from '~/ui/primitives/markdown-render'
import { Scroll } from '~/ui/primitives/scroll'
import { TextArea } from '~/ui/primitives/text-field'
import { cn } from '~/utils/cn'

import {
  formatCommentDate,
  getDeviceInfo,
  getReferenceLink,
} from '../utils/comments'
import {
  Avatar,
  EmojiPopover,
  MetaItem,
  OwnerReplyAvatar,
} from './CommentPrimitives'

export function CommentDetail(props: {
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

  const submitReply = async (event: FormEvent) => {
    event.preventDefault()
    await sendReply()
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
                {formatCommentDate(
                  props.comment.editedAt ?? props.comment.createdAt,
                )}
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
                        {formatCommentDate(item.createdAt)}
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
            <div className="shadow-xs overflow-hidden rounded border border-neutral-200 bg-white focus-within:border-neutral-400 focus-within:ring-1 focus-within:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus-within:border-neutral-600 dark:focus-within:ring-neutral-600">
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
