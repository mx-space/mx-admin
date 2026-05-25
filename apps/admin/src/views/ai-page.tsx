import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  BookOpenText,
  CheckCircle2,
  Clock,
  FileText,
  Languages,
  Layers,
  ListTodo,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  WandSparkles,
  XCircle,
} from 'lucide-react'
import { useEffect, useLayoutEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type {
  AIInsights,
  AISummary,
  AITask,
  AITaskLog,
  AITranslation,
  ArticleInfo,
  GroupedInsightsResponse,
  GroupedSummaryResponse,
  GroupedTranslationResponse,
  TranslationEntry,
  TranslationEntryKeyPath,
} from '../api/ai'

import { relativeTimeFromNow } from '~/utils/time'

import {
  AiQueryType,
  AITaskStatus,
  AITaskType,
  cancelAiTask,
  createInsightsTask,
  createInsightsTranslationTask,
  createSlugBackfillTask,
  createSummaryTask,
  createTranslationAllTask,
  createTranslationTask,
  deleteAiTask,
  deleteAiTasks,
  deleteInsights,
  deleteSummary,
  deleteTranslation,
  deleteTranslationEntry,
  generateTranslationEntries,
  getAiTasks,
  getInsightsGrouped,
  getSlugBackfillStatus,
  getSummariesGrouped,
  getTranslationEntries,
  getTranslationsGrouped,
  retryAiTask,
  updateInsights,
  updateSummary,
  updateTranslation,
  updateTranslationEntry,
  writerGenerate,
} from '../api/ai'
import { Button } from '../ui/button'
import { cn } from '../ui/cn'
import { CompactPagination } from '../ui/compact-pagination'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '../ui/layout'
import { AppPage, MasterDetailLayout, PageHeader } from '../ui/page-layout'
import { Scroll } from '../ui/scroll'
import { SelectField } from '../ui/select'
import { TextArea, TextInput } from '../ui/text-field'

const aiTasksQueryKey = ['ai', 'tasks']

const pageSize = 50

const taskTypeLabels: Record<AITaskType, string> = {
  [AITaskType.Summary]: '摘要生成',
  [AITaskType.Translation]: '翻译',
  [AITaskType.TranslationBatch]: '批量翻译',
  [AITaskType.TranslationAll]: '全量翻译',
  [AITaskType.SlugBackfill]: 'Slug 回填',
  [AITaskType.Insights]: '精读生成',
  [AITaskType.InsightsTranslation]: '精读翻译',
}

const taskStatusLabels: Record<AITaskStatus, string> = {
  [AITaskStatus.Pending]: '等待中',
  [AITaskStatus.Running]: '执行中',
  [AITaskStatus.Completed]: '已完成',
  [AITaskStatus.PartialFailed]: '部分失败',
  [AITaskStatus.Failed]: '失败',
  [AITaskStatus.Cancelled]: '已取消',
}

const statusIcon: Record<AITaskStatus, LucideIcon> = {
  [AITaskStatus.Pending]: Clock,
  [AITaskStatus.Running]: Loader2,
  [AITaskStatus.Completed]: CheckCircle2,
  [AITaskStatus.PartialFailed]: AlertTriangle,
  [AITaskStatus.Failed]: AlertCircle,
  [AITaskStatus.Cancelled]: XCircle,
}

const statusClassName: Record<AITaskStatus, string> = {
  [AITaskStatus.Pending]:
    'border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300',
  [AITaskStatus.Running]:
    'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300',
  [AITaskStatus.Completed]:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300',
  [AITaskStatus.PartialFailed]:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300',
  [AITaskStatus.Failed]:
    'border-red-200 bg-red-50 text-red-700 dark:border-red-950 dark:bg-red-950/40 dark:text-red-300',
  [AITaskStatus.Cancelled]:
    'border-neutral-200 bg-neutral-50 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400',
}

const statusOptions: Array<{ label: string; value: AITaskStatus | '' }> = [
  { label: '全部状态', value: '' },
  { label: '等待中', value: AITaskStatus.Pending },
  { label: '执行中', value: AITaskStatus.Running },
  { label: '已完成', value: AITaskStatus.Completed },
  { label: '部分失败', value: AITaskStatus.PartialFailed },
  { label: '失败', value: AITaskStatus.Failed },
  { label: '已取消', value: AITaskStatus.Cancelled },
]

const typeOptions: Array<{ label: string; value: AITaskType | '' }> = [
  { label: '全部类型', value: '' },
  { label: '摘要生成', value: AITaskType.Summary },
  { label: '翻译', value: AITaskType.Translation },
  { label: '批量翻译', value: AITaskType.TranslationBatch },
  { label: '全量翻译', value: AITaskType.TranslationAll },
  { label: 'Slug 回填', value: AITaskType.SlugBackfill },
  { label: '精读生成', value: AITaskType.Insights },
  { label: '精读翻译', value: AITaskType.InsightsTranslation },
]

type AiSurface =
  | 'entries'
  | 'insights'
  | 'slug'
  | 'summaries'
  | 'tasks'
  | 'translations'

const aiSurfaceTabs: Array<{
  icon: LucideIcon
  label: string
  path: string
  value: AiSurface
}> = [
  { icon: ListTodo, label: '任务队列', path: '/ai/tasks', value: 'tasks' },
  { icon: FileText, label: '摘要', path: '/ai/summary', value: 'summaries' },
  {
    icon: Languages,
    label: '翻译',
    path: '/ai/translation',
    value: 'translations',
  },
  {
    icon: BookOpenText,
    label: '精读',
    path: '/ai/insights',
    value: 'insights',
  },
  {
    icon: Sparkles,
    label: '词表',
    path: '/ai/translation-entries',
    value: 'entries',
  },
  {
    icon: WandSparkles,
    label: 'Slug 回填',
    path: '/ai/slug-backfill',
    value: 'slug',
  },
]

export function AiPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [surface, setSurface] = useState<AiSurface>(() =>
    getInitialAiSurface(location.pathname),
  )

  useEffect(() => {
    setSurface(getInitialAiSurface(location.pathname))
  }, [location.pathname])

  return (
    <AppPage>
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2" role="tablist">
            {aiSurfaceTabs.map((tab) => {
              const Icon = tab.icon
              const active = surface === tab.value

              return (
                <button
                  aria-selected={active}
                  className={cn(
                    'inline-flex h-9 items-center gap-2 rounded border px-3 text-sm font-medium transition-colors',
                    active
                      ? 'border-neutral-950 bg-neutral-950 text-white dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-950'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-900',
                  )}
                  key={tab.value}
                  onClick={() => navigate(tab.path)}
                  role="tab"
                  type="button"
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        }
        description="管理任务、摘要、翻译、精读、词表与 slug 回填。"
        title="AI 管理"
      />

      <div className="min-h-0 flex-1">
        {surface === 'tasks' ? <AiTasksSurface /> : null}
        {surface === 'summaries' ? <SummariesSurface /> : null}
        {surface === 'translations' ? <TranslationsSurface /> : null}
        {surface === 'insights' ? <InsightsSurface /> : null}
        {surface === 'entries' ? <TranslationEntriesSurface /> : null}
        {surface === 'slug' ? <SlugBackfillSurface /> : null}
      </div>
    </AppPage>
  )
}

function getInitialAiSurface(pathname: string): AiSurface {
  if (pathname.endsWith('/summary')) return 'summaries'
  if (pathname.endsWith('/translation')) return 'translations'
  if (pathname.endsWith('/insights')) return 'insights'
  if (pathname.endsWith('/translation-entries')) return 'entries'
  if (pathname.endsWith('/slug-backfill')) return 'slug'
  if (pathname.endsWith('/tasks')) return 'tasks'

  return 'tasks'
}

function AiTasksSurface() {
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
      toast.error(getErrorMessage(error, '重试失败')),
    onSuccess: async (result) => {
      toast.success(result.created ? '已创建重试任务' : '任务已存在')
      await invalidateTasks()
    },
  })

  const cancelMutation = useMutation({
    mutationFn: cancelAiTask,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '取消失败')),
    onSuccess: invalidateTasks,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAiTask,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '删除失败')),
    onSuccess: async () => {
      toast.success('任务已删除')
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
      toast.error(getErrorMessage(error, '清理失败')),
    onSuccess: async (result) => {
      toast.success(`已清理 ${result.deleted} 个任务`)
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
      defaultSize={0.4}
      maxSize={0.5}
      minSize={0.3}
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
              <h2 className="text-sm font-medium">AI 任务</h2>
            </div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {total} 个
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                disabled={clearCompletedMutation.isPending}
                onClick={() => {
                  if (window.confirm('确认清理所有已完成任务？')) {
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
                清理已完成
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
                刷新
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <SelectField
              aria-label="任务状态过滤"
              onValueChange={(value) => {
                setStatusFilter(value)
                setPage(1)
              }}
              options={statusOptions}
              value={statusFilter}
            />
            <SelectField
              aria-label="任务类型过滤"
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
              重置筛选
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
                第 {page} 页
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
                if (window.confirm(`确认取消任务 ${task.id}？`)) {
                  cancelMutation.mutate(task.id)
                }
              }}
              onDelete={(task) => {
                if (window.confirm(`确认删除任务 ${task.id}？`)) {
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

const groupedPageSize = 20

type GroupedResourceItem = {
  createdAt: string
  id: string
  lang: string
  refId: string
}

type GroupedItemAction = {
  getSuccessMessage?: (result: unknown) => null | string
  label: string
  run: () => Promise<unknown>
}

function SummariesSurface() {
  return (
    <AiGroupedResourceSurface
      createTask={(article) => createSummaryTask({ refId: article.id })}
      createTaskLabel="生成摘要"
      deleteItem={deleteSummary}
      getGroups={(response: GroupedSummaryResponse) =>
        response.data.map((group) => ({
          article: group.article,
          items: group.summaries,
        }))
      }
      getPreview={(item: AISummary) => item.summary}
      itemActions={(item) => [
        {
          label: '编辑',
          run: () => editSummaryItem(item as AISummary),
        },
      ]}
      queryFn={getSummariesGrouped}
      queryKey="summaries"
      title="摘要"
    />
  )
}

function TranslationsSurface() {
  const queryClient = useQueryClient()
  const allMutation = useMutation({
    mutationFn: () => createTranslationAllTask({}),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '全量翻译任务创建失败')),
    onSuccess: async (result) => {
      toast.success(
        result.created ? '已创建全量翻译任务' : '全量翻译任务已存在',
      )
      await queryClient.invalidateQueries({ queryKey: ['ai', 'tasks'] })
    },
  })

  return (
    <AiGroupedResourceSurface
      createTask={(article) => createTranslationTask({ refId: article.id })}
      createTaskLabel="生成翻译"
      deleteItem={deleteTranslation}
      getGroups={(response: GroupedTranslationResponse) =>
        response.data.map((group) => ({
          article: group.article,
          items: group.translations,
        }))
      }
      getPreview={(item: AITranslation) =>
        [item.title, item.subtitle, item.summary, item.text]
          .filter(Boolean)
          .join('\n')
      }
      headerAction={
        <Button
          disabled={allMutation.isPending}
          onClick={() => allMutation.mutate()}
          type="button"
          variant="subtle"
        >
          {allMutation.isPending ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Languages aria-hidden="true" className="size-4" />
          )}
          全量翻译
        </Button>
      }
      itemActions={(item) => [
        {
          label: '编辑',
          run: () => editTranslationItem(item as AITranslation),
        },
        {
          getSuccessMessage: getTaskMutationMessage,
          label: '重翻译',
          run: () =>
            createTranslationTask({
              refId: item.refId,
              targetLanguages: [item.lang],
            }),
        },
      ]}
      queryFn={getTranslationsGrouped}
      queryKey="translations"
      title="翻译"
    />
  )
}

function InsightsSurface() {
  return (
    <AiGroupedResourceSurface
      createTask={(article) => createInsightsTask({ refId: article.id })}
      createTaskLabel="生成精读"
      deleteItem={deleteInsights}
      getGroups={(response: GroupedInsightsResponse) =>
        response.data.map((group) => ({
          article: group.article,
          items: group.insights,
        }))
      }
      getPreview={(item: AIInsights) => item.content}
      itemActions={(item) => {
        const insight = item as AIInsights

        return [
          {
            label: '编辑',
            run: () => editInsightsItem(insight),
          },
          {
            getSuccessMessage: getTaskMutationMessage,
            label: '翻译',
            run: () => {
              const targetLang = window
                .prompt('目标语言（ISO 639-1）', 'en')
                ?.trim()
                .toLowerCase()

              if (!targetLang) return Promise.resolve({ cancelled: true })
              if (targetLang.length !== 2) {
                throw new Error('请填写合法的 ISO 639-1 语言代码')
              }

              return createInsightsTranslationTask({
                refId: insight.refId,
                targetLang,
              })
            },
          },
          {
            getSuccessMessage: getTaskMutationMessage,
            label: insight.isTranslation ? '重翻译' : '重生成',
            run: () =>
              insight.isTranslation
                ? createInsightsTranslationTask({
                    refId: insight.refId,
                    targetLang: insight.lang,
                  })
                : createInsightsTask({ refId: insight.refId }),
          },
        ]
      }}
      queryFn={getInsightsGrouped}
      queryKey="insights"
      title="精读"
    />
  )
}

function AiGroupedResourceSurface<
  TItem extends GroupedResourceItem,
  TResponse,
>(props: {
  createTask?: (
    article: ArticleInfo,
  ) => Promise<{ created: boolean; taskId: string }>
  createTaskLabel?: string
  deleteItem: (id: string) => Promise<unknown>
  getGroups: (
    response: TResponse,
  ) => Array<{ article: ArticleInfo; items: TItem[] }>
  getPreview: (item: TItem) => string
  headerAction?: ReactNode
  itemActions?: (item: TItem) => GroupedItemAction[]
  queryFn: (params: {
    page: number
    search?: string
    size?: number
  }) => Promise<TResponse>
  queryKey: string
  title: string
}) {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(
    () => searchParams.get('id'),
  )
  const [showDetailOnMobile, setShowDetailOnMobile] = useState(() =>
    Boolean(searchParams.get('id')),
  )
  const searchParamsKey = searchParams.toString()
  const selectedArticleParam = searchParams.get('id')

  const params = {
    page,
    search: search.trim() || undefined,
    size: groupedPageSize,
  }

  const query = useQuery({
    placeholderData: (previous) => previous,
    queryFn: () => props.queryFn(params),
    queryKey: ['ai', props.queryKey, params],
  })

  const groups = query.data ? props.getGroups(query.data) : []
  const pagination = (
    query.data as
      | { pagination?: { total?: number; totalPage?: number } }
      | undefined
  )?.pagination
  const total =
    pagination?.total ??
    groups.reduce((sum, group) => sum + group.items.length, 0)
  const pageCount = Math.max(
    1,
    pagination?.totalPage ?? Math.ceil(total / groupedPageSize),
  )
  const selectedGroup =
    groups.find((group) => group.article.id === selectedArticleId) ?? null

  useLayoutEffect(() => {
    setSelectedArticleId((value) =>
      value === selectedArticleParam ? value : selectedArticleParam,
    )
    setShowDetailOnMobile(Boolean(selectedArticleParam))
  }, [searchParamsKey, selectedArticleParam])

  useEffect(() => {
    const next = new URLSearchParams(searchParams)

    if (selectedArticleId) {
      next.set('id', selectedArticleId)
    } else {
      next.delete('id')
    }

    if (next.toString() !== searchParamsKey) {
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, searchParamsKey, selectedArticleId, setSearchParams])

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['ai', props.queryKey] })
    await queryClient.invalidateQueries({ queryKey: ['ai', 'tasks'] })
  }

  const deleteMutation = useMutation({
    mutationFn: props.deleteItem,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '删除失败')),
    onSuccess: async () => {
      toast.success('已删除')
      await invalidate()
    },
  })

  const createMutation = useMutation({
    mutationFn: (article: ArticleInfo) => {
      if (!props.createTask) {
        return Promise.resolve({ created: false, taskId: '' })
      }

      return props.createTask(article)
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '任务创建失败')),
    onSuccess: async (result) => {
      if (!result) return
      toast.success(result.created ? '已创建任务' : '任务已存在')
      await invalidate()
    },
  })

  const itemMutation = useMutation({
    mutationFn: async (action: GroupedItemAction) => ({
      action,
      result: await action.run(),
    }),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '任务创建失败')),
    onSuccess: async ({ action, result }) => {
      const message =
        action.getSuccessMessage?.(result) ??
        getGroupedActionSuccessMessage(result)

      if (message) toast.success(message)
      await invalidate()
    },
  })

  const selectGroup = (articleId: string) => {
    setSelectedArticleId(articleId)
    setShowDetailOnMobile(true)
  }

  return (
    <MasterDetailLayout
      defaultSize={0.36}
      maxSize={0.48}
      minSize={0.28}
      showDetailOnMobile={showDetailOnMobile}
      list={
        <section className="flex h-full min-h-0 flex-col bg-white dark:bg-neutral-950">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <div>
              <h2 className="text-sm font-medium text-neutral-950 dark:text-neutral-50">
                {props.title}
              </h2>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                共 {total} 条记录
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative block">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
                />
                <TextInput
                  controlClassName="h-9 w-64 pl-9 focus:border-neutral-400"
                  onChange={(value) => {
                    setSearch(value)
                    setPage(1)
                  }}
                  placeholder="搜索标题"
                  value={search}
                />
              </label>
              {props.headerAction}
              <Button
                disabled={query.isFetching}
                onClick={() => void query.refetch()}
                type="button"
                variant="subtle"
              >
                <RefreshCw
                  aria-hidden="true"
                  className={cn('size-4', query.isFetching && 'animate-spin')}
                />
                刷新
              </Button>
            </div>
          </div>

          <Scroll className="flex-1">
            {query.isLoading && groups.length === 0 ? (
              <GroupedResourceSkeleton />
            ) : query.isError ? (
              <ResourceError onRetry={() => void query.refetch()} />
            ) : groups.length === 0 ? (
              <ResourceEmpty label={props.title} />
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
                {groups.map((group) => (
                  <article
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 transition-colors',
                      selectedArticleId === group.article.id
                        ? 'bg-neutral-100 dark:bg-neutral-900'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/70',
                    )}
                    key={`${group.article.type}-${group.article.id}`}
                  >
                    <button
                      className="min-w-0 flex-1 text-left"
                      onClick={() => selectGroup(group.article.id)}
                      type="button"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <SmallBadge>{group.article.type}</SmallBadge>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {group.items.length} 条
                        </span>
                      </div>
                      <h3 className="mt-2 truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
                        {group.article.title || group.article.id}
                      </h3>
                      <Code>{group.article.id}</Code>
                    </button>
                    {props.createTask ? (
                      <Button
                        className="shrink-0"
                        disabled={createMutation.isPending}
                        onClick={() => createMutation.mutate(group.article)}
                        type="button"
                        variant="subtle"
                      >
                        {createMutation.isPending ? (
                          <Loader2
                            aria-hidden="true"
                            className="size-4 animate-spin"
                          />
                        ) : (
                          <Sparkles aria-hidden="true" className="size-4" />
                        )}
                        {props.createTaskLabel ?? '创建任务'}
                      </Button>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </Scroll>

          {pageCount > 1 ? (
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <span className="text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
                第 {page} 页
              </span>
              <CompactPagination
                onPageChange={setPage}
                onPageSizeChange={() => undefined}
                page={page}
                pageCount={pageCount}
                pageSize={groupedPageSize}
                pageSizes={[groupedPageSize]}
              />
            </div>
          ) : null}
        </section>
      }
      detail={
        <section className="h-full min-h-0 bg-white dark:bg-neutral-950">
          {selectedGroup ? (
            <div className="flex h-full min-h-0 flex-col">
              <div
                className={cn(
                  'flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800',
                  APP_SHELL_HEADER_HEIGHT_CLASS,
                )}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <button
                    className="inline-flex size-8 items-center justify-center rounded text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 lg:hidden dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-50"
                    onClick={() => setShowDetailOnMobile(false)}
                    type="button"
                  >
                    <ArrowLeft aria-hidden="true" className="size-4" />
                  </button>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <SmallBadge>{selectedGroup.article.type}</SmallBadge>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {selectedGroup.items.length} 条
                      </span>
                    </div>
                    <h2 className="mt-1 truncate text-sm font-semibold text-neutral-950 dark:text-neutral-50">
                      {selectedGroup.article.title || selectedGroup.article.id}
                    </h2>
                  </div>
                </div>
                {props.createTask ? (
                  <Button
                    disabled={createMutation.isPending}
                    onClick={() => createMutation.mutate(selectedGroup.article)}
                    type="button"
                    variant="subtle"
                  >
                    {createMutation.isPending ? (
                      <Loader2
                        aria-hidden="true"
                        className="size-4 animate-spin"
                      />
                    ) : (
                      <Sparkles aria-hidden="true" className="size-4" />
                    )}
                    {props.createTaskLabel ?? '创建任务'}
                  </Button>
                ) : null}
              </div>

              <Scroll className="flex-1" innerClassName="px-4 py-4">
                <div className="space-y-3">
                  {selectedGroup.items.map((item) => {
                    const itemActions = props.itemActions?.(item) ?? []

                    return (
                      <div
                        className="rounded border border-neutral-200 p-3 dark:border-neutral-800"
                        key={item.id}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <SmallBadge tone="info">{item.lang}</SmallBadge>
                            <span className="text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
                              {formatDateString(item.createdAt)}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {itemActions.map((action) => (
                              <Button
                                disabled={itemMutation.isPending}
                                key={action.label}
                                onClick={() => itemMutation.mutate(action)}
                                type="button"
                                variant="subtle"
                              >
                                {action.label}
                              </Button>
                            ))}
                            <Button
                              className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-950 dark:text-red-400 dark:hover:bg-red-950/30"
                              disabled={deleteMutation.isPending}
                              onClick={() => {
                                if (window.confirm('确认删除该记录？')) {
                                  deleteMutation.mutate(item.id)
                                }
                              }}
                              type="button"
                              variant="subtle"
                            >
                              <Trash2 aria-hidden="true" className="size-4" />
                              删除
                            </Button>
                          </div>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-neutral-700 dark:text-neutral-300">
                          {props.getPreview(item) || '-'}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </Scroll>
            </div>
          ) : (
            <ResourceEmpty label={`选择${props.title}记录`} />
          )}
        </section>
      }
    />
  )
}

const translationEntryKeyPathOptions: TranslationEntryKeyPath[] = [
  'category.name',
  'topic.name',
  'topic.introduce',
  'note.mood',
  'note.weather',
]

function TranslationEntriesSurface() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [keyPath, setKeyPath] = useState<TranslationEntryKeyPath | ''>('')
  const [lang, setLang] = useState('')
  const params = {
    keyPath: keyPath || undefined,
    lang: lang.trim() || undefined,
    page,
    size: 50,
  }

  const query = useQuery({
    placeholderData: (previous) => previous,
    queryFn: () => getTranslationEntries(params),
    queryKey: ['ai', 'translation-entries', params],
  })

  const entries = query.data?.data ?? []
  const total = query.data?.pagination.total ?? entries.length
  const pageCount = Math.max(1, Math.ceil(total / params.size))

  const invalidateEntries = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['ai', 'translation-entries'],
    })
  }

  const generateMutation = useMutation({
    mutationFn: () => generateTranslationEntries(),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '词表生成失败')),
    onSuccess: async (result) => {
      toast.success(`已创建 ${result.created} 条，跳过 ${result.skipped} 条`)
      await invalidateEntries()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (entry: TranslationEntry) => {
      const translatedText = window.prompt('译文', entry.translatedText)
      if (translatedText === null) return Promise.resolve(entry)

      return updateTranslationEntry(entry.id, { translatedText })
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '词条保存失败')),
    onSuccess: async () => {
      toast.success('词条已保存')
      await invalidateEntries()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTranslationEntry,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '词条删除失败')),
    onSuccess: async () => {
      toast.success('词条已删除')
      await invalidateEntries()
    },
  })

  return (
    <section className="bg-white dark:bg-neutral-950">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <div>
          <h2 className="text-sm font-medium">翻译词表</h2>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            共 {total} 条词条
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SelectField
            aria-label="翻译词表路径"
            className="w-40"
            onValueChange={(value) => {
              setKeyPath(value)
              setPage(1)
            }}
            options={[
              { label: '全部路径', value: '' },
              ...translationEntryKeyPathOptions.map((option) => ({
                label: option,
                value: option,
              })),
            ]}
            value={keyPath}
          />
          <TextInput
            controlClassName="h-9 w-28 focus:border-neutral-400"
            onChange={(value) => {
              setLang(value)
              setPage(1)
            }}
            placeholder="语言"
            value={lang}
          />
          <Button
            disabled={generateMutation.isPending}
            onClick={() => generateMutation.mutate()}
            type="button"
            variant="subtle"
          >
            {generateMutation.isPending ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Sparkles aria-hidden="true" className="size-4" />
            )}
            生成词表
          </Button>
          <Button
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
            type="button"
            variant="subtle"
          >
            <RefreshCw
              aria-hidden="true"
              className={cn('size-4', query.isFetching && 'animate-spin')}
            />
            刷新
          </Button>
        </div>
      </div>

      {query.isLoading && entries.length === 0 ? (
        <GroupedResourceSkeleton />
      ) : query.isError ? (
        <ResourceError onRetry={() => void query.refetch()} />
      ) : entries.length === 0 ? (
        <ResourceEmpty label="词表" />
      ) : (
        <Scroll orientation="horizontal">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="border-b border-neutral-200 text-left text-xs uppercase text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-3 font-medium">路径</th>
                <th className="px-4 py-3 font-medium">语言</th>
                <th className="px-4 py-3 font-medium">源文本</th>
                <th className="px-4 py-3 font-medium">译文</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-3 align-top">
                    <Code>{entry.keyPath}</Code>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <SmallBadge tone="info">{entry.lang}</SmallBadge>
                  </td>
                  <td className="max-w-xs px-4 py-3 align-top text-neutral-700 dark:text-neutral-300">
                    {entry.sourceText}
                  </td>
                  <td className="max-w-md px-4 py-3 align-top text-neutral-700 dark:text-neutral-300">
                    {entry.translatedText || '-'}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex justify-end gap-2">
                      <Button
                        disabled={updateMutation.isPending}
                        onClick={() => updateMutation.mutate(entry)}
                        type="button"
                        variant="subtle"
                      >
                        编辑
                      </Button>
                      <Button
                        className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-950 dark:text-red-400 dark:hover:bg-red-950/30"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (window.confirm('确认删除该词条？')) {
                            deleteMutation.mutate(entry.id)
                          }
                        }}
                        type="button"
                        variant="subtle"
                      >
                        删除
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Scroll>
      )}

      {pageCount > 1 ? (
        <div className="flex items-center justify-between gap-3 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <span className="text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
            第 {page} 页
          </span>
          <CompactPagination
            onPageChange={setPage}
            onPageSizeChange={() => undefined}
            page={page}
            pageCount={pageCount}
            pageSize={params.size}
            pageSizes={[params.size]}
          />
        </div>
      ) : null}
    </section>
  )
}

