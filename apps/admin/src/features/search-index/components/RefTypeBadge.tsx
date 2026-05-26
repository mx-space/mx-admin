import { cn } from '~/ui/cn'

import { refTypeClassNames, refTypeLabel } from '../constants'

export function RefTypeBadge(props: { refType: string }) {
  return (
    <span
      className={cn(
        'inline-flex rounded border px-2 py-1 text-xs font-medium',
        refTypeClassNames[props.refType] ??
          'border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300',
      )}
    >
      {refTypeLabel[props.refType] ?? props.refType}
    </span>
  )
}
