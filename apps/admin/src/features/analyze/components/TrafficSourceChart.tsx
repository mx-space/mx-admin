import type { TrafficSourceResponse } from '~/api/analyze'

import { useI18n } from '~/i18n'
import { Scroll } from '~/ui/primitives/scroll'

import { formatNumber } from '../utils/analyze'
import { DistributionList } from './DistributionList'

export function TrafficSourceChart(props: { data: TrafficSourceResponse }) {
  const { t } = useI18n()

  return (
    <div className="grid gap-3 p-4">
      <DistributionList items={props.data.categories} />
      {props.data.details.length ? (
        <div className="border-t border-neutral-100 pt-3 dark:border-neutral-900">
          <div className="mb-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
            {t('analyze.traffic.detail')}
          </div>
          <Scroll viewportClassName="max-h-36" innerClassName="grid gap-2">
            {props.data.details.slice(0, 8).map((item) => (
              <div
                className="flex items-center justify-between gap-3 text-xs"
                key={item.source}
              >
                <span className="min-w-0 truncate font-mono text-neutral-600 dark:text-neutral-300">
                  {item.source || t('analyze.traffic.direct')}
                </span>
                <span className="tabular-nums text-neutral-400">
                  {formatNumber(item.count)}
                </span>
              </div>
            ))}
          </Scroll>
        </div>
      ) : null}
    </div>
  )
}