function SlugBackfillSurface() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryFn: getSlugBackfillStatus,
    queryKey: ['ai', 'slug-backfill'],
  })

  const mutation = useMutation({
    mutationFn: createSlugBackfillTask,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, 'Slug 回填任务创建失败')),
    onSuccess: async (result) => {
      toast.success(result.created ? '已创建 Slug 回填任务' : '任务已存在')
      await queryClient.invalidateQueries({ queryKey: ['ai', 'slug-backfill'] })
      await queryClient.invalidateQueries({ queryKey: ['ai', 'tasks'] })
    },
  })

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
      <section className="bg-white dark:bg-neutral-950">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <div>
            <h2 className="text-sm font-medium">Slug 回填</h2>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              {query.data ? `${query.data.count} 篇笔记缺失 slug` : '加载状态'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
              type="button"
              variant="subtle"
            >
              <RefreshCw
                aria-hidden="true"
                className={cn('size-4', query.isFetching && 'animate-spin')}
              />
              刷新
            </Button>
            <Button
              disabled={mutation.isPending || !query.data?.count}
              onClick={() => mutation.mutate()}
              type="button"
            >
              {mutation.isPending ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <WandSparkles aria-hidden="true" className="size-4" />
              )}
              创建回填任务
            </Button>
          </div>
        </div>
        {query.isLoading ? (
          <GroupedResourceSkeleton />
        ) : query.isError ? (
          <ResourceError onRetry={() => void query.refetch()} />
        ) : query.data?.notes.length ? (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
            {query.data.notes.map((note) => (
              <div
                className="grid gap-2 px-4 py-3 sm:grid-cols-[6rem_minmax(0,1fr)]"
                key={note.id}
              >
                <Code>{note.nid}</Code>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
                    {note.title || note.id}
                  </p>
                  <p className="mt-1 truncate text-xs text-neutral-500 dark:text-neutral-400">
                    {note.id}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ResourceEmpty label="缺失 slug 的笔记" />
        )}
      </section>

      <WriterGeneratePanel />
    </div>
  )
}

function WriterGeneratePanel() {
  const [type, setType] = useState<AiQueryType>(AiQueryType.TitleSlug)
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      writerGenerate({
        text: type === AiQueryType.TitleSlug ? text : undefined,
        title: type === AiQueryType.Slug ? title : undefined,
        type,
      }),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '生成失败')),
  })

  return (
    <section className="bg-white p-4 dark:bg-neutral-950">
      <h2 className="text-sm font-medium">标题与 Slug 生成</h2>
      <div className="mt-3 grid gap-3">
        <SelectField
          aria-label="标题与 Slug 生成类型"
          onValueChange={setType}
          options={[
            {
              label: '文本生成标题与 slug',
              value: AiQueryType.TitleSlug,
            },
            { label: '标题生成 slug', value: AiQueryType.Slug },
          ]}
          value={type}
        />
        {type === AiQueryType.TitleSlug ? (
          <TextArea
            controlClassName="min-h-32 focus:border-neutral-400"
            onChange={setText}
            placeholder="文章内容"
            value={text}
          />
        ) : (
          <TextInput
            controlClassName="h-9 focus:border-neutral-400"
            onChange={setTitle}
            placeholder="标题"
            value={title}
          />
        )}
        <Button
          disabled={
            mutation.isPending ||
            (type === AiQueryType.TitleSlug ? !text.trim() : !title.trim())
          }
          onClick={() => mutation.mutate()}
          type="button"
        >
          {mutation.isPending ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <WandSparkles aria-hidden="true" className="size-4" />
          )}
          生成
        </Button>
        {mutation.data ? (
          <div className="rounded border border-neutral-200 bg-neutral-50 p-3 text-sm dark:border-neutral-800 dark:bg-neutral-900">
            <Field label="标题">{mutation.data.title ?? '-'}</Field>
            <div className="mt-3">
              <Field label="Slug">{mutation.data.slug ?? '-'}</Field>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

function GroupedResourceSkeleton() {
  return (
    <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          className="grid gap-4 px-4 py-4 lg:grid-cols-[18rem_minmax(0,1fr)]"
          key={index}
        >
          <div>
            <div className="h-4 w-24 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
            <div className="mt-3 h-4 w-48 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
          </div>
          <div className="h-20 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
        </div>
      ))}
    </div>
  )
}

