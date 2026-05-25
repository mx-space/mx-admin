import { Search } from 'lucide-react'
import type { FormEventHandler, ReactNode } from 'react'

import { Button } from './button'
import { Checkbox } from './checkbox'
import { cn } from './cn'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from './layout'
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
  actions?: ReactNode
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
  'h-8 shrink-0 px-2.5 text-xs transition-transform active:scale-[0.96]'

export function ContentListPageHeader(props: {
  action: ReactNode
  className?: string
  icon: ReactNode
  summary?: ReactNode
  title: ReactNode
}) {
  return (
    <header
      className={cn(
        'flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-950',
        APP_SHELL_HEADER_HEIGHT_CLASS,
        props.className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex size-7 shrink-0 items-center justify-center border border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
          {props.icon}
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
            {props.title}
          </h2>
          {props.summary ? (
            <p className="mt-0.5 hidden truncate text-xs text-neutral-500 sm:block dark:text-neutral-400">
              {props.summary}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">{props.action}</div>
    </header>
  )
}

export function ContentListToolbar(props: ContentListToolbarProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 flex-col gap-2 border-b border-neutral-200 bg-white px-4 py-2 dark:border-neutral-800 dark:bg-neutral-950',
        props.className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
        <form
          className="flex min-w-0 items-center gap-2 xl:min-w-64 xl:flex-1"
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

        {props.filters || props.actions || props.selection ? (
          <div className="flex min-w-0 flex-wrap items-center gap-2 xl:justify-end">
            {props.filters ? (
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                {props.filters}
              </div>
            ) : null}
            {props.actions ? (
              <div className="flex shrink-0 items-center gap-2">
                {props.actions}
              </div>
            ) : null}
            {props.selection ? (
              <ContentListToolbarSelectionControls
                selection={props.selection}
              />
            ) : null}
          </div>
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
    <div className="flex min-w-fit items-center justify-start lg:justify-end">
      <div className="inline-flex h-8 max-w-full items-center overflow-hidden rounded border border-neutral-200 bg-neutral-50 text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
        {selection.hasVisibleItems ? (
          <div className="inline-flex h-full items-center gap-2 border-r border-neutral-200 px-2 dark:border-neutral-800">
            <Checkbox
              aria-label={selection.selectAllLabel}
              checked={selection.allVisibleSelected}
              indeterminate={selection.indeterminate}
              onCheckedChange={selection.onToggleAllVisible}
            />
            <span className="hidden sm:inline">{selection.selectAllLabel}</span>
          </div>
        ) : null}
        <span className="px-2 tabular-nums text-neutral-500 dark:text-neutral-400">
          {selection.selectedLabel}
        </span>
        <button
          className="inline-flex h-full shrink-0 items-center gap-1.5 border-l border-neutral-200 px-2.5 font-medium text-neutral-700 outline-none transition-colors hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-[var(--color-primary-shallow)] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-800"
          disabled={selection.bulkActionDisabled}
          onClick={selection.onBulkAction}
          type="button"
        >
          {selection.bulkActionIcon}
          <span>{selection.bulkActionLabel}</span>
        </button>
      </div>
    </div>
  )
}
