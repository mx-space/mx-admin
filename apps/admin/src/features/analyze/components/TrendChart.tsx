import type { TrendPoint } from '../types/analyze'

import { Scroll } from '~/ui/scroll'

export function TrendChart(props: { data: TrendPoint[] }) {
  const maxValue = Math.max(
    1,
    ...props.data.flatMap((item) => [item.ip, item.pv]),
  )

  return (
    <div className="p-4">
      <Scroll
        className="border-b border-l border-neutral-200 dark:border-neutral-800"
        orientation="horizontal"
      >
        <div className="flex h-64 items-end gap-3 px-2 pb-6">
          {props.data.map((item) => (
            <div
              className="flex min-w-12 flex-1 flex-col items-center gap-2"
              key={item.label}
            >
              <div className="flex h-48 items-end gap-1">
                <span
                  className="w-3 rounded-t bg-neutral-950 dark:bg-neutral-50"
                  style={{
                    height: `${Math.max(4, (item.pv / maxValue) * 100)}%`,
                  }}
                  title={`PV ${item.pv}`}
                />
                <span
                  className="w-3 rounded-t bg-[var(--color-primary)]"
                  style={{
                    height: `${Math.max(4, (item.ip / maxValue) * 100)}%`,
                  }}
                  title={`IP ${item.ip}`}
                />
              </div>
              <span className="max-w-16 truncate text-xs text-neutral-500 dark:text-neutral-400">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </Scroll>
      <div className="mt-3 flex items-center gap-4 px-2 text-xs text-neutral-500 dark:text-neutral-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-neutral-950 dark:bg-neutral-50" />
          PV
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-[var(--color-primary)]" />
          IP
        </span>
      </div>
    </div>
  )
}