function ResourceError(props: { onRetry: () => void }) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
        数据加载失败
      </p>
      <Button className="mt-3" onClick={props.onRetry} type="button">
        重试
      </Button>
    </div>
  )
}

function ResourceEmpty(props: { label: string }) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center px-4 text-center">
      <ListTodo aria-hidden="true" className="size-8 text-neutral-300" />
      <p className="mt-3 text-sm font-medium text-neutral-700 dark:text-neutral-200">
        暂无{props.label}
      </p>
    </div>
  )
}

function TaskRow(props: {
  onSelect: () => void
  selected: boolean
  task: AITask
}) {
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
            {taskTypeLabels[props.task.type]}
          </span>
          {isBatchTask(props.task) ? (
            <Layers aria-hidden="true" className="size-3 text-blue-500" />
          ) : null}
        </div>
        <p className="mt-1 truncate text-xs text-neutral-500 dark:text-neutral-400">
          {getTaskSummary(props.task)}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <StatusBadge status={effectiveStatus}>
          {progressLabel ?? taskStatusLabels[effectiveStatus]}
        </StatusBadge>
        <div className="mt-1 text-xs tabular-nums text-neutral-400">
          {formatRelativeTimestamp(props.task.createdAt)}
        </div>
      </div>
    </button>
  )
}

