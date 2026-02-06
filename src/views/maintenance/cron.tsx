import {
  AlertCircle as AlertCircleIcon,
  AlertTriangle as AlertTriangleIcon,
  CheckCircle as CheckCircleIcon,
  Clock as ClockIcon,
  ListTodo as ListTodoIcon,
  Loader2 as LoaderIcon,
  Play as PlayIcon,
  RefreshCw as RefreshIcon,
  RotateCcw as RetryIcon,
  Trash2 as TrashIcon,
  XCircle as XCircleIcon,
} from 'lucide-vue-next'
import {
  NButton,
  NCollapse,
  NCollapseItem,
  NPopconfirm,
  NProgress,
  NScrollbar,
  NSelect,
  NTag,
  NTooltip,
} from 'naive-ui'
import { computed, defineComponent, ref, watchEffect } from 'vue'
import { toast } from 'vue-sonner'
import type { CronTask, CronTaskDefinition, CronTaskLog } from '~/api/cron-task'
import type { PropType, VNode } from 'vue'

import { useQuery, useQueryClient } from '@tanstack/vue-query'

import { cronTaskApi, CronTaskStatus, CronTaskType } from '~/api/cron-task'
import { HeaderActionButton } from '~/components/button/header-action-button'
import { MasterDetailLayout } from '~/components/layout/master-detail-layout'
import { RelativeTime } from '~/components/time/relative-time'
import { queryKeys } from '~/hooks/queries/keys'
import { useLayout } from '~/hooks/use-layout'

const TaskTypeLabels: Record<CronTaskType, string> = {
  [CronTaskType.CleanAccessRecord]: '清理访问记录',
  [CronTaskType.ResetIPAccess]: '清理 IP 访问记录',
  [CronTaskType.ResetLikedOrReadArticleRecord]: '清理喜欢数',
  [CronTaskType.CleanTempDirectory]: '清理临时文件',
  [CronTaskType.PushToBaiduSearch]: '推送百度搜索',
  [CronTaskType.PushToBingSearch]: '推送 Bing 搜索',
  [CronTaskType.DeleteExpiredJWT]: '删除过期 JWT',
  [CronTaskType.CleanupOrphanImages]: '清理孤儿图片',
}

const TaskStatusLabels: Record<CronTaskStatus, string> = {
  [CronTaskStatus.Pending]: '等待中',
  [CronTaskStatus.Running]: '执行中',
  [CronTaskStatus.Completed]: '已完成',
  [CronTaskStatus.PartialFailed]: '部分失败',
  [CronTaskStatus.Failed]: '失败',
  [CronTaskStatus.Cancelled]: '已取消',
}

const TaskStatusIcons: Record<CronTaskStatus, () => VNode> = {
  [CronTaskStatus.Pending]: () => (
    <ClockIcon class="size-4 text-neutral-400" aria-hidden="true" />
  ),
  [CronTaskStatus.Running]: () => (
    <LoaderIcon class="size-4 animate-spin text-blue-500" aria-hidden="true" />
  ),
  [CronTaskStatus.Completed]: () => (
    <CheckCircleIcon class="size-4 text-green-500" aria-hidden="true" />
  ),
  [CronTaskStatus.PartialFailed]: () => (
    <AlertTriangleIcon class="size-4 text-yellow-500" aria-hidden="true" />
  ),
  [CronTaskStatus.Failed]: () => (
    <AlertCircleIcon class="size-4 text-red-500" aria-hidden="true" />
  ),
  [CronTaskStatus.Cancelled]: () => (
    <XCircleIcon class="size-4 text-neutral-400" aria-hidden="true" />
  ),
}

const TaskStatusColors: Record<CronTaskStatus, string> = {
  [CronTaskStatus.Pending]: 'default',
  [CronTaskStatus.Running]: 'info',
  [CronTaskStatus.Completed]: 'success',
  [CronTaskStatus.PartialFailed]: 'warning',
  [CronTaskStatus.Failed]: 'error',
  [CronTaskStatus.Cancelled]: 'default',
}

