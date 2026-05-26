import { Hash } from 'lucide-react'
import type { TopicModel } from '~/models/topic'

import { cn } from '~/ui/cn'

import { TopicAvatar } from './TopicAvatar'

export function TopicRow(props: {
  onSelect: () => void
  selected: boolean
  topic: TopicModel
}) {
  return (
    <button
      className={cn(
        'flex w-full items-center gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors last:border-b-0 dark:border-neutral-800/60',
        props.selected
          ? 'bg-neutral-100 dark:bg-neutral-900'
          : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/70',
      )}
      onClick={props.onSelect}
      type="button"
    >
      <TopicAvatar topic={props.topic} />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
          {props.topic.name}
        </h3>
        <p className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate font-mono text-xs text-neutral-400">
          <Hash aria-hidden="true" className="size-3 shrink-0" />
          {props.topic.slug}
        </p>
      </div>
    </button>
  )
}