function TaskDetail(props: {
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

function SubTaskStatsView(props: { task: AITask }) {
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

function StatusBadge(props: { children: ReactNode; status: AITaskStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded border px-2 py-1 text-xs font-medium',
        statusClassName[props.status],
      )}
    >
      {props.children}
    </span>
  )
}

function SmallBadge(props: {
  children: ReactNode
  tone?: 'danger' | 'default' | 'info' | 'success' | 'warning'
}) {
  const tone = props.tone ?? 'default'
  const className = {
    danger:
      'border-red-200 bg-red-50 text-red-700 dark:border-red-950 dark:bg-red-950/40 dark:text-red-300',
    default:
      'border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300',
    info: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300',
    success:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300',
    warning:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300',
  }[tone]

  return (
    <span className={cn('inline-flex rounded border px-2 py-1', className)}>
      {props.children}
    </span>
  )
}

function Field(props: { children: ReactNode; label: string }) {
  return (
    <div className="min-w-0 space-y-1">
      <div className="text-xs text-neutral-500 dark:text-neutral-400">
        {props.label}
      </div>
      <div className="min-w-0 text-neutral-950 dark:text-neutral-50">
        {props.children}
      </div>
    </div>
  )
}

function Code(props: { children: ReactNode }) {
  return (
    <code className="block truncate rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
      {props.children}
    </code>
  )
}

function DetailBlock(props: { children: ReactNode; title: string }) {
  return (
    <section className="mt-6">
      <h3 className="mb-2 text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">
        {props.title}
      </h3>
      {props.children}
    </section>
  )
}

function JsonBlock(props: { value: unknown }) {
  return (
    <Scroll
      className="rounded border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900"
      orientation="both"
      viewportClassName="max-h-72"
    >
      <pre className="p-3 text-xs leading-5 text-neutral-800 dark:text-neutral-200">
        {JSON.stringify(props.value, null, 2)}
      </pre>
    </Scroll>
  )
}

function TaskLogRow(props: { log: AITaskLog }) {
  return (
    <div className="grid gap-1 px-3 py-2 text-xs sm:grid-cols-[9rem_4rem_minmax(0,1fr)]">
      <time className="tabular-nums text-neutral-400">
        {formatAbsoluteTimestamp(props.log.timestamp)}
      </time>
      <span
        className={cn(
          'font-medium uppercase',
          props.log.level === 'error' && 'text-red-600 dark:text-red-400',
          props.log.level === 'warn' && 'text-amber-600 dark:text-amber-400',
          props.log.level === 'info' &&
            'text-neutral-500 dark:text-neutral-400',
        )}
      >
        {props.log.level}
      </span>
      <span className="min-w-0 break-words text-neutral-700 dark:text-neutral-300">
        {props.log.message}
      </span>
    </div>
  )
}

function TasksSkeleton() {
  return (
    <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
      {Array.from({ length: 8 }).map((_, index) => (
        <div className="px-4 py-3" key={index}>
          <div className="h-4 w-2/5 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
          <div className="mt-3 h-3 w-3/5 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
        </div>
      ))}
    </div>
  )
}

function TasksError(props: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
        AI 任务加载失败
      </p>
      <Button className="mt-3" onClick={props.onRetry} type="button">
        重试
      </Button>
    </div>
  )
}