export default defineComponent({
  name: 'CronTaskPage',
  setup() {
    const queryClient = useQueryClient()
    const statusFilter = ref<CronTaskStatus | undefined>(undefined)
    const typeFilter = ref<CronTaskType | undefined>(undefined)
    const pageRef = ref(1)
    const sizeRef = ref(50)
    const selectedTaskId = ref<string | null>(null)

    const { data: definitionsData } = useQuery({
      queryKey: queryKeys.cronTask.definitions(),
      queryFn: () => cronTaskApi.getDefinitions(),
      staleTime: 60000,
    })

    const { data, isPending, refetch } = useQuery({
      queryKey: computed(() =>
        queryKeys.cronTask.tasksList({
          status: statusFilter.value,
          type: typeFilter.value,
          page: pageRef.value,
          size: sizeRef.value,
        }),
      ),
      queryFn: () =>
        cronTaskApi.getTasks({
          status: statusFilter.value,
          type: typeFilter.value,
          page: pageRef.value,
          size: sizeRef.value,
        }),
      refetchInterval: 5000,
    })

    const definitions = computed(() => definitionsData.value || [])
    const tasks = computed(() => data.value?.data || [])
    const total = computed(() => data.value?.total || 0)
    const selectedTask = computed(() =>
      tasks.value.find((t) => t.id === selectedTaskId.value),
    )

    const statusOptions = [
      { label: '全部状态', value: undefined as CronTaskStatus | undefined },
      { label: '等待中', value: CronTaskStatus.Pending },
      { label: '执行中', value: CronTaskStatus.Running },
      { label: '已完成', value: CronTaskStatus.Completed },
      { label: '失败', value: CronTaskStatus.Failed },
      { label: '已取消', value: CronTaskStatus.Cancelled },
    ]

    const typeOptions = [
      { label: '全部类型', value: undefined as CronTaskType | undefined },
      ...Object.entries(TaskTypeLabels).map(([value, label]) => ({
        label,
        value: value as CronTaskType,
      })),
    ]

    const handleRefresh = () => {
      refetch()
      queryClient.invalidateQueries({
        queryKey: queryKeys.cronTask.definitions(),
      })
    }

    const handleRunTask = async (type: CronTaskType) => {
      try {
        const result = await cronTaskApi.runTask(type)
        if (result.created) {
          toast.success('任务已创建')
          queryClient.invalidateQueries({
            queryKey: queryKeys.cronTask.tasks(),
          })
        } else {
          toast.info('任务已存在，等待执行中')
        }
      } catch {
        toast.error('创建任务失败')
      }
    }

    const handleCancelTask = async (taskId: string) => {
      await cronTaskApi.cancelTask(taskId)
      queryClient.invalidateQueries({ queryKey: queryKeys.cronTask.tasks() })
    }

    const handleDeleteTask = async (taskId: string) => {
      await cronTaskApi.deleteTask(taskId)
      selectedTaskId.value = null
      queryClient.invalidateQueries({ queryKey: queryKeys.cronTask.tasks() })
      toast.success('任务已删除')
    }

    const handleDeleteCompleted = async () => {
      await cronTaskApi.deleteTasks({
        status: CronTaskStatus.Completed,
        before: Date.now(),
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.cronTask.tasks() })
      toast.success('已清理已完成的任务')
    }

    const { setActions } = useLayout()
    watchEffect(() => {
      setActions(
        <div class="flex items-center gap-2">
          <HeaderActionButton
            icon={<TrashIcon />}
            name="清理已完成"
            variant="error"
            onClick={handleDeleteCompleted}
          />
          <HeaderActionButton
            icon={
              isPending.value ? (
                <LoaderIcon class="animate-spin" />
              ) : (
                <RefreshIcon />
              )
            }
            name="刷新"
            onClick={handleRefresh}
          />
        </div>,
      )
    })

    const EmptyState = () => (
      <div class="absolute inset-0 flex -translate-y-[50px] flex-col items-center justify-center">
        <ListTodoIcon
          class="mb-4 size-12 text-neutral-300 dark:text-neutral-600"
          aria-hidden="true"
        />
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          暂无计划任务
        </p>
      </div>
    )

    const EmptyDetail = () => (
      <div class="flex h-full flex-col items-center justify-center">
        <ListTodoIcon
          class="mb-4 size-10 text-neutral-300 dark:text-neutral-600"
          aria-hidden="true"
        />
        <p class="text-sm text-neutral-400">选择一个任务查看详情</p>
      </div>
    )

    return () => (
      <MasterDetailLayout
        showDetailOnMobile={!!selectedTaskId.value}
        defaultSize={'400px'}
        min={'300px'}
        max={'500px'}
      >
        {{
          list: () => (
            <div class="flex h-full flex-col">
              <NCollapse class="border-b border-neutral-100 p-2 dark:border-neutral-800">
                <NCollapseItem title="计划任务定义" name="definitions">
                  {{
                    'header-extra': () => (
                      <span class="mr-2 text-xs tabular-nums text-neutral-400">
                        {definitions.value.length} 个
                      </span>
                    ),
                    default: () => (
                      <div class="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {definitions.value.map((def) => (
                          <CronDefinitionItem
                            key={def.type}
                            definition={def}
                            onRun={() => handleRunTask(def.type)}
                          />
                        ))}
                      </div>
                    ),
                  }}
                </NCollapseItem>
              </NCollapse>

              <div class="flex shrink-0 flex-wrap items-center gap-2 border-b border-neutral-100 p-3 dark:border-neutral-800">
                <NSelect
                  value={statusFilter.value}
                  onUpdateValue={(v) => {
                    statusFilter.value = v || undefined
                    pageRef.value = 1
                  }}
                  options={statusOptions}
                  size="small"
                  style="width: 110px"
                  clearable
                  placeholder="状态…"
                />
                <NSelect
                  value={typeFilter.value}
                  onUpdateValue={(v) => {
                    typeFilter.value = v || undefined
                    pageRef.value = 1
                  }}
                  options={typeOptions}
                  size="small"
                  style="width: 140px"
                  clearable
                  placeholder="类型…"
                />
                <span class="text-xs tabular-nums text-neutral-400">
                  {total.value} 个任务
                </span>
              </div>

              <NScrollbar class="min-h-0 flex-1">
                {isPending.value && tasks.value.length === 0 ? (
                  <div class="flex items-center justify-center py-16">
                    <LoaderIcon class="size-5 animate-spin text-neutral-400" />
                  </div>
                ) : tasks.value.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div>
                    {tasks.value.map((task) => (
                      <TaskListItem
                        key={task.id}
                        task={task}
                        selected={selectedTaskId.value === task.id}
                        onClick={() => (selectedTaskId.value = task.id)}
                      />
                    ))}
                  </div>
                )}
              </NScrollbar>
            </div>
          ),
          detail: () =>
            selectedTask.value ? (
              <TaskDetailPanel
                task={selectedTask.value}
                onCancel={() => handleCancelTask(selectedTask.value!.id)}
                onDelete={() => handleDeleteTask(selectedTask.value!.id)}
                onBack={() => (selectedTaskId.value = null)}
              />
            ) : null,
          empty: () => <EmptyDetail />,
        }}
      </MasterDetailLayout>
    )
  },
})

