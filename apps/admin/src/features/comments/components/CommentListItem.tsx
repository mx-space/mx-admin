import type { CommentModel } from '~/models/comment'

import { Checkbox } from '~/ui/checkbox'
import { cn } from '~/ui/cn'

import { formatCommentDate } from '../utils/comments'
import { Avatar } from './CommentPrimitives'

export function CommentListItem(props: {
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
            {formatCommentDate(props.comment.createdAt)}
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
