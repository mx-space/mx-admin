import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  ListTodo,
  Loader2,
  Play,
  RefreshCw,
  RotateCcw,
  Trash2,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type {
  CronTask,
  CronTaskDefinition,
  CronTaskLog,
} from '../api/cron-tasks'

import {
  cancelCronTask,
  CronTaskStatus,
  CronTaskType,
  deleteCronTask,
  deleteCronTasks,
  getCronTaskDefinitions,
  getCronTasks,
  retryCronTask,
  runCronTask,
} from '../api/cron-tasks'
import { Button } from '../ui/button'
import { cn } from '../ui/cn'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '../ui/layout'
import { MasterDetailLayout } from '../ui/page-layout'
import { Scroll } from '../ui/scroll'
import { SelectField } from '../ui/select'

const taskQueryKey = ['cron-tasks']
const definitionQueryKey = ['cron-task-definitions']

const taskTypeLabels: Record<CronTaskType, string> = {
  [CronTaskType.CleanAccessRecord]: '清理访问记录',
  [CronTaskType.CleanCommentUploads]: '清理评论图片上传',
  [CronTaskType.CleanTempDirectory]: '清理临时文件',
  [CronTaskType.DeleteExpiredJWT]: '删除过期 JWT',
  [CronTaskType.PushToBaiduSearch]: '推送百度搜索',
  [CronTaskType.PushToBingSearch]: '推送 Bing 搜索',
  [CronTaskType.RebuildSearchIndex]: '重建搜索索引',
  [CronTaskType.ResetIPAccess]: '清理 IP 访问记录',
  [CronTaskType.ResetLikedOrReadArticleRecord]: '清理喜欢数',
}

const taskStatusLabels: Record<CronTaskStatus, string> = {
  [CronTaskStatus.Cancelled]: '已取消',
  [CronTaskStatus.Completed]: '已完成',
  [CronTaskStatus.Failed]: '失败',
  [CronTaskStatus.PartialFailed]: '部分失败',
  [CronTaskStatus.Pending]: '等待中',
  [CronTaskStatus.Running]: '执行中',
}

const taskStatusIcons: Record<CronTaskStatus, LucideIcon> = {
  [CronTaskStatus.Cancelled]: XCircle,
  [CronTaskStatus.Completed]: CheckCircle,
  [CronTaskStatus.Failed]: AlertCircle,
  [CronTaskStatus.PartialFailed]: AlertTriangle,
  [CronTaskStatus.Pending]: Clock,
  [CronTaskStatus.Running]: Loader2,
}

const taskStatusClassNames: Record<CronTaskStatus, string> = {
  [CronTaskStatus.Cancelled]:
    'border-neutral-200 bg-neutral-50 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400',
  [CronTaskStatus.Completed]:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300',
  [CronTaskStatus.Failed]:
    'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300',
  [CronTaskStatus.PartialFailed]:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300',
  [CronTaskStatus.Pending]:
    'border-neutral-200 bg-white text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300',
  [CronTaskStatus.Running]:
    'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300',
}

const taskStatusIconClassNames: Record<CronTaskStatus, string> = {
  [CronTaskStatus.Cancelled]: 'text-neutral-400',
  [CronTaskStatus.Completed]: 'text-emerald-500',
  [CronTaskStatus.Failed]: 'text-red-500',
  [CronTaskStatus.PartialFailed]: 'text-amber-500',
  [CronTaskStatus.Pending]: 'text-neutral-400',
  [CronTaskStatus.Running]: 'animate-spin text-blue-500',
}

const statusOptions = [
  { label: '全部状态', value: '' },
  ...Object.values(CronTaskStatus).map((status) => ({
    label: taskStatusLabels[status],
    value: status,
  })),
]

const typeOptions = [
  { label: '全部类型', value: '' },
  ...Object.values(CronTaskType).map((type) => ({
    label: taskTypeLabels[type],
    value: type,
  })),
]

