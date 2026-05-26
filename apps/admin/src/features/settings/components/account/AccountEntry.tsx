import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '~/utils/cn'

export function AccountEntry(props: {
  active: boolean
  description: string
  icon: ReactNode
  onClick: () => void
  title: string
}) {
  return (
    <button
      className={cn(
        'flex w-full items-center justify-between rounded border border-neutral-200 px-4 py-3 text-left transition-colors dark:border-neutral-800',
        props.active
          ? 'bg-neutral-100 dark:bg-neutral-900'
          : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/70',
      )}
      onClick={props.onClick}
      type="button"
    >
      <span className="flex items-center gap-3">
        <span className="flex size-8 items-center justify-center rounded bg-neutral-100 text-neutral-500 dark:bg-neutral-900">
          {props.icon}
        </span>
        <span>
          <span className="block text-sm font-medium">{props.title}</span>
          <span className="mt-0.5 block text-xs text-neutral-500">
            {props.description}
          </span>
        </span>
      </span>
      <ChevronRight
        aria-hidden="true"
        className={cn('size-4 text-neutral-400', props.active && 'rotate-90')}
      />
    </button>
  )
}
