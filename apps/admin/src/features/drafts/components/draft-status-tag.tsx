import { CloudCheck, CloudOff, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { DraftModel } from '~/models/draft'

import { useI18n } from '~/i18n'
import { Tag } from '~/ui/primitives/tag'

const RELATIVE_TIME_TICK_MS = 30_000

export interface DraftStatusTagProps {
  className?: string
  draft: DraftModel | undefined
  isSaving: boolean
}

export function DraftStatusTag(props: DraftStatusTagProps) {
  const { format } = useI18n()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    if (props.isSaving || !props.draft) return
    const timer = window.setInterval(() => {
      setNow(new Date())
    }, RELATIVE_TIME_TICK_MS)
    return () => window.clearInterval(timer)
  }, [props.draft, props.isSaving])

  if (props.isSaving) {
    return (
      <Tag className={props.className}>
        <Loader2
          aria-hidden="true"
          className="size-3.5 shrink-0 animate-spin"
        />
        <span>保存中</span>
      </Tag>
    )
  }

  if (!props.draft) {
    return (
      <Tag className={props.className}>
        <CloudOff aria-hidden="true" className="size-3.5 shrink-0" />
        <span>未保存</span>
      </Tag>
    )
  }

  const savedAt = props.draft.updatedAt ?? props.draft.createdAt
  const absolute = format.dateTime(savedAt)
  const relative = format.relativeTime(savedAt, now)

  return (
    <Tag className={props.className} title={`已保存 ${absolute}`}>
      <CloudCheck aria-hidden="true" className="size-3.5 shrink-0" />
      <span className="truncate">已保存 · {relative}</span>
    </Tag>
  )
}
