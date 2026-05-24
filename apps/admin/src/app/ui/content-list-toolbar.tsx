import { Search } from 'lucide-react'
import type { FormEventHandler, ReactNode } from 'react'

import { Button } from './button'
import { Checkbox } from './checkbox'
import { cn } from './cn'
import { TextInput } from './text-field'

interface ContentListToolbarSelection {
  allVisibleSelected: boolean
  bulkActionDisabled?: boolean
  bulkActionIcon?: ReactNode
  bulkActionLabel: string
  hasVisibleItems: boolean
  indeterminate: boolean
  onBulkAction: () => void
  onToggleAllVisible: (checked: boolean) => void
  selectAllLabel: string
  selectedLabel: string
}

interface ContentListToolbarProps {
  className?: string
  filters?: ReactNode
  hasSearch: boolean
  onClearSearch: () => void
  onSearch: FormEventHandler<HTMLFormElement>
  onSearchValueChange: (value: string) => void
  searchPlaceholder: string
  searchValue: string
  selection?: ContentListToolbarSelection
  summary?: ReactNode
}

const toolbarControlClassName =
  'h-8 text-xs transition-transform active:scale-[0.96]'

export function ContentListToolbar(props: ContentListToolbarProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 flex-col gap-2 border-b border-neutral-200 bg-neutral-50/60 px-4 py-2 dark:border-neutral-800 dark:bg-neutral-950',
        props.className,
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <form
          className="flex min-w-72 flex-1 items-center gap-2"
          onSubmit={props.onSearch}
        >
          <label className="relative min-w-0 flex-1">
            <Search
              aria-hidden="true"
              className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
            />
            <TextInput
              controlClassName="h-8 pl-8 text-xs focus:border-neutral-400 focus:ring-0 dark:focus:border-neutral-600"
              onChange={props.onSearchValueChange}
              placeholder={props.searchPlaceholder}
              value={props.searchValue}
            />
          </label>
          <Button
            className={toolbarControlClassName}
            type="submit"
            variant="subtle"
          >
            搜索
          </Button>
          {props.hasSearch ? (
            <Button
              className={toolbarControlClassName}
              onClick={props.onClearSearch}
              type="button"
              variant="subtle"
            >
              清除
            </Button>
          ) : null}
        </form>

        {props.filters ? (
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {props.filters}
          </div>
        ) : null}

        {props.selection ? (
          <ContentListToolbarSelectionControls selection={props.selection} />
        ) : null}
      </div>
      {props.summary ? (
        <span className="text-xs text-neutral-500 md:hidden dark:text-neutral-400">
          {props.summary}
        </span>
      ) : null}
    </div>
  )
}

function ContentListToolbarSelectionControls(props: {
  selection: ContentListToolbarSelection
}) {
  const selection = props.selection

  return (
    <div className="ml-auto flex min-w-fit items-center gap-2">
      {selection.hasVisibleItems ? (
        <div className="flex h-8 items-center gap-2 rounded px-1 text-xs text-neutral-500 dark:text-neutral-400">
          <Checkbox
            aria-label={selection.selectAllLabel}
            checked={selection.allVisibleSelected}
            indeterminate={selection.indeterminate}
            onCheckedChange={selection.onToggleAllVisible}
          />
          <span className="hidden sm:inline">{selection.selectAllLabel}</span>
        </div>
      ) : null}
      <span className="text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
        {selection.selectedLabel}
      </span>
      <Button
        className={toolbarControlClassName}
        disabled={selection.bulkActionDisabled}
        onClick={selection.onBulkAction}
        type="button"
        variant="subtle"
      >
        {selection.bulkActionIcon}
        <span>{selection.bulkActionLabel}</span>
      </Button>
    </div>
  )
}
