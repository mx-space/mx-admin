import { ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { Checkbox } from './checkbox'
import { cn } from './cn'

export interface ContentListItemProps {
  actions?: ReactNode
  checkboxLabel?: string
  className?: string
  leading?: ReactNode
  meta?: ReactNode
  onSelectedChange?: (checked: boolean) => void
  selected?: boolean
  status?: ReactNode
  title: ReactNode
  titleTo?: string
}

export function ContentListItem(props: ContentListItemProps) {
  const selectable = Boolean(props.checkboxLabel && props.onSelectedChange)
  const handleSelectedChange = props.onSelectedChange ?? (() => {})

  return (
    <article
      className={cn(
        'grid gap-x-3 gap-y-2 px-4 py-2.5 transition-colors hover:bg-neutral-50 sm:items-center dark:hover:bg-neutral-900/50',
        selectable
          ? 'grid-cols-[auto_minmax(0,1fr)] sm:grid-cols-[auto_minmax(0,1fr)_auto]'
          : 'grid-cols-[minmax(0,1fr)] sm:grid-cols-[minmax(0,1fr)_auto]',
        props.className,
      )}
    >
      {selectable ? (
        <Checkbox
          aria-label={props.checkboxLabel}
          checked={props.selected ?? false}
          onCheckedChange={handleSelectedChange}
        />
      ) : null}

      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          {props.leading}
          {props.titleTo ? (
            <Link
              className="min-w-0 truncate text-sm font-medium text-neutral-950 outline-none transition-colors hover:text-neutral-600 focus-visible:ring-2 focus-visible:ring-[var(--color-primary-shallow)] dark:text-neutral-50 dark:hover:text-neutral-300"
              to={props.titleTo}
            >
              {props.title}
            </Link>
          ) : (
            <h3 className="min-w-0 truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
              {props.title}
            </h3>
          )}
          {props.status}
        </div>

        {props.meta ? (
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
            {props.meta}
          </div>
        ) : null}
      </div>

      {props.actions ? (
        <div
          className={cn(
            'flex min-w-fit items-center gap-1',
            selectable ? 'col-start-2 sm:col-start-auto' : null,
          )}
        >
          {props.actions}
        </div>
      ) : null}
    </article>
  )
}

export interface ContentEntryListItemProps extends Omit<
  ContentListItemProps,
  'actions'
> {
  deleteDisabled?: boolean
  deleteTitle: string
  editTitle: string
  editTo: string
  externalHref: string
  onDelete: () => void
  onPublishToggle: () => void
  openTitle: string
  publishDisabled?: boolean
  publishLabel: string
}

export function ContentEntryListItem(props: ContentEntryListItemProps) {
  const {
    deleteDisabled,
    deleteTitle,
    editTitle,
    editTo,
    externalHref,
    onDelete,
    onPublishToggle,
    openTitle,
    publishDisabled,
    publishLabel,
    ...itemProps
  } = props

  return (
    <ContentListItem
      {...itemProps}
      actions={
        <>
          <ContentListActionButton
            disabled={publishDisabled}
            onClick={onPublishToggle}
            type="button"
          >
            {publishLabel}
          </ContentListActionButton>
          <ContentListActionLink iconOnly title={editTitle} to={editTo}>
            <Pencil aria-hidden="true" className="size-4" />
          </ContentListActionLink>
          <ContentListActionLink
            href={externalHref}
            iconOnly
            rel="noreferrer"
            target="_blank"
            title={openTitle}
          >
            <ExternalLink aria-hidden="true" className="size-4" />
          </ContentListActionLink>
          <ContentListActionButton
            danger
            disabled={deleteDisabled}
            iconOnly
            onClick={onDelete}
            title={deleteTitle}
            type="button"
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </ContentListActionButton>
        </>
      }
    />
  )
}

const contentListActionClassName =
  'inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-shallow)] disabled:pointer-events-none disabled:opacity-50'
const contentListIconActionClassName = 'size-7 border-transparent px-0'

export function ContentListActionButton(
  props: ComponentPropsWithoutRef<'button'> & {
    danger?: boolean
    iconOnly?: boolean
  },
) {
  const { className, danger, iconOnly, type = 'button', ...rest } = props

  return (
    <button
      className={cn(
        contentListActionClassName,
        iconOnly && contentListIconActionClassName,
        danger
          ? cn(
              'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30',
              iconOnly ? null : 'border-red-200 dark:border-red-950',
            )
          : cn(
              'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-neutral-50',
              iconOnly ? null : 'border-neutral-200 dark:border-neutral-800',
            ),
        className,
      )}
      type={type}
      {...rest}
    />
  )
}

export function ContentListActionLink(
  props: (
    | ({ href: string; to?: never } & ComponentPropsWithoutRef<'a'>)
    | ({ href?: never; to: string } & ComponentPropsWithoutRef<typeof Link>)
  ) & {
    iconOnly?: boolean
  },
) {
  const { className, iconOnly, ...rest } = props
  const actionClassName = cn(
    contentListActionClassName,
    iconOnly && contentListIconActionClassName,
    'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-neutral-50',
    iconOnly ? null : 'border-neutral-200 dark:border-neutral-800',
    className,
  )

  if ('to' in rest && rest.to) {
    return <Link className={actionClassName} {...rest} />
  }

  return <a className={actionClassName} {...rest} />
}

export function ContentListStatusBadge(props: {
  active: boolean
  children: string
}) {
  return (
    <span
      className={cn(
        'shrink-0 rounded px-1.5 py-0.5 text-xs leading-4',
        props.active
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
          : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400',
      )}
    >
      {props.children}
    </span>
  )
}
