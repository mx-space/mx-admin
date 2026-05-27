import { Layers } from 'lucide-react'
import type { AITask } from '~/api/ai'

import { AITaskStatus } from '~/api/ai'
import { useI18n } from '~/i18n'
import { cn } from '~/utils/cn'

import {
  statusIcon,
  taskStatusLabelKeys,
  taskTypeLabelKeys,
} from '../constants'
import {
  formatRelativeTimestamp,
  getEffectiveStatus,
  getTaskProgressLabel,
  getTaskSummary,
  isBatchTask,
  statusIconClassName,
} from '../utils/ai'
import { StatusBadge } from './AiPrimitives'

export function TaskRow(props: {
  onSelect: () => void
  selected: boolean
  task: AITask
}) {
  const { t } = useI18n()
  const effectiveStatus = getEffectiveStatus(props.task)
  const Icon = statusIcon[effectiveStatus]
  const progressLabel = getTaskProgressLabel(props.task)

  return (
    <button
      className={cn(
        'flex w-full cursor-pointer items-center gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors last:border-b-0 dark:border-neutral-800/50',
        props.selected
          ? 'bg-neutral-100 dark:bg-neutral-900'
          : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/70',
      )}
      onClick={props.onSelect}
      type="button"
    >
      <Icon
        aria-hidden="true"
        className={cn(
          'size-4 shrink-0',
          effectiveStatus === AITaskStatus.Running && 'animate-spin',
          statusIconClassName(effectiveStatus),
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
            {t(taskTypeLabelKeys[props.task.type])}
          </span>
          {isBatchTask(props.task) ? (
            <Layers aria-hidden="true" className="size-3 text-blue-500" />
          ) : null}
        </div>
        <p className="mt-1 truncate text-xs text-neutral-500 dark:text-neutral-400">
          {getTaskSummary(props.task, t)}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <StatusBadge status={effectiveStatus}>
          {progressLabel ?? t(taskStatusLabelKeys[effectiveStatus])}
        </StatusBadge>
        <div className="mt-1 text-xs tabular-nums text-neutral-400">
          {formatRelativeTimestamp(props.task.createdAt)}
        </div>
      </div>
    </button>
  )
}