export function CronPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<CronTaskStatus | undefined>()
  const [typeFilter, setTypeFilter] = useState<CronTaskType | undefined>()
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [showDetailOnMobile, setShowDetailOnMobile] = useState(false)

  const definitionsQuery = useQuery({
    queryFn: getCronTaskDefinitions,
    queryKey: definitionQueryKey,
    staleTime: 60000,
  })

  const tasksQuery = useQuery({
    queryFn: () =>
      getCronTasks({
        page: 1,
        size: 50,
        status: statusFilter,
        type: typeFilter,
      }),
    queryKey: [...taskQueryKey, { statusFilter, typeFilter }],
    refetchInterval: 5000,
  })

  const definitions = definitionsQuery.data ?? []
  const tasks = useMemo(() => tasksQuery.data?.data ?? [], [tasksQuery.data])
  const total = tasksQuery.data?.total ?? 0
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null

  useEffect(() => {
    if (selectedTaskId && !selectedTask) {
      setSelectedTaskId(null)
      setShowDetailOnMobile(false)
    }
  }, [selectedTask, selectedTaskId])

  const invalidateCronTasks = async () => {
    await queryClient.invalidateQueries({ queryKey: taskQueryKey })
  }

  const runMutation = useMutation({
    mutationFn: runCronTask,
    onError: () => {
      toast.error('创建任务失败')
    },
    onSuccess: async (result) => {
      if (result.created) toast.success('任务已创建')
      else toast.info('任务已存在，等待执行中')
      await invalidateCronTasks()
    },
  })

  const cancelMutation = useMutation({
    mutationFn: cancelCronTask,
    onSuccess: async () => {
      toast.success('任务已终止')
      await invalidateCronTasks()
    },
  })

  const retryMutation = useMutation({
    mutationFn: retryCronTask,
    onError: () => {
      toast.error('重试失败')
    },
    onSuccess: async (result) => {
      if (result.created) toast.success('已创建重试任务')
      else toast.info('任务已存在')
      await invalidateCronTasks()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCronTask,
    onSuccess: async (_, taskId) => {
      toast.success('任务已删除')
      if (selectedTaskId === taskId) {
        setSelectedTaskId(null)
        setShowDetailOnMobile(false)
      }
      await invalidateCronTasks()
    },
  })

  const clearCompletedMutation = useMutation({
    mutationFn: () =>
      deleteCronTasks({
        before: Date.now(),
        status: CronTaskStatus.Completed,
      }),
    onSuccess: async (result) => {
      toast.success(`已清理 ${result.deleted} 个已完成任务`)
      await invalidateCronTasks()
    },
  })

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: definitionQueryKey }),
      invalidateCronTasks(),
    ])
  }

  const selectTask = (taskId: string) => {
    setSelectedTaskId(taskId)
    setShowDetailOnMobile(true)
  }

  return (
    <MasterDetailLayout
      defaultSize={0.42}
      maxSize={0.5}
      minSize={0.3}
      showDetailOnMobile={showDetailOnMobile}
      list={
        <section className="flex min-h-0 flex-col border-b border-neutral-200 lg:border-b-0 lg:border-r dark:border-neutral-800">
          <div
            className={cn(
              'flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800',
              APP_SHELL_HEADER_HEIGHT_CLASS,
            )}
          >
            <div className="min-w-0">
              <h2 className="text-sm font-medium">计划任务</h2>
            </div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {total} / {definitions.length}
            </span>
            <div className="flex items-center gap-2">
              <Button
                disabled={clearCompletedMutation.isPending}
                onClick={() => clearCompletedMutation.mutate()}
                type="button"
                variant="subtle"
              >
                <Trash2 aria-hidden="true" className="size-4" />
                清理已完成
              </Button>
              <Button
                disabled={tasksQuery.isFetching || definitionsQuery.isFetching}
                onClick={() => {
                  void refreshAll()
                }}
                type="button"
                variant="subtle"
              >
                <RefreshCw
                  aria-hidden="true"
                  className={cn(
                    'size-4',
                    (tasksQuery.isFetching || definitionsQuery.isFetching) &&
                      'animate-spin',
                  )}
                />
                刷新
              </Button>
            </div>
          </div>

          <div className="border-b border-neutral-200 dark:border-neutral-800">
            <details className="group" open>
              <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-medium outline-none transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900">
                <span>任务定义</span>
                <span className="text-xs font-normal tabular-nums text-neutral-400">
                  {definitions.length}
                </span>
              </summary>
              <Scroll
                className="border-t border-neutral-100 dark:border-neutral-800"
                innerClassName="divide-y divide-neutral-100 dark:divide-neutral-800"
                viewportClassName="max-h-72"
              >
                {definitionsQuery.isLoading ? (
                  <DefinitionSkeleton />
                ) : definitions.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-neutral-500">
                    暂无任务定义
                  </div>
                ) : (
                  definitions.map((definition) => (
                    <DefinitionRow
                      definition={definition}
                      key={definition.type}
                      onRun={() => {
                        if (window.confirm('立即执行此计划任务？')) {
                          runMutation.mutate(definition.type)
                        }
                      }}
                      running={runMutation.isPending}
                    />
                  ))
                )}
              </Scroll>
            </details>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <Select
              ariaLabel="任务状态过滤"
              onChange={(value) =>
                setStatusFilter(
                  (value || undefined) as CronTaskStatus | undefined,
                )
              }
              options={statusOptions}
              value={statusFilter ?? ''}
            />
            <Select
              ariaLabel="任务类型过滤"
              onChange={(value) =>
                setTypeFilter((value || undefined) as CronTaskType | undefined)
              }
              options={typeOptions}
              value={typeFilter ?? ''}
            />
          </div>

          <Scroll className="flex-1">
            {tasksQuery.isLoading && tasks.length === 0 ? (
              <TaskListSkeleton />
            ) : tasks.length === 0 ? (
              <TaskEmptyState />
            ) : (
              tasks.map((task) => (
                <TaskListItem
                  key={task.id}
                  onSelect={() => selectTask(task.id)}
                  selected={selectedTaskId === task.id}
                  task={task}
                />
              ))
            )}
          </Scroll>
        </section>
      }
      detail={
        <section className="min-h-0">
          {selectedTask ? (
            <TaskDetail
              onBack={() => setShowDetailOnMobile(false)}
              onCancel={() => {
                if (window.confirm('终止此任务后将无法恢复。')) {
                  cancelMutation.mutate(selectedTask.id)
                }
              }}
              onDelete={() => {
                if (window.confirm('删除此任务记录？')) {
                  deleteMutation.mutate(selectedTask.id)
                }
              }}
              onRetry={() => retryMutation.mutate(selectedTask.id)}
              task={selectedTask}
            />
          ) : (
            <TaskDetailEmptyState />
          )}
        </section>
      }
    />
  )
}

