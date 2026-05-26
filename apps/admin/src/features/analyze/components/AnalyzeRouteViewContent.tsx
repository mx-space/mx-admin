import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BookOpen,
  Calendar,
  ChartLine,
  Eye,
  Globe2,
  Heart,
  Loader2,
  MonitorSmartphone,
  Newspaper,
  RefreshCw,
  Route,
  Trash2,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { AnalyzePeriod, RankRange } from '../types/analyze'

import {
  ActivityType,
  getActivityList,
  getReadingRank,
  getTopReadings,
} from '~/api/activity'
import {
  deleteAllAnalyzeRecords,
  getAnalyzeAggregate,
  getAnalyzeList,
  getDeviceDistribution,
  getTrafficSource,
} from '~/api/analyze'
import { Button } from '~/ui/button'
import { cn } from '~/ui/cn'
import { CompactPagination } from '~/ui/compact-pagination'
import { MetricCard } from '~/ui/metric-card'
import { AppPage, PageHeader } from '~/ui/page-layout'
import { Panel } from '~/ui/panel'
import { Scroll } from '~/ui/scroll'

import { activityPageSize, analyzeQueryKey, pageSize } from '../constants'
import {
  buildRefObjectMap,
  buildTrendData,
  formatAverageDepth,
  formatDateTime,
  formatNumber,
  getErrorMessage,
  getRankRange,
  hasDeviceDistribution,
} from '../utils/analyze'
import { ActivityList } from './ActivityList'
import { AnalyzeSkeleton, EmptyBlock, ErrorBlock } from './AnalyzePrimitives'
import { AnalyzeRecordRow } from './AnalyzeRecordRow'
import { DeviceDistributionChart } from './DeviceDistributionChart'
import { IpInfoButton } from './IpInfoButton'
import { ReadingRankList } from './ReadingRankList'
import { TopReadingsChart } from './TopReadingsChart'
import { TrafficSourceChart } from './TrafficSourceChart'
import { TrendChart } from './TrendChart'

