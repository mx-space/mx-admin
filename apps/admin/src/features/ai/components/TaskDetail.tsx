import { ArrowLeft, Loader2, RotateCcw, Trash2, XCircle } from 'lucide-react'
import type { AITask } from '~/api/ai'

import { AITaskStatus } from '~/api/ai'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '~/constants/layout'
import { Button } from '~/ui/primitives/button'
import { Scroll } from '~/ui/primitives/scroll'
import { cn } from '~/utils/cn'

import { statusIcon, taskStatusLabels, taskTypeLabels } from '../constants'
import {
  formatAbsoluteTimestamp,
  getEffectiveStatus,
  getProgress,
  getTaskDetailSummary,
  isBatchTask,
  statusIconClassName,
} from '../utils/ai'
import {
  Code,
  DetailBlock,
  Field,
  JsonBlock,
  SmallBadge,
  StatusBadge,
} from './AiPrimitives'
import { SubTaskStatsView } from './SubTaskStatsView'
import { TaskLogRow } from './TaskLogRow'

export function TaskDetail(props: {
  canceling: boolean
  deleting: boolean
  onBack: () => void
  onCancel: (task: AITask) => void
  onDelete: (task: AITask) => void
  onRetry: (task: AITask) => void
  retrying: boolean
  task: AITask
}) {
  const task = props.task
  const effectiveStatus = getEffectiveStatus(task)
  const Icon = statusIcon[effectiveStatus]
  const canCancel =
    effectiveStatus === AITaskStatus.Pending ||
    effectiveStatus === AITaskStatus.Running
  const canRetry =
    task.status === AITaskStatus.Failed ||
    task.status === AITaskStatus.PartialFailed ||
    task.status === AITaskStatus.Cancelled
  const canDelete =
    task.status === AITaskStatus.Completed ||
    task.status === AITaskStatus.Failed ||
    task.status === AITaskStatus.PartialFailed ||
    task.status === AITaskStatus.Cancelled
  const progress = getProgress(task)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={cn(
          'flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800',
          APP_SHELL_HEADER_HEIGHT_CLASS,
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <button
            className="inline-flex size-8 items-center justify-center rounded text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 lg:hidden dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-50"
            onClick={props.onBack}
            type="button"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
          </button>
          <Icon
            aria-hidden="true"
            className={cn(
              'size-5 shrink-0',
              effectiveStatus === AITaskStatus.Running && 'animate-spin',
              statusIconClassName(effectiveStatus),
            )}
          />
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-neutral-950 dark:text-neutral-50">
              {taskTypeLabels[task.type]}
            </h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {getTaskDetailSummary(task)}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge status={effectiveStatus}>
            {taskStatusLabels[effectiveStatus]}
          </StatusBadge>
          {task.retryCount > 0 ? (
            <SmallBadge tone="warning">重试 {task.retryCount}</SmallBadge>
          ) : null}
          {isBatchTask(task) ? <SmallBadge tone="info">批量</SmallBadge> : null}
        </div>
      </div>

      <Scroll className="flex-1" innerClassName="px-5 py-4">
        {task.error ? (
          <div
            className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/40 dark:text-red-300"
            role="alert"
          >
            <span className="font-medium">错误：</span>
            {task.error}
          </div>
        ) : null}

        {progress !== null ? (
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
              <span>{task.progressMessage ?? '任务进度'}</span>
              <span className="tabular-nums">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded bg-neutral-100 dark:bg-neutral-900">
              <div
                className="h-full rounded bg-[var(--color-primary)] transition-[width]"
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>
          </div>
        ) : null}

        {task.tokensGenerated && task.tokensGenerated > 0 ? (
          <div className="mb-5 inline-flex items-center gap-2 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            已生成{' '}
            <span className="font-medium tabular-nums">
              {task.tokensGenerated}
            </span>{' '}
            个 token
          </div>
        ) : null}

        {task.subTaskStats ? <SubTaskStatsView task={task} /> : null}

        <div className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
          <Field label="任务 ID">
            <Code>{task.id}</Code>
          </Field>
          <Field label="任务类型">{taskTypeLabels[task.type]}</Field>
          <Field label="创建时间">
            {formatAbsoluteTimestamp(task.createdAt)}
          </Field>
          <Field label="开始时间">
            {formatAbsoluteTimestamp(task.startedAt)}
          </Field>
          <Field label="完成时间">
            {formatAbsoluteTimestamp(task.completedAt)}
          </Field>
          <Field label="Worker">{task.workerId ?? '-'}</Field>
          <Field label="总项数">
            <span className="tabular-nums">{task.totalItems ?? '-'}</span>
          </Field>
          <Field label="已完成">
            <span className="tabular-nums">{task.completedItems ?? '-'}</span>
          </Field>
        </div>

        <DetailBlock title="Payload">
          <JsonBlock value={task.payload} />
        </DetailBlock>

        {task.result !== undefined ? (
          <DetailBlock title="Result">
            <JsonBlock value={task.result} />
          </DetailBlock>
        ) : null}

        <DetailBlock title="Logs">
          {task.logs?.length ? (
            <div className="divide-y divide-neutral-100 overflow-hidden rounded border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
              {task.logs.map((log, index) => (
                <TaskLogRow key={`${log.timestamp}-${index}`} log={log} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              暂无日志。
            </p>
          )}
        </DetailBlock>
      </Scroll>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-neutral-200 px-5 py-4 dark:border-neutral-800">
        {canRetry ? (
          <Button
            disabled={props.retrying}
            onClick={() => props.onRetry(task)}
            type="button"
            variant="subtle"
          >
            {props.retrying ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <RotateCcw aria-hidden="true" className="size-4" />
            )}
            重试任务
          </Button>
        ) : null}
        {canCancel ? (
          <Button
            disabled={props.canceling}
            onClick={() => props.onCancel(task)}
            type="button"
            variant="subtle"
          >
            {props.canceling ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <XCircle aria-hidden="true" className="size-4" />
            )}
            取消任务
          </Button>
        ) : null}
        {canDelete ? (
          <Button
            className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-950 dark:text-red-400 dark:hover:bg-red-950/30"
            disabled={props.deleting}
            onClick={() => props.onDelete(task)}
            type="button"
            variant="subtle"
          >
            {props.deleting ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Trash2 aria-hidden="true" className="size-4" />
            )}
            删除任务
          </Button>
        ) : null}
      </div>
    </div>
  )
}