function TasksEmpty() {
  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center px-4 text-center">
      <ListTodo aria-hidden="true" className="size-8 text-neutral-300" />
      <p className="mt-3 text-sm font-medium text-neutral-700 dark:text-neutral-200">
        暂无 AI 任务
      </p>
      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
        摘要、翻译、精读等后台任务会显示在这里。
      </p>
    </div>
  )
}

function TaskDetailEmpty() {
  return (
    <div className="flex h-full min-h-[24rem] flex-col items-center justify-center px-4 text-center">
      <ListTodo aria-hidden="true" className="size-8 text-neutral-300" />
      <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
        选择一个任务查看详情。
      </p>
    </div>
  )
}

function getEffectiveStatus(task: AITask) {
  if (
    isBatchTask(task) &&
    task.status === AITaskStatus.Completed &&
    task.subTaskStats &&
    (task.subTaskStats.pending > 0 || task.subTaskStats.running > 0)
  ) {
    return AITaskStatus.Running
  }

  return task.status
}

function isBatchTask(task: AITask) {
  return (
    task.type === AITaskType.TranslationBatch ||
    task.type === AITaskType.TranslationAll
  )
}

function getTaskSummary(task: AITask) {
  const payload = task.payload
  const result = task.result as Record<string, unknown> | undefined
  if (task.type === AITaskType.Summary) {
    return (payload.title as string) || (payload.refId as string) || '摘要任务'
  }
  if (task.type === AITaskType.Translation) {
    return (payload.title as string) || (payload.refId as string) || '翻译任务'
  }
  if (task.type === AITaskType.TranslationBatch) {
    const count = (payload.refIds as string[] | undefined)?.length ?? 0
    return `${count} 篇文章`
  }
  if (task.type === AITaskType.TranslationAll) {
    const count = result?.total as number | undefined
    return count ? `${count} 篇文章` : '全部文章'
  }
  if (task.type === AITaskType.SlugBackfill) return '补全缺失 Slug'
  if (task.type === AITaskType.Insights) return '精读内容生成'
  if (task.type === AITaskType.InsightsTranslation) return '精读内容翻译'

  return '任务'
}

