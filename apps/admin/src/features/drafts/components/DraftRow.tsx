import type { DraftModel } from '~/models/draft'

import { cn } from '~/utils/cn'
import { relativeTimeFromNow } from '~/utils/time'

import { refTypeMeta } from '../constants'

export function DraftRow(props: {
  draft: DraftModel
  onSelect: () => void
  selected: boolean
}) {
  const meta = refTypeMeta[props.draft.refType]
  const Icon = meta.icon

  return (
    <button
      className={cn(
        'flex w-full items-start gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors last:border-b-0 dark:border-neutral-800/50',
        props.selected
          ? 'bg-neutral-100 dark:bg-neutral-900'
          : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/70',
      )}
      onClick={props.onSelect}
      type="button"
    >
      <span
        className={cn(
          'mt-0.5 inline-flex shrink-0 items-center gap-1 rounded border px-2 py-1 text-xs',
          meta.className,
        )}
      >
        <Icon aria-hidden="true" className="size-3" />
        {meta.label}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
            {props.draft.title || '无标题'}
          </h3>
          <span className="text-xs tabular-nums text-neutral-400">
            v{props.draft.version}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <span>{props.draft.refId ? '编辑中' : '新建'}</span>
          <span>{props.draft.contentFormat ?? 'markdown'}</span>
          <time dateTime={props.draft.updatedAt}>
            {relativeTimeFromNow(props.draft.updatedAt)}
          </time>
        </div>
      </div>
    </button>
  )
}