const CronDefinitionItem = defineComponent({
  props: {
    definition: {
      type: Object as PropType<CronTaskDefinition>,
      required: true,
    },
    onRun: { type: Function as PropType<() => void>, required: true },
  },
  setup(props) {
    return () => (
      <div class="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
        <div class="min-w-0 flex-1">
          <NTooltip placement="top-start">
            {{
              trigger: () => (
                <span class="cursor-help text-sm text-neutral-900 dark:text-neutral-100">
                  {props.definition.description}
                </span>
              ),
              default: () => (
                <span class="font-mono text-xs">
                  {props.definition.cronExpression}
                </span>
              ),
            }}
          </NTooltip>
        </div>
        <div class="shrink-0 text-xs text-neutral-400">
          {props.definition.nextDate ? (
            <RelativeTime time={new Date(props.definition.nextDate)} />
          ) : (
            '—'
          )}
        </div>
        <NPopconfirm
          positiveText="执行"
          negativeText="取消"
          onPositiveClick={props.onRun}
        >
          {{
            trigger: () => (
              <NButton size="tiny" type="primary" quaternary>
                <PlayIcon class="size-3.5" aria-hidden="true" />
              </NButton>
            ),
            default: () => <span>立即执行此计划任务？</span>,
          }}
        </NPopconfirm>
      </div>
    )
  },
})

