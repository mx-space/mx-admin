import type { ReactNode } from 'react'

import { formatNumber } from '../utils/analyze'
import { ProgressBar } from './AnalyzePrimitives'

export function DistributionList(props: {
  items: Array<{ name: string; value: number }>
}) {
  const total = props.items.reduce((sum, item) => sum + item.value, 0)
  const max = Math.max(...props.items.map((item) => item.value), 1)

  return (
    <div className="grid gap-2">
      {props.items.map((item) => (
        <div className="grid gap-1" key={item.name || 'unknown'}>
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="truncate text-neutral-700 dark:text-neutral-200">
              {item.name || '未知'}
            </span>
            <span className="tabular-nums text-neutral-500 dark:text-neutral-400">
              {formatNumber(item.value)}
              {total > 0 ? ` · ${Math.round((item.value / total) * 100)}%` : ''}
            </span>
          </div>
          <ProgressBar value={Math.max((item.value / max) * 100, 3)} />
        </div>
      ))}
    </div>
  )
}

export function DistributionGroup(props: {
  icon: ReactNode
  items: Array<{ name: string; value: number }>
  label: string
}) {
  if (!props.items.length) return null

  return (
    <section>
      <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
        {props.icon}
        {props.label}
      </div>
      <DistributionList items={props.items.slice(0, 5)} />
    </section>
  )
}
