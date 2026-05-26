import { useMemo } from 'react'
import type { TopicModel } from '~/models/topic'

import { cn } from '~/utils/cn'

import { getInitial } from '../utils/topic-form'

export function TopicAvatar(props: { className?: string; topic: TopicModel }) {
  const label = useMemo(() => getInitial(props.topic.name), [props.topic.name])

  if (props.topic.icon) {
    return (
      <img
        alt={`${props.topic.name} 图标`}
        className={cn('size-10 shrink-0 rounded object-cover', props.className)}
        loading="lazy"
        src={props.topic.icon}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded bg-neutral-100 text-sm font-semibold text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300',
        props.className,
      )}
    >
      {label}
    </div>
  )
}
