import type { ReadingRankItem } from '~/api/activity'

import { useI18n } from '~/i18n'
import { cn } from '~/utils/cn'

import { formatNumber } from '../utils/analyze'
import { ProgressBar } from './AnalyzePrimitives'
import { ReferenceButton } from './ReferenceButton'

export function TopReadingsChart(props: { items: ReadingRankItem[] }) {
  const { t } = useI18n()
  const max = Math.max(...props.items.map((item) => item.count), 1)

  return (
    <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
      {props.items.map((item, index) => (
        <div
          className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 px-4 py-3"
          key={item.refId}
        >
          <span
            className={cn(
              'flex size-7 items-center justify-center rounded-full text-xs font-semibold',
              index < 3
                ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400',
            )}
          >
            {index + 1}
          </span>
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-3">
              <ReferenceButton
                id={item.ref?.id}
                title={item.ref?.title ?? t('analyze.deletedPost')}
              />
              <span className="text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
                {formatNumber(item.count)}
              </span>
            </div>
            <ProgressBar
              className="mt-2"
              value={Math.max((item.count / max) * 100, 3)}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