function DefinitionRow(props: {
  definition: CronTaskDefinition
  onRun: () => void
  running: boolean
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-neutral-950 dark:text-neutral-50">
          {props.definition.description ||
            taskTypeLabels[props.definition.type]}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono dark:bg-neutral-900">
            {props.definition.cronExpression}
          </code>
          <span>{formatNullableDate(props.definition.nextDate)}</span>
        </div>
      </div>
      <Button
        aria-label={`立即执行 ${props.definition.description}`}
        disabled={props.running}
        onClick={props.onRun}
        type="button"
      >
        <Play aria-hidden="true" className="size-4" />
        执行
      </Button>
    </div>
  )
}

function TaskListItem(props: {
  onSelect: () => void
  selected: boolean
  task: CronTask
}) {
  const Icon = taskStatusIcons[props.task.status]

  return (
    <button
      className={cn(
        'flex w-full cursor-pointer items-center gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors dark:border-neutral-800',
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
          taskStatusIconClassNames[props.task.status],
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
          {taskTypeLabels[props.task.type] || props.task.type}
        </div>
        <div className="mt-1 truncate text-xs text-neutral-500 dark:text-neutral-400">
          {props.task.progressMessage || props.task.id}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <StatusBadge status={props.task.status} />
        <div className="mt-1 text-xs tabular-nums text-neutral-400">
          {formatRelativeDate(props.task.createdAt)}
        </div>
      </div>
    </button>
  )
}

function TaskDetail(props: {
  onBack: () => void
  onCancel: () => void
  onDelete: () => void
  onRetry: () => void
  task: CronTask
}) {
  const task = props.task
  const Icon = taskStatusIcons[task.status]
  const canCancel =
    task.status === CronTaskStatus.Pending ||
    task.status === CronTaskStatus.Running
  const canRetry =
    task.status === CronTaskStatus.Failed ||
    task.status === CronTaskStatus.Cancelled
  const canDelete = [
    CronTaskStatus.Cancelled,
    CronTaskStatus.Completed,
    CronTaskStatus.Failed,
    CronTaskStatus.PartialFailed,
  ].includes(task.status)
  const progress = Math.max(0, Math.min(task.progress ?? 0, 100))

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={cn(
          'flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-5 dark:border-neutral-800',
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
          <div className="flex min-w-0 items-start gap-3">
            <Icon
              aria-hidden="true"
              className={cn(
                'mt-0.5 size-5 shrink-0',
                taskStatusIconClassNames[task.status],
              )}
            />
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-neutral-950 dark:text-neutral-50">
                {taskTypeLabels[task.type] || task.type}
              </h2>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {task.progressMessage || '计划任务'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge status={task.status} />
          {task.retryCount > 0 ? (
            <span className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300">
              重试 {task.retryCount}
            </span>
          ) : null}
        </div>
      </div>

      <div className="border-b border-neutral-200 px-5 py-3 dark:border-neutral-800">
        {task.progress !== undefined ? (
          <div>
            <div className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-900">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-1 text-xs tabular-nums text-neutral-500">
              {progress}%
            </div>
          </div>
        ) : null}

        {(canCancel || canRetry || canDelete) && (
          <div
            className={cn(
              'flex flex-wrap items-center gap-2',
              task.progress !== undefined ? 'mt-3' : null,
            )}
          >
            {canCancel ? (
              <Button
                className="text-red-600 dark:text-red-400"
                onClick={props.onCancel}
                type="button"
                variant="subtle"
              >
                <XCircle aria-hidden="true" className="size-4" />
                终止任务
              </Button>
            ) : null}
            {canRetry ? (
              <Button onClick={props.onRetry} type="button" variant="subtle">
                <RotateCcw aria-hidden="true" className="size-4" />
                重试任务
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                className="text-red-600 dark:text-red-400"
                onClick={props.onDelete}
                type="button"
                variant="subtle"
              >
                <Trash2 aria-hidden="true" className="size-4" />
                删除任务
              </Button>
            ) : null}
          </div>
        )}
      </div>

      <Scroll className="flex-1" innerClassName="px-5 py-4">
        {task.error ? (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
            <span className="font-medium">错误：</span>
            {task.error}
          </div>
        ) : null}

        {task.result ? (
          <DetailSection title="结果">
            <Scroll
              className="rounded bg-neutral-100 dark:bg-neutral-900"
              orientation="both"
            >
              <pre className="p-3 font-mono text-xs leading-relaxed text-neutral-800 dark:text-neutral-200">
                {JSON.stringify(task.result, null, 2)}
              </pre>
            </Scroll>
          </DetailSection>
        ) : null}

        <DetailSection
          title={
            <>
              日志
              <span className="ml-1 tabular-nums text-neutral-500">
                ({task.logs.length})
              </span>
            </>
          }
        >
          {task.logs.length === 0 ? (
            <div className="rounded bg-neutral-50 px-3 py-6 text-center text-sm text-neutral-500 dark:bg-neutral-900">
              暂无日志
            </div>
          ) : (
            <Scroll
              className="rounded bg-neutral-100 dark:bg-neutral-900"
              orientation="both"
              viewportClassName="max-h-64"
              innerClassName="p-3"
            >
              {task.logs.map((log, index) => (
                <LogLine key={`${log.timestamp}-${index}`} log={log} />
              ))}
            </Scroll>
          )}
        </DetailSection>

        <DetailSection title="元数据">
          <dl className="grid gap-2 text-xs">
            <MetadataRow label="任务 ID" value={task.id} />
            <MetadataRow label="类型" value={task.type} />
            {task.workerId ? (
              <MetadataRow label="Worker" value={task.workerId} />
            ) : null}
            <MetadataRow
              label="创建于"
              value={formatDateTime(task.createdAt)}
            />
            {task.startedAt ? (
              <MetadataRow
                label="开始于"
                value={formatDateTime(task.startedAt)}
              />
            ) : null}
            {task.completedAt ? (
              <MetadataRow
                label="完成于"
                value={formatDateTime(task.completedAt)}
              />
            ) : null}
          </dl>
        </DetailSection>
      </Scroll>
    </div>
  )
}

function StatusBadge(props: { status: CronTaskStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded border px-2 py-1 text-xs font-medium',
        taskStatusClassNames[props.status],
      )}
    >
      {taskStatusLabels[props.status]}
    </span>
  )
}

function Select(props: {
  ariaLabel: string
  onChange: (value: string) => void
  options: { label: string; value: string }[]
  value: string
}) {
  return (
    <SelectField
      aria-label={props.ariaLabel}
      onValueChange={props.onChange}
      options={props.options}
      value={props.value}
    />
  )
}

function DetailSection(props: { children: ReactNode; title: ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {props.title}
      </h3>
      {props.children}
    </section>
  )
}

function MetadataRow(props: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-3">
      <dt className="text-neutral-500 dark:text-neutral-400">{props.label}</dt>
      <dd>
        <code className="break-all rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
          {props.value}
        </code>
      </dd>
    </div>
  )
}

function LogLine(props: { log: CronTaskLog }) {
  const levelClassNames: Record<CronTaskLog['level'], string> = {
    error: 'text-red-600 dark:text-red-400',
    info: 'text-blue-600 dark:text-blue-400',
    warn: 'text-amber-600 dark:text-amber-400',
  }

  return (
    <div className="flex gap-2 font-mono text-xs leading-5">
      <span className="shrink-0 text-neutral-400">
        {formatLogTime(props.log.timestamp)}
      </span>
      <span className={cn('shrink-0', levelClassNames[props.log.level])}>
        [{props.log.level.toUpperCase()}]
      </span>
      <span className="min-w-0 break-words text-neutral-700 dark:text-neutral-300">
        {props.log.message}
      </span>
    </div>
  )
}

function DefinitionSkeleton() {
  return (
    <div className="space-y-3 px-4 py-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          className="h-11 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900"
          key={index}
        />
      ))}
    </div>
  )
}

function TaskListSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          className="h-16 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900"
          key={index}
        />
      ))}
    </div>
  )
}

function TaskEmptyState() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
      <ListTodo
        aria-hidden="true"
        className="mb-4 size-10 text-neutral-300 dark:text-neutral-700"
      />
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        暂无计划任务
      </p>
    </div>
  )
}

function TaskDetailEmptyState() {
  return (
    <div className="flex h-full min-h-72 flex-col items-center justify-center px-6 text-center">
      <ListTodo
        aria-hidden="true"
        className="mb-4 size-10 text-neutral-300 dark:text-neutral-700"
      />
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        选择一个任务查看详情
      </p>
    </div>
  )
}

function formatNullableDate(value: string | null | undefined) {
  if (!value) return '下次执行：未提供'

  return `下次执行：${formatDateTime(value)}`
}

function formatDateTime(value: number | string) {
  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

function formatLogTime(value: number) {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value))
}

function formatRelativeDate(value: number) {
  const diff = Date.now() - value
  const absolute = Math.abs(diff)
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (absolute < minute) return '刚刚'
  if (absolute < hour) return `${Math.round(diff / minute)} 分钟前`
  if (absolute < day) return `${Math.round(diff / hour)} 小时前`

  return formatDateTime(value)
}