export function AnalyzeRouteViewContent() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [period, setPeriod] = useState<AnalyzePeriod>('week')
  const [activityType, setActivityType] = useState<ActivityType>(
    ActivityType.Like,
  )
  const [activityPage, setActivityPage] = useState(1)
  const [rankRange, setRankRange] = useState<RankRange>('week')

  const aggregateQuery = useQuery({
    queryFn: getAnalyzeAggregate,
    queryKey: [...analyzeQueryKey, 'aggregate'],
  })

  const recordsQuery = useQuery({
    placeholderData: (previous) => previous,
    queryFn: () => getAnalyzeList({ page, size: pageSize }),
    queryKey: [...analyzeQueryKey, 'records', { page, size: pageSize }],
  })
  const activityQuery = useQuery({
    placeholderData: (previous) => previous,
    queryFn: () =>
      getActivityList({
        page: activityPage,
        size: activityPageSize,
        type: activityType,
      }),
    queryKey: [
      ...analyzeQueryKey,
      'activity',
      { activityPage, activityPageSize, activityType },
    ],
  })
  const rankRangeValue = useMemo(() => getRankRange(rankRange), [rankRange])
  const readingRankQuery = useQuery({
    queryFn: () =>
      getReadingRank({
        end: rankRangeValue.end,
        limit: 10,
        start: rankRangeValue.start,
      }),
    queryKey: [...analyzeQueryKey, 'reading-rank', rankRangeValue],
  })
  const topReadingsQuery = useQuery({
    queryFn: () => getTopReadings({ days: 14, top: 5 }),
    queryKey: [...analyzeQueryKey, 'top-readings', { days: 14, top: 5 }],
  })
  const trafficSourceQuery = useQuery({
    queryFn: () => getTrafficSource(),
    queryKey: [...analyzeQueryKey, 'traffic-source'],
  })
  const deviceDistributionQuery = useQuery({
    queryFn: () => getDeviceDistribution(),
    queryKey: [...analyzeQueryKey, 'device-distribution'],
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAllAnalyzeRecords,
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, '清空失败'))
    },
    onSuccess: async () => {
      toast.success('访问记录已清空')
      await queryClient.invalidateQueries({ queryKey: analyzeQueryKey })
    },
  })

  const aggregate = aggregateQuery.data
  const trendData = useMemo(
    () => buildTrendData(aggregate, period),
    [aggregate, period],
  )
  const records = recordsQuery.data?.data ?? []
  const pagination = recordsQuery.data?.pagination
  const activities = activityQuery.data?.data ?? []
  const activityPagination = activityQuery.data?.pagination
  const refObjects = useMemo(
    () => buildRefObjectMap(activityQuery.data?.objects),
    [activityQuery.data?.objects],
  )
  const totalPages = pagination
    ? 'totalPages' in pagination
      ? pagination.totalPages
      : ((pagination as { totalPage?: number }).totalPage ?? 1)
    : 1

  const isAnyFetching =
    aggregateQuery.isFetching ||
    recordsQuery.isFetching ||
    trafficSourceQuery.isFetching ||
    deviceDistributionQuery.isFetching ||
    topReadingsQuery.isFetching

  return (
    <AppPage>
      <PageHeader
        actions={
          <>
            <Button
              disabled={isAnyFetching}
              onClick={() => {
                void aggregateQuery.refetch()
                void recordsQuery.refetch()
                void activityQuery.refetch()
                void readingRankQuery.refetch()
                void topReadingsQuery.refetch()
                void trafficSourceQuery.refetch()
                void deviceDistributionQuery.refetch()
              }}
              type="button"
              variant="subtle"
            >
              <RefreshCw
                aria-hidden="true"
                className={cn('size-4', isAnyFetching && 'animate-spin')}
              />
              刷新
            </Button>
            <Button
              className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-950 dark:text-red-400 dark:hover:bg-red-950/30"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (window.confirm('确认清空全部访问分析记录？')) {
                  deleteMutation.mutate()
                }
              }}
              type="button"
              variant="subtle"
            >
              {deleteMutation.isPending ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <Trash2 aria-hidden="true" className="size-4" />
              )}
              清空
            </Button>
          </>
        }
        description="访问量、独立访客、路径分布和访问记录。"
        title="数据分析"
      />

      <Scroll className="min-h-0 flex-1" innerClassName="space-y-4 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={Eye}
            label="总访问量 PV"
            value={formatNumber(aggregate?.total.callTime)}
          />
          <MetricCard
            icon={Users}
            label="独立访客 UV"
            value={formatNumber(aggregate?.total.uv)}
          />
          <MetricCard
            icon={Globe2}
            label="今日访问 IP"
            value={formatNumber(aggregate?.todayIps.length)}
          />
          <MetricCard
            icon={Route}
            label="平均访问深度"
            value={formatAverageDepth(
              aggregate?.total.callTime,
              aggregate?.total.uv,
            )}
          />
        </div>

        <Panel
          description="按日、周、月切换 PV / IP 趋势。"
          title={
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2">
                <ChartLine aria-hidden="true" className="size-4" />
                访问趋势
              </span>
              <div className="flex rounded border border-neutral-200 bg-white p-0.5 dark:border-neutral-800 dark:bg-neutral-950">
                {(
                  [
                    ['day', '今日'],
                    ['week', '本周'],
                    ['month', '本月'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    className={cn(
                      'h-8 rounded px-3 text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-neutral-50',
                      period === value &&
                        'bg-neutral-950 text-white hover:text-white dark:bg-neutral-50 dark:text-neutral-950 dark:hover:text-neutral-950',
                    )}
                    key={value}
                    onClick={() => setPeriod(value)}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          }
        >
          {aggregateQuery.isLoading ? (
            <AnalyzeSkeleton />
          ) : trendData.length ? (
            <TrendChart data={trendData} />
          ) : (
            <EmptyBlock label="暂无趋势数据" />
          )}
        </Panel>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Panel
            description="按阅读量统计最近 14 天的内容排行。"
            title={
              <span className="inline-flex items-center gap-2">
                <Newspaper aria-hidden="true" className="size-4" />
                热门文章
              </span>
            }
          >
            {topReadingsQuery.isLoading ? (
              <AnalyzeSkeleton />
            ) : topReadingsQuery.isError ? (
              <ErrorBlock
                label="热门文章加载失败"
                onRetry={() => void topReadingsQuery.refetch()}
              />
            ) : topReadingsQuery.data?.length ? (
              <TopReadingsChart items={topReadingsQuery.data} />
            ) : (
              <EmptyBlock label="暂无阅读排行数据" />
            )}
          </Panel>

          <Panel
            description="按来源类型与来源地址统计最近访问。"
            title={
              <span className="inline-flex items-center gap-2">
                <Route aria-hidden="true" className="size-4" />
                流量来源
              </span>
            }
          >
            {trafficSourceQuery.isLoading ? (
              <AnalyzeSkeleton />
            ) : trafficSourceQuery.isError ? (
              <ErrorBlock
                label="流量来源加载失败"
                onRetry={() => void trafficSourceQuery.refetch()}
              />
            ) : trafficSourceQuery.data?.categories.length ? (
              <TrafficSourceChart data={trafficSourceQuery.data} />
            ) : (
              <EmptyBlock label="暂无流量来源数据" />
            )}
          </Panel>

          <Panel
            description="按设备、浏览器和系统聚合访客客户端。"
            title={
              <span className="inline-flex items-center gap-2">
                <MonitorSmartphone aria-hidden="true" className="size-4" />
                设备分布
              </span>
            }
          >
            {deviceDistributionQuery.isLoading ? (
              <AnalyzeSkeleton />
            ) : deviceDistributionQuery.isError ? (
              <ErrorBlock
                label="设备分布加载失败"
                onRetry={() => void deviceDistributionQuery.refetch()}
              />
            ) : hasDeviceDistribution(deviceDistributionQuery.data) ? (
              <DeviceDistributionChart data={deviceDistributionQuery.data} />
            ) : (
              <EmptyBlock label="暂无设备分布数据" />
            )}
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.55fr)_minmax(0,0.45fr)]">
          <Panel
            description="按后端聚合结果展示访问路径。"
            title={
              <span className="inline-flex items-center gap-2">
                <ChartLine aria-hidden="true" className="size-4" />
                热门路径
              </span>
            }
          >
            {aggregateQuery.isLoading ? (
              <AnalyzeSkeleton />
            ) : aggregate?.paths.length ? (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
                {aggregate.paths.slice(0, 10).map((path) => (
                  <div
                    className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-4 py-3"
                    key={path.path}
                  >
                    <span className="truncate text-sm text-neutral-800 dark:text-neutral-100">
                      {path.path}
                    </span>
                    <span className="text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
                      {path.count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyBlock label="暂无路径聚合数据" />
            )}
          </Panel>

          <Panel description="当日访问 IP 列表。" title="今日 IP">
            {aggregateQuery.isLoading ? (
              <AnalyzeSkeleton />
            ) : aggregate?.todayIps.length ? (
              <Scroll
                viewportClassName="max-h-80"
                innerClassName="flex flex-wrap gap-2 p-4"
              >
                {aggregate.todayIps.map((ip) => (
                  <IpInfoButton ip={ip} key={ip} />
                ))}
              </Scroll>
            ) : (
              <EmptyBlock label="暂无今日 IP" />
            )}
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.56fr)_minmax(0,0.44fr)]">
          <Panel
            description="访客点赞与阅读时长活动。"
            title={
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2">
                  <Heart aria-hidden="true" className="size-4" />
                  访客活动
                </span>
                <div className="flex rounded border border-neutral-200 bg-white p-0.5 dark:border-neutral-800 dark:bg-neutral-950">
                  {(
                    [
                      [ActivityType.Like, '点赞记录'],
                      [ActivityType.ReadDuration, '阅读记录'],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      className={cn(
                        'h-8 rounded px-3 text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-neutral-50',
                        activityType === value &&
                          'bg-neutral-950 text-white hover:text-white dark:bg-neutral-50 dark:text-neutral-950 dark:hover:text-neutral-950',
                      )}
                      key={value}
                      onClick={() => {
                        setActivityType(value)
                        setActivityPage(1)
                      }}
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            }
          >
            {activityQuery.isLoading && activities.length === 0 ? (
              <AnalyzeSkeleton />
            ) : activityQuery.isError ? (
              <ErrorBlock
                label="访客活动加载失败"
                onRetry={() => void activityQuery.refetch()}
              />
            ) : activities.length ? (
              <ActivityList
                items={activities}
                refObjects={refObjects}
                type={activityType}
              />
            ) : (
              <EmptyBlock
                label={
                  activityType === ActivityType.Like
                    ? '暂无点赞记录'
                    : '暂无阅读记录'
                }
              />
            )}

            {activityPagination && activityPagination.totalPages > 1 ? (
              <div className="flex items-center justify-end border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
                <CompactPagination
                  onPageChange={setActivityPage}
                  onPageSizeChange={() => undefined}
                  page={activityPage}
                  pageCount={activityPagination.totalPages}
                  pageSize={activityPageSize}
                  pageSizes={[activityPageSize]}
                />
              </div>
            ) : null}
          </Panel>

          <Panel
            description="按时间范围统计阅读排名。"
            title={
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2">
                  <BookOpen aria-hidden="true" className="size-4" />
                  阅读排名
                </span>
                <div className="flex rounded border border-neutral-200 bg-white p-0.5 dark:border-neutral-800 dark:bg-neutral-950">
                  {(
                    [
                      ['day', '24 小时'],
                      ['week', '7 天'],
                      ['month', '30 天'],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      className={cn(
                        'h-8 rounded px-3 text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-neutral-50',
                        rankRange === value &&
                          'bg-neutral-950 text-white hover:text-white dark:bg-neutral-50 dark:text-neutral-950 dark:hover:text-neutral-950',
                      )}
                      key={value}
                      onClick={() => setRankRange(value)}
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            }
          >
            <div className="border-b border-neutral-100 px-4 py-3 text-xs text-neutral-500 dark:border-neutral-900 dark:text-neutral-400">
              <Calendar aria-hidden="true" className="mr-1.5 inline size-3.5" />
              {formatDateTime(new Date(rankRangeValue.start).toISOString())} -
              {formatDateTime(new Date(rankRangeValue.end).toISOString())}
            </div>
            {readingRankQuery.isLoading ? (
              <AnalyzeSkeleton />
            ) : readingRankQuery.isError ? (
              <ErrorBlock
                label="阅读排名加载失败"
                onRetry={() => void readingRankQuery.refetch()}
              />
            ) : readingRankQuery.data?.length ? (
              <ReadingRankList items={readingRankQuery.data} />
            ) : (
              <EmptyBlock label="暂无阅读数据" />
            )}
          </Panel>
        </div>

        <Panel description="最近访问记录，按后端分页返回。" title="访问记录">
          {recordsQuery.isLoading && records.length === 0 ? (
            <AnalyzeSkeleton />
          ) : recordsQuery.isError ? (
            <div className="flex min-h-[18rem] flex-col items-center justify-center">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                访问记录加载失败
              </p>
              <Button
                className="mt-3"
                onClick={() => void recordsQuery.refetch()}
                type="button"
              >
                重试
              </Button>
            </div>
          ) : records.length ? (
            <Scroll orientation="horizontal">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="text-xs uppercase text-neutral-500 dark:text-neutral-400">
                  <tr>
                    <th className="border-b border-neutral-200 px-4 py-3 font-medium dark:border-neutral-800">
                      路径
                    </th>
                    <th className="border-b border-neutral-200 px-4 py-3 font-medium dark:border-neutral-800">
                      IP
                    </th>
                    <th className="border-b border-neutral-200 px-4 py-3 font-medium dark:border-neutral-800">
                      浏览器
                    </th>
                    <th className="border-b border-neutral-200 px-4 py-3 font-medium dark:border-neutral-800">
                      系统
                    </th>
                    <th className="border-b border-neutral-200 px-4 py-3 font-medium dark:border-neutral-800">
                      时间
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <AnalyzeRecordRow key={record.id} record={record} />
                  ))}
                </tbody>
              </table>
            </Scroll>
          ) : (
            <EmptyBlock label="暂无访问记录" />
          )}

          {pagination && totalPages > 1 ? (
            <div className="flex items-center justify-end border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <CompactPagination
                onPageChange={setPage}
                onPageSizeChange={() => undefined}
                page={page}
                pageCount={totalPages}
                pageSize={pageSize}
                pageSizes={[pageSize]}
              />
            </div>
          ) : null}
        </Panel>
      </Scroll>
    </AppPage>
  )
}