const TaskListItem = defineComponent({
  props: {
    task: { type: Object as PropType<CronTask>, required: true },
    selected: { type: Boolean, default: false },
    onClick: { type: Function as PropType<() => void>, required: true },
  },
  setup(props) {
    const StatusIcon = computed(() => TaskStatusIcons[props.task.status])

    return () => (
      <div
        class={[
          'flex cursor-pointer items-center gap-3 border-b border-neutral-100 px-3 py-2.5 transition-colors dark:border-neutral-800',
          props.selected
            ? 'bg-neutral-100 dark:bg-neutral-800'
            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
        ]}
        onClick={props.onClick}
      >
        <StatusIcon.value />
        <div class="min-w-0 flex-1">
          <div class="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {TaskTypeLabels[props.task.type] || props.task.type}
          </div>
          <div class="mt-0.5 text-xs text-neutral-500">
            {props.task.progressMessage || ''}
          </div>
        </div>
        <div class="shrink-0 text-right">
          <NTag size="tiny" type={TaskStatusColors[props.task.status] as any}>
            {TaskStatusLabels[props.task.status]}
          </NTag>
          <div class="mt-1">
            <RelativeTime
              time={new Date(props.task.createdAt)}
              class="text-xs text-neutral-400"
            />
          </div>
        </div>
      </div>
    )
  },
})

