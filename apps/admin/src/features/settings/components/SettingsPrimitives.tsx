import { ArrowLeft, X } from 'lucide-react'
import type { ReactNode } from 'react'

import { APP_SHELL_HEADER_HEIGHT_CLASS } from '~/constants/layout'
import { Panel } from '~/ui/primitives/panel'
import { Scroll } from '~/ui/primitives/scroll'
import { cn } from '~/utils/cn'

export function PanelHeader(props: {
  children?: ReactNode
  onBack: () => void
  title: string
}) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800',
        APP_SHELL_HEADER_HEIGHT_CLASS,
      )}
    >
      <div className="flex items-center gap-3">
        <button
          className="flex size-8 items-center justify-center rounded text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
          onClick={props.onBack}
          type="button"
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
        </button>
        <h2 className="text-base font-semibold">{props.title}</h2>
      </div>
      {props.children}
    </div>
  )
}

export function Modal(props: {
  children: ReactNode
  onClose: () => void
  open: boolean
  title: string
}) {
  if (!props.open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <h2 className="text-lg font-semibold">{props.title}</h2>
          <button
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
            onClick={props.onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
        <Scroll className="flex-1" innerClassName="p-5">
          {props.children}
        </Scroll>
      </div>
    </div>
  )
}

export function FieldShell(props: { children: ReactNode; label: string }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-neutral-700 dark:text-neutral-300">
        {props.label}
      </span>
      {props.children}
    </label>
  )
}

export function EmptyState(props: { icon: ReactNode; label: string }) {
  return (
    <div className="flex min-h-60 flex-col items-center justify-center px-4 text-center">
      <div className="text-neutral-300">{props.icon}</div>
      <p className="mt-3 text-sm text-neutral-500">{props.label}</p>
    </div>
  )
}

export function SettingsSkeleton(props: { title: string }) {
  return (
    <Panel title={props.title}>
      <div className="space-y-3 p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            className="h-9 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900"
            key={index}
          />
        ))}
      </div>
    </Panel>
  )
}

export function SmallBadge(props: { children: ReactNode }) {
  return (
    <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
      {props.children}
    </span>
  )
}
