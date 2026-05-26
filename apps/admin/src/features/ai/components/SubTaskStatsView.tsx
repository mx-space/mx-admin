import type { AITask } from '~/api/ai'

import { cn } from '~/utils/cn'

import { SmallBadge } from './AiPrimitives'

export function SubTaskStatsView(props: { task: AITask }) {
  const stats = props.task.subTaskStats
  if (!stats || stats.total <= 0) return null

  const completeOrFailed = stats.completed + stats.failed
  const progress = (completeOrFailed / stats.total) * 100

  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
        <span>子任务进度</span>
        <span className="tabular-nums">
          {completeOrFailed} / {stats.total}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded bg-neutral-100 dark:bg-neutral-900">
        <div
          className={cn(
            'h-full rounded transition-[width]',
            stats.failed > 0 ? 'bg-red-500' : 'bg-blue-500',
          )}
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs tabular-nums">
        <SmallBadge tone="success">{stats.completed} 完成</SmallBadge>
        <SmallBadge tone="info">{stats.running} 执行中</SmallBadge>
        <SmallBadge>{stats.pending} 等待</SmallBadge>
        {stats.failed > 0 ? (
          <SmallBadge tone="danger">{stats.failed} 失败</SmallBadge>
        ) : null}
      </div>
    </div>
  )
}
