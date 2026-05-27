import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, RefreshCw, Trash2 } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import type { AITaskType } from '~/api/ai'

import {
  AITaskStatus,
  cancelAiTask,
  deleteAiTask,
  deleteAiTasks,
  getAiTasks,
  retryAiTask,
} from '~/api/ai'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '~/constants/layout'
import { useI18n } from '~/i18n'
import { CompactPagination } from '~/ui/data/compact-pagination'
import { MasterDetailLayout } from '~/ui/layout/page-layout'
import { Button } from '~/ui/primitives/button'
import { Scroll } from '~/ui/primitives/scroll'
import { SelectField } from '~/ui/primitives/select'
import { cn } from '~/utils/cn'

import {
  aiTasksQueryKey,
  pageSize,
  statusOptionKeys,
  typeOptionKeys,
} from '../constants'
import {
  getErrorMessage,
  readPositivePage,
  readTaskStatusFilter,
  readTaskTypeFilter,
} from '../utils/ai'
import { TaskDetail } from './TaskDetail'
import { TaskRow } from './TaskRow'
import {
  TaskDetailEmpty,
  TasksEmpty,
  TasksError,
  TasksSkeleton,
} from './TaskStates'

export function AiTasksSurface() {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchParamsKey = searchParams.toString()
  const [statusFilter, setStatusFilter] = useState<AITaskStatus | ''>(
    readTaskStatusFilter(searchParams.get('status')),
  )
  const [typeFilter, setTypeFilter] = useState<AITaskType | ''>(
    readTaskTypeFilter(searchParams.get('type')),
  )
  const [page, setPage] = useState(readPositivePage(searchParams.get('page')))
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    searchParams.get('id'),
  )
  const [showDetailOnMobile, setShowDetailOnMobile] = useState(
    Boolean(searchParams.get('id')),
  )

  const queryParams = {
    page,
    size: pageSize,
    status: statusFilter || undefined,
    type: typeFilter || undefined,
  }

  const tasksQuery = useQuery({
    placeholderData: (previous) => previous,
    queryFn: () => getAiTasks(queryParams),
    queryKey: [...aiTasksQueryKey, queryParams],
    refetchInterval: 5000,
  })

  const tasks = tasksQuery.data?.data ?? []
  const total = tasksQuery.data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null

  const statusOptions = useMemo(
    () =>
      statusOptionKeys.map((option) => ({
        label: t(option.labelKey),
        value: option.value,
      })),
    [t],
  )
  const typeOptions = useMemo(
    () =>
      typeOptionKeys.map((option) => ({
        label: t(option.labelKey),
        value: option.value,
      })),
    [t],
  )

  useLayoutEffect(() => {
    const nextStatus = readTaskStatusFilter(searchParams.get('status'))
    const nextType = readTaskTypeFilter(searchParams.get('type'))
    const nextPage = readPositivePage(searchParams.get('page'))
    const nextSelectedId = searchParams.get('id')

    setStatusFilter((value) => (value === nextStatus ? value : nextStatus))
    setTypeFilter((value) => (value === nextType ? value : nextType))
    setPage((value) => (value === nextPage ? value : nextPage))
    setSelectedTaskId((value) =>
      value === nextSelectedId ? value : nextSelectedId,
    )
    setShowDetailOnMobile(Boolean(nextSelectedId))
  }, [searchParamsKey])

  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    if (statusFilter) next.set('status', statusFilter)
    else next.delete('status')
    if (typeFilter) next.set('type', typeFilter)
    else next.delete('type')
    if (page > 1) next.set('page', String(page))
    else next.delete('page')
    if (selectedTaskId) next.set('id', selectedTaskId)
    else next.delete('id')

    if (next.toString() !== searchParamsKey) {
      setSearchParams(next, { replace: true })
    }
  }, [
    page,
    searchParams,
    searchParamsKey,
    selectedTaskId,
    setSearchParams,
    statusFilter,
    typeFilter,
  ])

  useEffect(() => {
    if (
      selectedTaskId &&
      !selectedTask &&
      tasksQuery.isSuccess &&
      !tasksQuery.isFetching
    ) {
      setSelectedTaskId(null)
      setShowDetailOnMobile(false)
    }
  }, [
    selectedTask,
    selectedTaskId,
    tasksQuery.isFetching,
    tasksQuery.isSuccess,
  ])

  const invalidateTasks = async () => {
    await queryClient.invalidateQueries({ queryKey: aiTasksQueryKey })
  }

  const retryMutation = useMutation({
    mutationFn: retryAiTask,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, t('ai.tasks.toast.retryFailed'))),
    onSuccess: async (result) => {
      toast.success(
        result.created
          ? t('ai.tasks.toast.retryCreated')
          : t('ai.tasks.toast.taskExists'),
      )
      await invalidateTasks()
    },
  })

  const cancelMutation = useMutation({
    mutationFn: cancelAiTask,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, t('ai.tasks.toast.cancelFailed'))),
    onSuccess: invalidateTasks,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAiTask,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, t('ai.tasks.toast.deleteFailed'))),
    onSuccess: async () => {
      toast.success(t('ai.tasks.toast.deleted'))
      setSelectedTaskId(null)
      setShowDetailOnMobile(false)
      await invalidateTasks()
    },
  })

  const clearCompletedMutation = useMutation({
    mutationFn: () =>
      deleteAiTasks({
        before: Date.now(),
        status: AITaskStatus.Completed,
      }),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, t('ai.tasks.toast.clearFailed'))),
    onSuccess: async (result) => {
      toast.success(t('ai.tasks.toast.cleared', { count: result.deleted }))
      await invalidateTasks()
    },
  })

  const resetFilters = () => {
    setStatusFilter('')
    setTypeFilter('')
    setPage(1)
  }

  const selectTask = (taskId: string) => {
    setSelectedTaskId(taskId)
    setShowDetailOnMobile(true)
  }

  return (
    <MasterDetailLayout
      showDetailOnMobile={showDetailOnMobile}
      list={
        <section className="flex h-full min-h-0 flex-col border-b border-neutral-200 lg:border-b-0 lg:border-r dark:border-neutral-800">
          <div
            className={cn(
              'flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800',
              APP_SHELL_HEADER_HEIGHT_CLASS,
            )}
          >
            <div className="min-w-0">
              <h2 className="text-sm font-medium">{t('ai.tasks.title')}</h2>
            </div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {t('ai.tasks.countSuffix', { count: total })}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                disabled={clearCompletedMutation.isPending}
                onClick={() => {
                  if (window.confirm(t('ai.confirm.clearCompleted'))) {
                    clearCompletedMutation.mutate()
                  }
                }}
                type="button"
                variant="subtle"
              >
                {clearCompletedMutation.isPending ? (
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <Trash2 aria-hidden="true" className="size-4" />
                )}
                {t('ai.action.clearCompleted')}
              </Button>
              <Button
                disabled={tasksQuery.isFetching}
                onClick={() => void tasksQuery.refetch()}
                type="button"
                variant="subtle"
              >
                <RefreshCw
                  aria-hidden="true"
                  className={cn(
                    'size-4',
                    tasksQuery.isFetching && 'animate-spin',
                  )}
                />
                {t('ai.action.refresh')}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <SelectField
              aria-label={t('ai.filter.statusAria')}
              onValueChange={(value) => {
                setStatusFilter(value)
                setPage(1)
              }}
              options={statusOptions}
              value={statusFilter}
            />
            <SelectField
              aria-label={t('ai.filter.typeAria')}
              onValueChange={(value) => {
                setTypeFilter(value)
                setPage(1)
              }}
              options={typeOptions}
              value={typeFilter}
            />
            <Button
              className="col-span-2 justify-self-end"
              onClick={resetFilters}
              type="button"
              variant="subtle"
            >
              {t('ai.action.resetFilters')}
            </Button>
          </div>

          <Scroll className="flex-1">
            {tasksQuery.isLoading && tasks.length === 0 ? (
              <TasksSkeleton />
            ) : tasksQuery.isError ? (
              <TasksError onRetry={() => void tasksQuery.refetch()} />
            ) : tasks.length === 0 ? (
              <TasksEmpty />
            ) : (
              tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  onSelect={() => selectTask(task.id)}
                  selected={selectedTask?.id === task.id}
                  task={task}
                />
              ))
            )}
          </Scroll>

          {pageCount > 1 ? (
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <span className="text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
                {t('ai.page.pageIndex', { page })}
              </span>
              <CompactPagination
                onPageChange={setPage}
                onPageSizeChange={() => undefined}
                page={page}
                pageCount={pageCount}
                pageSize={pageSize}
                pageSizes={[pageSize]}
              />
            </div>
          ) : null}
        </section>
      }
      detail={
        <section className="min-h-0">
          {selectedTask ? (
            <TaskDetail
              canceling={cancelMutation.isPending}
              deleting={deleteMutation.isPending}
              onBack={() => setShowDetailOnMobile(false)}
              onCancel={(task) => {
                if (
                  window.confirm(t('ai.confirm.cancelTask', { id: task.id }))
                ) {
                  cancelMutation.mutate(task.id)
                }
              }}
              onDelete={(task) => {
                if (
                  window.confirm(t('ai.confirm.deleteTask', { id: task.id }))
                ) {
                  deleteMutation.mutate(task.id)
                }
              }}
              onRetry={(task) => retryMutation.mutate(task.id)}
              retrying={retryMutation.isPending}
              task={selectedTask}
            />
          ) : (
            <TaskDetailEmpty />
          )}
        </section>
      }
    />
  )
}
