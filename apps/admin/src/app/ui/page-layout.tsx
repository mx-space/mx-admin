import {
  Group as PanelGroup,
  Separator as PanelResizeHandle,
  Panel as ResizablePanel,
} from 'react-resizable-panels'
import type { ReactNode } from 'react'

import { cn } from './cn'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from './layout'

export function AppPage(props: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        'flex h-full min-h-0 flex-col bg-white dark:bg-neutral-950',
        props.className,
      )}
    >
      {props.children}
    </section>
  )
}

export function PageHeader(props: {
  actions?: ReactNode
  className?: string
  description?: ReactNode
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
      <div className="min-w-0">
        <h1 className="truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
          {props.title}
        </h1>
        {props.description ? (
          <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
            {props.description}
          </p>
        ) : null}
      </div>
      {props.actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {props.actions}
        </div>
      ) : null}
    </header>
  )
}

export function MasterDetailLayout(props: {
  className?: string
  children?: ReactNode
  defaultSize?: number
  detail: ReactNode
  detailClassName?: string
  list: ReactNode
  listClassName?: string
  maxSize?: number
  minSize?: number
  showDetailOnMobile?: boolean
}) {
  const defaultSize = props.defaultSize ?? 0.38
  const minSize = props.minSize ?? 0.25
  const maxSize = props.maxSize ?? 0.5
  const detailMinSize = 1 - maxSize

  return (
    <div
      className={cn(
        'relative h-full min-h-0 overflow-hidden bg-white dark:bg-neutral-950',
        props.className,
      )}
    >
      <div className="absolute inset-0 overflow-hidden lg:hidden">
        <div
          className={cn(
            'absolute inset-0 min-h-0 overflow-hidden transition-transform duration-300 ease-out',
            props.showDetailOnMobile ? '-translate-x-full' : 'translate-x-0',
            props.listClassName,
          )}
        >
          {props.list}
        </div>
        <div
          className={cn(
            'absolute inset-0 min-h-0 min-w-0 overflow-hidden transition-transform duration-300 ease-out',
            props.showDetailOnMobile ? 'translate-x-0' : 'translate-x-full',
            props.detailClassName,
          )}
        >
          {props.detail}
        </div>
      </div>

      <PanelGroup
        className="hidden h-full min-h-0 lg:flex"
        orientation="horizontal"
      >
        <ResizablePanel
          className={cn('min-h-0 overflow-hidden', props.listClassName)}
          defaultSize={toPanelPercent(defaultSize)}
          maxSize={toPanelPercent(maxSize)}
          minSize={toPanelPercent(minSize)}
        >
          {props.list}
        </ResizablePanel>
        <PanelResizeHandle className="group relative w-0 shrink-0 cursor-col-resize border-r border-neutral-200 outline-none transition-colors focus-visible:border-neutral-400 dark:border-neutral-800 dark:focus-visible:border-neutral-600">
          <span className="absolute left-1/2 top-1/2 h-8 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-300 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 dark:bg-neutral-700" />
        </PanelResizeHandle>
        <ResizablePanel
          className={cn(
            'min-h-0 min-w-0 overflow-hidden',
            props.detailClassName,
          )}
          minSize={toPanelPercent(detailMinSize)}
        >
          {props.detail}
        </ResizablePanel>
      </PanelGroup>

      {props.children}
    </div>
  )
}

function toPanelPercent(value: number) {
  const percentage = value <= 1 ? value * 100 : value
  return `${percentage}%`
}