function getTaskDetailSummary(task: AITask) {
  const payload = task.payload
  const result = task.result as Record<string, unknown> | undefined
  if (task.type === AITaskType.Translation) {
    const title = (payload.title as string) || (payload.refId as string)
    const langs = (payload.targetLanguages as string[] | undefined)?.join(', ')
    return `${title || '翻译任务'} -> ${langs || '默认语言'}`
  }
  if (task.type === AITaskType.TranslationBatch) {
    const count = (payload.refIds as string[] | undefined)?.length ?? 0
    const langs = (payload.targetLanguages as string[] | undefined)?.join(', ')
    return `${count} 篇文章 -> ${langs || '默认语言'}`
  }
  if (task.type === AITaskType.TranslationAll) {
    const count = result?.total as number | undefined
    const langs = (payload.targetLanguages as string[] | undefined)?.join(', ')
    return `${count ? `全部 ${count} 篇文章` : '全部文章'} -> ${langs || '默认语言'}`
  }

  return getTaskSummary(task)
}

function getTaskProgressLabel(task: AITask) {
  if (task.subTaskStats) {
    const stats = task.subTaskStats
    return `${stats.completed + stats.failed}/${stats.total}`
  }

  if (
    typeof task.completedItems === 'number' &&
    typeof task.totalItems === 'number' &&
    task.totalItems > 0
  ) {
    return `${task.completedItems}/${task.totalItems}`
  }

  return null
}

