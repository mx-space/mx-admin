import { Panel } from '~/ui/primitives/panel'

import { formatNumber } from '../utils/dashboard'
import { EmptyDashboardBlock } from './DashboardPrimitives'

export function TopArticlesPanel(props: {
  articles: Array<{ id: string; likes: number; reads: number; title: string }>
}) {
  return (
    <Panel title="热门文章">
      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {props.articles.length === 0 ? (
          <EmptyDashboardBlock />
        ) : (
          props.articles.slice(0, 8).map((article) => (
            <div
              className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
              key={article.id}
            >
              <span className="min-w-0 truncate text-neutral-800 dark:text-neutral-100">
                {article.title}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-neutral-500">
                {formatNumber(article.reads)} reads ·{' '}
                {formatNumber(article.likes)} likes
              </span>
            </div>
          ))
        )}
      </div>
    </Panel>
  )
}