const TaskDetailPanel = defineComponent({
  props: {
    task: { type: Object as PropType<CronTask>, required: true },
    onCancel: { type: Function as PropType<() => void>, required: true },
    onDelete: { type: Function as PropType<() => void>, required: true },
    onBack: { type: Function as PropType<() => void>, required: true },
  },
  setup(props) {
    const queryClient = useQueryClient()
    const StatusIcon = computed(() => TaskStatusIcons[props.task.status])

    const canCancel = computed(
      () =>
        props.task.status === CronTaskStatus.Pending ||
        props.task.status === CronTaskStatus.Running,
    )

    const canRetry = computed(
      () =>
        props.task.status === CronTaskStatus.Failed ||
        props.task.status === CronTaskStatus.Cancelled,
    )

    const canDelete = computed(
      () =>
        props.task.status === CronTaskStatus.Completed ||
        props.task.status === CronTaskStatus.Failed ||
        props.task.status === CronTaskStatus.PartialFailed ||
        props.task.status === CronTaskStatus.Cancelled,
    )

    const handleRetryTask = async () => {
      try {
        const result = await cronTaskApi.retryTask(props.task.id)
        if (result.created) {
          toast.success('已创建重试任务')
          queryClient.invalidateQueries({
            queryKey: queryKeys.cronTask.tasks(),
          })
        } else {
          toast.info('任务已存在')
        }
      } catch {
        toast.error('重试失败')
      }
    }

    return () => (
      <NScrollbar class="h-full">
        <div class="p-4">
          <div class="mb-4 flex items-start justify-between">
            <div class="flex items-center gap-3">
              <StatusIcon.value />
              <div>
                <h2 class="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  {TaskTypeLabels[props.task.type] || props.task.type}
                </h2>
                <p class="mt-0.5 text-sm text-neutral-500">
                  {props.task.progressMessage || '计划任务'}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <NTag
                size="small"
                type={TaskStatusColors[props.task.status] as any}
              >
                {TaskStatusLabels[props.task.status]}
              </NTag>
              {props.task.retryCount > 0 && (
                <NTag size="small" type="warning">
                  重试 {props.task.retryCount}
                </NTag>
              )}
            </div>
          </div>

          {props.task.status === CronTaskStatus.Running &&
            props.task.progress !== undefined && (
              <div class="mb-4">
                <NProgress
                  type="line"
                  percentage={props.task.progress}
                  status="info"
                />
              </div>
            )}

          {props.task.error && (
            <div
              class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300"
              role="alert"
            >
              <strong class="font-medium">错误：</strong>
              {props.task.error}
            </div>
          )}

          {(canCancel.value || canRetry.value || canDelete.value) && (
            <div class="mb-4 flex items-center gap-2">
              {canCancel.value && (
                <NPopconfirm
                  positiveText="保留"
                  negativeText="终止"
                  onNegativeClick={props.onCancel}
                >
                  {{
                    trigger: () => (
                      <NButton size="small" type="error" secondary>
                        {{
                          icon: () => (
                            <XCircleIcon class="size-4" aria-hidden="true" />
                          ),
                          default: () => '终止任务',
                        }}
                      </NButton>
                    ),
                    default: () => '终止此任务后将无法恢复',
                  }}
                </NPopconfirm>
              )}
              {canRetry.value && (
                <NButton
                  size="small"
                  type="primary"
                  secondary
                  onClick={handleRetryTask}
                >
                  {{
                    icon: () => <RetryIcon class="size-4" aria-hidden="true" />,
                    default: () => '重试任务',
                  }}
                </NButton>
              )}
              {canDelete.value && (
                <NPopconfirm
                  positiveText="保留"
                  negativeText="删除"
                  onNegativeClick={props.onDelete}
                >
                  {{
                    trigger: () => (
                      <NButton size="small" type="error" tertiary>
                        {{
                          icon: () => (
                            <TrashIcon class="size-4" aria-hidden="true" />
                          ),
                          default: () => '删除任务',
                        }}
                      </NButton>
                    ),
                    default: () => '删除此任务记录？',
                  }}
                </NPopconfirm>
              )}
            </div>
          )}

          {props.task.result && (
            <div class="mb-4">
              <div class="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                结果
              </div>
              <pre class="overflow-auto rounded-lg bg-neutral-100 p-3 font-mono text-xs leading-relaxed dark:bg-neutral-800">
                {JSON.stringify(props.task.result, null, 2)}
              </pre>
            </div>
          )}

          {props.task.logs.length > 0 && (
            <div class="mb-4">
              <div class="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                日志
                <span class="ml-1 tabular-nums text-neutral-500">
                  ({props.task.logs.length})
                </span>
              </div>
              <div class="max-h-48 space-y-0.5 overflow-auto rounded-lg bg-neutral-100 p-3 dark:bg-neutral-800">
                {props.task.logs.map((log, idx) => (
                  <LogLine key={idx} log={log} />
                ))}
              </div>
            </div>
          )}

          <div class="space-y-2 text-xs">
            <div class="flex items-center gap-2">
              <span class="text-neutral-500">任务 ID</span>
              <code class="rounded bg-neutral-100 px-1.5 py-0.5 font-mono dark:bg-neutral-800">
                {props.task.id}
              </code>
            </div>
            {props.task.workerId && (
              <div class="flex items-center gap-2">
                <span class="text-neutral-500">Worker</span>
                <code class="rounded bg-neutral-100 px-1.5 py-0.5 font-mono dark:bg-neutral-800">
                  {props.task.workerId}
                </code>
              </div>
            )}
            <div class="flex items-center gap-2">
              <span class="text-neutral-500">创建于</span>
              <RelativeTime time={new Date(props.task.createdAt)} />
            </div>
            {props.task.startedAt && (
              <div class="flex items-center gap-2">
                <span class="text-neutral-500">开始于</span>
                <RelativeTime time={new Date(props.task.startedAt)} />
              </div>
            )}
            {props.task.completedAt && (
              <div class="flex items-center gap-2">
                <span class="text-neutral-500">完成于</span>
                <RelativeTime time={new Date(props.task.completedAt)} />
              </div>
            )}
          </div>
        </div>
      </NScrollbar>
    )
  },
})

const LogLine = defineComponent({
  props: {
    log: { type: Object as PropType<CronTaskLog>, required: true },
  },
  setup(props) {
    const levelColors: Record<string, string> = {
      info: 'text-blue-600 dark:text-blue-400',
      warn: 'text-yellow-600 dark:text-yellow-400',
      error: 'text-red-600 dark:text-red-400',
    }

    const timeFormatter = new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })

    return () => (
      <div class="flex gap-2 font-mono text-xs">
        <span class="shrink-0 text-neutral-400">
          {timeFormatter.format(props.log.timestamp)}
        </span>
        <span class={['shrink-0', levelColors[props.log.level] || '']}>
          [{props.log.level.toUpperCase()}]
        </span>
        <span class="min-w-0 break-words text-neutral-700 dark:text-neutral-300">
          {props.log.message}
        </span>
      </div>
    )
  },
})