function getProgress(task: AITask) {
  if (typeof task.progress === 'number') return task.progress
  if (
    typeof task.completedItems === 'number' &&
    typeof task.totalItems === 'number' &&
    task.totalItems > 0
  ) {
    return (task.completedItems / task.totalItems) * 100
  }
  if (task.subTaskStats && task.subTaskStats.total > 0) {
    const completed = task.subTaskStats.completed + task.subTaskStats.failed
    return (completed / task.subTaskStats.total) * 100
  }

  return null
}

function statusIconClassName(status: AITaskStatus) {
  return {
    [AITaskStatus.Pending]: 'text-neutral-400',
    [AITaskStatus.Running]: 'text-blue-500',
    [AITaskStatus.Completed]: 'text-emerald-500',
    [AITaskStatus.PartialFailed]: 'text-amber-500',
    [AITaskStatus.Failed]: 'text-red-500',
    [AITaskStatus.Cancelled]: 'text-neutral-400',
  }[status]
}

function formatRelativeTimestamp(timestamp?: number) {
  if (!timestamp) return '-'
  return relativeTimeFromNow(new Date(timestamp))
}

function formatAbsoluteTimestamp(timestamp?: number) {
  if (!timestamp) return '-'
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(timestamp))
}

function editSummaryItem(item: AISummary) {
  const summary = window.prompt('摘要内容', item.summary)
  if (summary === null) return Promise.resolve({ cancelled: true })
  if (!summary.trim()) throw new Error('摘要内容不能为空')

  return updateSummary(item.id, { summary })
}

