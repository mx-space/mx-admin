import type { SearchDocumentAdminRow } from '~/api/search-index'

import { cn } from '~/utils/cn'

import { formatRelativeDate } from '../utils/format'
import { RefTypeBadge } from './RefTypeBadge'
import { SmallBadge } from './SmallBadge'

export function SearchIndexRow(props: {
  onSelect: () => void
  row: SearchDocumentAdminRow
  selected: boolean
}) {
  const row = props.row

  return (
    <button
      className={cn(
        'flex w-full cursor-pointer items-start gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors last:border-b-0 dark:border-neutral-800/50',
        props.selected
          ? 'bg-neutral-100 dark:bg-neutral-900'
          : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/70',
      )}
      onClick={props.onSelect}
      type="button"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <RefTypeBadge refType={row.refType} />
          {row.lang ? <SmallBadge>{row.lang}</SmallBadge> : null}
          {!row.isPublished ? (
            <SmallBadge tone="warning">未发布</SmallBadge>
          ) : null}
          {row.hasPassword ? <SmallBadge>密码</SmallBadge> : null}
        </div>
        <h3 className="truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
          {row.title || <span className="text-neutral-400">(无标题)</span>}
        </h3>
        <div className="text-xs tabular-nums text-neutral-400">
          title {row.titleLength} · body {row.bodyLength}
        </div>
      </div>
      <div className="shrink-0 text-xs text-neutral-500 dark:text-neutral-400">
        {formatRelativeDate(row.modifiedAt)}
      </div>
    </button>
  )
}
