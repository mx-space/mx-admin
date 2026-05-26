import type { ReactNode } from 'react'

export function SectionHeader(props: {
  description: string
  icon: ReactNode
  title: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
      <div>
        <h2 className="text-sm font-semibold">{props.title}</h2>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          {props.description}
        </p>
      </div>
      <div className="text-neutral-400">{props.icon}</div>
    </div>
  )
}
