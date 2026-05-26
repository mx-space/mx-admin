import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { RefreshCw, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

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
} from '~/api/cron-tasks'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '~/constants/layout'
import { MasterDetailLayout } from '~/ui/layout/page-layout'
import { Button } from '~/ui/primitives/button'
import { Scroll } from '~/ui/primitives/scroll'
import { cn } from '~/utils/cn'

import {
  definitionQueryKey,
  definitionStaleTime,
  statusOptions,
  taskListPageSize,
  taskQueryKey,
  taskRefetchInterval,
  typeOptions,
} from '../constants'
import {
  DefinitionSkeleton,
  Select,
  TaskDetailEmptyState,
  TaskEmptyState,
  TaskListSkeleton,
} from './CronPrimitives'
import { DefinitionRow } from './DefinitionRow'
import { TaskDetail } from './TaskDetail'
import { TaskListItem } from './TaskListItem'

export function CronRouteViewContent() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<CronTaskStatus | undefined>()
  const [typeFilter, setTypeFilter] = useState<CronTaskType | undefined>()
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [showDetailOnMobile, setShowDetailOnMobile] = useState(false)

  const definitionsQuery = useQuery({
    queryFn: getCronTaskDefinitions,
    queryKey: definitionQueryKey,
    staleTime: definitionStaleTime,
  })

  const tasksQuery = useQuery({
    queryFn: () =>
      getCronTasks({
        page: 1,
        size: taskListPageSize,
        status: statusFilter,
        type: typeFilter,
      }),
    queryKey: [...taskQueryKey, { statusFilter, typeFilter }],
    refetchInterval: taskRefetchInterval,
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
              <summary className="outline-hidden flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900">
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
      maxSize={0.5}
      minSize={0.3}
      showDetailOnMobile={showDetailOnMobile}
    />
  )
}
