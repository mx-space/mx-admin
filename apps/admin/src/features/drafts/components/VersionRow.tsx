import { Loader2, RotateCcw } from 'lucide-react'
import type { DraftDiffStats, VersionItem } from '../types/drafts'

import { Button } from '~/ui/primitives/button'
import { cn } from '~/utils/cn'
import { relativeTimeFromNow } from '~/utils/time'

export function VersionRow(props: {
  diffStats: DraftDiffStats | null
  item: VersionItem
  onRestore: () => void
  onSelect: () => void
  restorePending: boolean
  selected: boolean
}) {
  return (
    <div
      className={cn(
        'group flex w-full items-center gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors dark:border-neutral-800/60',
        props.selected
          ? 'bg-neutral-100 dark:bg-neutral-900'
          : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/70',
      )}
      onClick={props.onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          props.onSelect()
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-neutral-950 dark:text-neutral-50">
            v{props.item.version}
          </span>
          {props.item.isCurrent ? (
            <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
              当前
            </span>
          ) : null}
          {props.item.isFullSnapshot !== undefined ? (
            <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
              {props.item.isFullSnapshot ? '全量' : '增量'}
            </span>
          ) : null}
          {props.item.refVersion !== undefined ? (
            <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
              = v{props.item.refVersion}
            </span>
          ) : null}
        </div>
        <p className="mt-1 truncate text-xs text-neutral-500 dark:text-neutral-400">
          {props.item.title || '无标题'} ·{' '}
          {relativeTimeFromNow(props.item.savedAt)}
        </p>
      </div>
      {props.diffStats ? (
        <span className="shrink-0 text-xs tabular-nums text-neutral-500">
          {props.diffStats.isSame
            ? '相同'
            : `${props.diffStats.delta > 0 ? '+' : ''}${props.diffStats.delta} 字`}
        </span>
      ) : null}
      {!props.item.isCurrent ? (
        <Button
          aria-label={`恢复版本 ${props.item.version}`}
          className="h-7 px-2 opacity-0 transition-opacity group-hover:opacity-100"
          disabled={props.restorePending}
          onClick={(event) => {
            event.stopPropagation()
            props.onRestore()
          }}
          type="button"
          variant="subtle"
        >
          {props.restorePending ? (
            <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
          ) : (
            <RotateCcw aria-hidden="true" className="size-3.5" />
          )}
        </Button>
      ) : null}
    </div>
  )
}