function editTranslationItem(item: AITranslation) {
  const title = window.prompt('标题', item.title)
  if (title === null) return Promise.resolve({ cancelled: true })
  if (!title.trim()) throw new Error('标题不能为空')

  const subtitle = window.prompt('副标题（可留空）', item.subtitle ?? '')
  if (subtitle === null) return Promise.resolve({ cancelled: true })

  const summary = window.prompt('摘要（可留空）', item.summary ?? '')
  if (summary === null) return Promise.resolve({ cancelled: true })

  if (item.contentFormat === 'lexical') {
    const content = window.prompt('Lexical JSON 内容', item.content ?? '')
    if (content === null) return Promise.resolve({ cancelled: true })

    return updateTranslation(item.id, {
      content: content.trim() || undefined,
      subtitle: subtitle.trim() || undefined,
      summary: summary.trim() || undefined,
      title,
    })
  }

  const text = window.prompt('正文内容', item.text)
  if (text === null) return Promise.resolve({ cancelled: true })
  if (!text.trim()) throw new Error('正文内容不能为空')

  return updateTranslation(item.id, {
    subtitle: subtitle.trim() || undefined,
    summary: summary.trim() || undefined,
    text,
    title,
  })
}

function editInsightsItem(item: AIInsights) {
  const content = window.prompt('精读内容', item.content)
  if (content === null) return Promise.resolve({ cancelled: true })
  if (!content.trim()) throw new Error('精读内容不能为空')

  return updateInsights(item.id, { content })
}

function getGroupedActionSuccessMessage(result: unknown) {
  if (isCancelledActionResult(result)) return null
  return getTaskMutationMessage(result) ?? '已保存'
}

function getTaskMutationMessage(result: unknown) {
  if (isCancelledActionResult(result)) return null
  if (
    result &&
    typeof result === 'object' &&
    'taskId' in result &&
    'created' in result
  ) {
    return (result as { created?: boolean }).created
      ? '已创建任务'
      : '任务已存在'
  }

  return null
}

function isCancelledActionResult(result: unknown): result is {
  cancelled: true
} {
  return (
    !!result &&
    typeof result === 'object' &&
    'cancelled' in result &&
    (result as { cancelled?: unknown }).cancelled === true
  )
}

function formatDateString(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function readPositivePage(value: null | string) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

function readTaskStatusFilter(value: null | string): AITaskStatus | '' {
  return statusOptions.some((option) => option.value === value)
    ? (value as AITaskStatus | '')
    : ''
}

function readTaskTypeFilter(value: null | string): AITaskType | '' {
  return typeOptions.some((option) => option.value === value)
    ? (value as AITaskType | '')
    : ''
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}
