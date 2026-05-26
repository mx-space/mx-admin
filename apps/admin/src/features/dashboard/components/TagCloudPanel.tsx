import { Panel } from '~/ui/panel'

import { EmptyDashboardBlock } from './DashboardPrimitives'

export function TagCloudPanel(props: {
  tags: Array<{ count: number; tag: string }>
}) {
  return (
    <Panel title="标签云">
      <div className="flex min-h-40 flex-wrap content-start gap-2 p-4">
        {props.tags.length === 0 ? (
          <EmptyDashboardBlock />
        ) : (
          props.tags.map((tag) => (
            <span
              className="rounded bg-neutral-100 px-2 py-1 text-sm text-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
              key={tag.tag}
            >
              {tag.tag}
              <span className="ml-1 text-xs text-neutral-500">{tag.count}</span>
            </span>
          ))
        )}
      </div>
    </Panel>
  )
}
