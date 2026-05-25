import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BookOpen,
  Calendar,
  ChartLine,
  ExternalLink,
  Eye,
  Globe2,
  Heart,
  Loader2,
  Monitor,
  MonitorSmartphone,
  Newspaper,
  RefreshCw,
  Route,
  Timer,
  Trash2,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { ReactNode } from 'react'
import type { ActivityItem, ReadingRankItem } from '../api/activity'
import type {
  AnalyzeRecord,
  DeviceDistributionResponse,
  IPAggregate,
  TrafficSourceResponse,
} from '../api/analyze'
import type { ActivityReadDurationType } from '../models/activity'

import { relativeTimeFromNow } from '~/app/utils/time'

import {
  ActivityType,
  getActivityList,
  getReadingRank,
  getReferenceUrl,
  getTopReadings,
} from '../api/activity'
import {
  deleteAllAnalyzeRecords,
  getAnalyzeAggregate,
  getAnalyzeList,
  getDeviceDistribution,
  getTrafficSource,
} from '../api/analyze'
import { callBuiltInFunction } from '../api/system'
import { Button } from '../ui/button'
import { cn } from '../ui/cn'
import { CompactPagination } from '../ui/compact-pagination'
import { MetricCard } from '../ui/metric-card'
import { AppPage, PageHeader } from '../ui/page-layout'
import { Panel } from '../ui/panel'
import { Scroll } from '../ui/scroll'

const analyzeQueryKey = ['analyze']
const pageSize = 20
const activityPageSize = 10
type AnalyzePeriod = 'day' | 'month' | 'week'
type RankRange = 'day' | 'month' | 'week'
interface TrendPoint {
  ip: number
  label: string
  pv: number
}
interface IPInfo {
  cityName?: string
  countryName?: string
  ip: string
  ispDomain?: string
  ownerDomain?: string
  range?: {
    from?: string
    to?: string
  }
  regionName?: string
}

export function AnalyzePage() {
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

  return (
    <AppPage>
      <PageHeader
        actions={
          <>
            <Button
              disabled={
                aggregateQuery.isFetching ||
                recordsQuery.isFetching ||
                trafficSourceQuery.isFetching ||
                deviceDistributionQuery.isFetching ||
                topReadingsQuery.isFetching
              }
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
                className={cn(
                  'size-4',
                  (aggregateQuery.isFetching ||
                    recordsQuery.isFetching ||
                    trafficSourceQuery.isFetching ||
                    deviceDistributionQuery.isFetching ||
                    topReadingsQuery.isFetching) &&
                    'animate-spin',
                )}
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

function AnalyzeRecordRow(props: { record: AnalyzeRecord }) {
  const record = props.record
  const browser = record.ua?.browser
  const os = record.ua?.os

  return (
    <tr className="border-b border-neutral-100 last:border-0 dark:border-neutral-900">
      <td className="max-w-[24rem] truncate px-4 py-3 text-xs text-neutral-700 dark:text-neutral-300">
        {record.path || '-'}
      </td>
      <td className="px-4 py-3 font-mono text-xs text-neutral-500 dark:text-neutral-400">
        {record.ip ? <IpInfoButton ip={record.ip} /> : '-'}
      </td>
      <td className="px-4 py-3 text-xs text-neutral-500 dark:text-neutral-400">
        {browser?.name ?? '-'} {browser?.major ?? ''}
      </td>
      <td className="px-4 py-3 text-xs text-neutral-500 dark:text-neutral-400">
        {os?.name ?? '-'} {os?.version ?? ''}
      </td>
      <td className="px-4 py-3 text-xs text-neutral-500 dark:text-neutral-400">
        {record.timestamp ? relativeTimeFromNow(record.timestamp) : '-'}
      </td>
    </tr>
  )
}

function ActivityList(props: {
  items: Array<ActivityItem | ActivityReadDurationType>
  refObjects: Map<string, { id: string; title?: string }>
  type: ActivityType
}) {
  return (
    <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
      {props.items.map((item) =>
        props.type === ActivityType.ReadDuration ? (
          <ReadDurationActivityRow
            item={item as ActivityReadDurationType}
            key={item.id}
            refObject={
              'refId' in item && item.refId
                ? props.refObjects.get(item.refId)
                : undefined
            }
          />
        ) : (
          <LikeActivityRow item={item as ActivityItem} key={item.id} />
        ),
      )}
    </div>
  )
}

function LikeActivityRow(props: { item: ActivityItem }) {
  const refId = props.item.ref?.id ?? props.item.payload.id
  const title = props.item.ref?.title ?? '已删除的内容'

  return (
    <article className="px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-600 dark:bg-red-950/40 dark:text-red-400">
          <Heart aria-hidden="true" className="size-3.5" />
          点赞
        </span>
        <time
          className="text-xs text-neutral-400"
          dateTime={props.item.createdAt}
        >
          {relativeTimeFromNow(props.item.createdAt)}
        </time>
      </div>
      <div className="mt-3">
        <ReferenceButton id={refId} title={title} />
      </div>
      {props.item.payload.ip ? (
        <div className="mt-2">
          <IpInfoButton ip={props.item.payload.ip} />
        </div>
      ) : null}
    </article>
  )
}

function ReadDurationActivityRow(props: {
  item: ActivityReadDurationType
  refObject?: { id: string; title?: string }
}) {
  const durationMs =
    props.item.payload.operationTime - props.item.payload.connectedAt
  const durationPercent = Math.min(Math.max(durationMs / 3_600_000, 0), 1) * 100
  const title = props.refObject?.title ?? '未知内容'

  return (
    <article className="px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            <Timer aria-hidden="true" className="size-3.5" />
            阅读
          </span>
          {props.item.payload.displayName || props.item.payload.identity ? (
            <span className="truncate text-xs text-neutral-500 dark:text-neutral-400">
              {props.item.payload.displayName || props.item.payload.identity}
            </span>
          ) : null}
        </div>
        <time
          className="shrink-0 text-xs text-neutral-400"
          dateTime={props.item.createdAt}
        >
          {relativeTimeFromNow(props.item.createdAt)}
        </time>
      </div>

      <div className="mt-3">
        <ReferenceButton id={props.refObject?.id} title={title} />
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-neutral-500 dark:text-neutral-400">
            阅读时长
          </span>
          <span className="font-medium text-neutral-700 dark:text-neutral-200">
            {formatDuration(durationMs)}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded bg-neutral-100 dark:bg-neutral-900">
          <div
            className="h-full rounded bg-neutral-950 dark:bg-neutral-50"
            style={{ width: `${durationPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-3 text-xs text-neutral-500 dark:text-neutral-400">
        <IpInfoButton ip={props.item.payload.ip} />
        {props.item.payload.position > 0 ? (
          <span>位置 {props.item.payload.position}%</span>
        ) : null}
      </div>
    </article>
  )
}

function ReadingRankList(props: { items: ReadingRankItem[] }) {
  const max = Math.max(...props.items.map((item) => item.count), 1)

  return (
    <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
      {props.items.map((item, index) => (
        <div
          className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3"
          key={item.refId}
        >
          <span
            className={cn(
              'flex size-7 items-center justify-center rounded-full text-xs font-semibold',
              index < 3
                ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400',
            )}
          >
            {index + 1}
          </span>
          <div className="min-w-0">
            <ReferenceButton
              id={item.ref?.id}
              title={item.ref?.title ?? '已删除的文章'}
            />
            <div className="mt-2 h-1.5 overflow-hidden rounded bg-neutral-100 dark:bg-neutral-900">
              <div
                className="h-full rounded bg-[var(--color-primary)]"
                style={{ width: `${Math.max((item.count / max) * 100, 3)}%` }}
              />
            </div>
          </div>
          <span className="text-sm tabular-nums text-neutral-600 dark:text-neutral-300">
            {formatNumber(item.count)}
          </span>
        </div>
      ))}
    </div>
  )
}

function ReferenceButton(props: { id?: string; title: string }) {
  const openReference = async () => {
    if (!props.id) return
    const url = await getReferenceUrl(props.id)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 truncate text-left text-sm text-neutral-800 dark:text-neutral-100',
        props.id
          ? 'hover:text-[var(--color-primary)]'
          : 'cursor-default text-neutral-400 dark:text-neutral-500',
      )}
      disabled={!props.id}
      onClick={() => {
        void openReference()
      }}
      type="button"
    >
      <BookOpen
        aria-hidden="true"
        className="size-3.5 shrink-0 text-neutral-400"
      />
      <span className="truncate">{props.title}</span>
      {props.id ? (
        <ExternalLink
          aria-hidden="true"
          className="size-3 shrink-0 text-neutral-400"
        />
      ) : null}
    </button>
  )
}

function TopReadingsChart(props: { items: ReadingRankItem[] }) {
  const max = Math.max(...props.items.map((item) => item.count), 1)

  return (
    <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
      {props.items.map((item, index) => (
        <div
          className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 px-4 py-3"
          key={item.refId}
        >
          <span
            className={cn(
              'flex size-7 items-center justify-center rounded-full text-xs font-semibold',
              index < 3
                ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400',
            )}
          >
            {index + 1}
          </span>
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-3">
              <ReferenceButton
                id={item.ref?.id}
                title={item.ref?.title ?? '已删除的文章'}
              />
              <span className="text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
                {formatNumber(item.count)}
              </span>
            </div>
            <ProgressBar
              className="mt-2"
              value={Math.max((item.count / max) * 100, 3)}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function TrafficSourceChart(props: { data: TrafficSourceResponse }) {
  return (
    <div className="grid gap-3 p-4">
      <DistributionList items={props.data.categories} />
      {props.data.details.length ? (
        <div className="border-t border-neutral-100 pt-3 dark:border-neutral-900">
          <div className="mb-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
            来源明细
          </div>
          <Scroll viewportClassName="max-h-36" innerClassName="grid gap-2">
            {props.data.details.slice(0, 8).map((item) => (
              <div
                className="flex items-center justify-between gap-3 text-xs"
                key={item.source}
              >
                <span className="min-w-0 truncate font-mono text-neutral-600 dark:text-neutral-300">
                  {item.source || '直接访问'}
                </span>
                <span className="tabular-nums text-neutral-400">
                  {formatNumber(item.count)}
                </span>
              </div>
            ))}
          </Scroll>
        </div>
      ) : null}
    </div>
  )
}

function DeviceDistributionChart(props: { data: DeviceDistributionResponse }) {
  return (
    <div className="grid gap-4 p-4">
      <DistributionGroup
        icon={<MonitorSmartphone aria-hidden="true" className="size-3.5" />}
        items={props.data.devices}
        label="设备"
      />
      <DistributionGroup
        icon={<Monitor aria-hidden="true" className="size-3.5" />}
        items={props.data.browsers}
        label="浏览器"
      />
      <DistributionGroup
        icon={<Route aria-hidden="true" className="size-3.5" />}
        items={props.data.os}
        label="系统"
      />
    </div>
  )
}

function DistributionGroup(props: {
  icon: ReactNode
  items: Array<{ name: string; value: number }>
  label: string
}) {
  if (!props.items.length) return null

  return (
    <section>
      <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
        {props.icon}
        {props.label}
      </div>
      <DistributionList items={props.items.slice(0, 5)} />
    </section>
  )
}

function DistributionList(props: {
  items: Array<{ name: string; value: number }>
}) {
  const total = props.items.reduce((sum, item) => sum + item.value, 0)
  const max = Math.max(...props.items.map((item) => item.value), 1)

  return (
    <div className="grid gap-2">
      {props.items.map((item) => (
        <div className="grid gap-1" key={item.name || 'unknown'}>
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="truncate text-neutral-700 dark:text-neutral-200">
              {item.name || '未知'}
            </span>
            <span className="tabular-nums text-neutral-500 dark:text-neutral-400">
              {formatNumber(item.value)}
              {total > 0 ? ` · ${Math.round((item.value / total) * 100)}%` : ''}
            </span>
          </div>
          <ProgressBar value={Math.max((item.value / max) * 100, 3)} />
        </div>
      ))}
    </div>
  )
}

function hasDeviceDistribution(
  data: DeviceDistributionResponse | undefined,
): data is DeviceDistributionResponse {
  return Boolean(
    data &&
    (data.devices.length > 0 || data.browsers.length > 0 || data.os.length > 0),
  )
}

function ProgressBar(props: { className?: string; value: number }) {
  return (
    <div
      className={cn(
        'h-1.5 overflow-hidden rounded bg-neutral-100 dark:bg-neutral-900',
        props.className,
      )}
    >
      <div
        className="h-full rounded bg-[var(--color-primary)]"
        style={{ width: `${props.value}%` }}
      />
    </div>
  )
}

function IpInfoButton(props: { ip: string }) {
  const [open, setOpen] = useState(false)
  const [info, setInfo] = useState<IPInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    if (info || loading) return
    setLoading(true)
    setError(null)
    try {
      const result = await callBuiltInFunction<IPInfo>('ip', { ip: props.ip })
      setInfo(result)
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'IP 信息获取失败'))
    } finally {
      setLoading(false)
    }
  }

  const show = () => {
    setOpen(true)
    void load()
  }

  return (
    <span
      className="relative inline-flex"
      onBlur={() => setOpen(false)}
      onFocus={show}
      onMouseEnter={show}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className="inline-flex h-7 items-center gap-1.5 rounded border border-neutral-200 bg-neutral-50 px-2 font-mono text-xs text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-white dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-700 dark:hover:bg-neutral-950"
        type="button"
      >
        <Globe2 aria-hidden="true" className="size-3.5 text-neutral-400" />
        {props.ip}
      </button>
      {open ? (
        <span className="absolute left-0 top-full z-20 mt-2 w-72 rounded border border-neutral-200 bg-white p-3 text-left text-xs shadow-lg dark:border-neutral-800 dark:bg-neutral-950">
          {loading ? (
            <span className="text-neutral-500 dark:text-neutral-400">
              获取中...
            </span>
          ) : error ? (
            <span className="text-red-500">{error}</span>
          ) : info ? (
            <IpInfoContent info={info} />
          ) : (
            <span className="text-neutral-500 dark:text-neutral-400">
              暂无 IP 信息
            </span>
          )}
        </span>
      ) : null}
    </span>
  )
}

function IpInfoContent(props: { info: IPInfo }) {
  const city = [
    props.info.countryName,
    props.info.regionName,
    props.info.cityName,
  ]
    .filter(Boolean)
    .join(' - ')

  return (
    <div className="grid gap-2 text-neutral-600 dark:text-neutral-300">
      <InfoLine label="IP">{props.info.ip}</InfoLine>
      <InfoLine label="城市">{city || 'N/A'}</InfoLine>
      <InfoLine label="ISP">{props.info.ispDomain || 'N/A'}</InfoLine>
      <InfoLine label="组织">{props.info.ownerDomain || 'N/A'}</InfoLine>
      <InfoLine label="范围">
        {props.info.range?.from || props.info.range?.to
          ? `${props.info.range.from ?? '?'} - ${props.info.range.to ?? '?'}`
          : 'N/A'}
      </InfoLine>
    </div>
  )
}

function InfoLine(props: { children: ReactNode; label: string }) {
  return (
    <div className="grid grid-cols-[3rem_minmax(0,1fr)] gap-2">
      <span className="text-neutral-400 dark:text-neutral-500">
        {props.label}
      </span>
      <span className="min-w-0 break-words">{props.children}</span>
    </div>
  )
}

function ErrorBlock(props: { label: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-[14rem] flex-col items-center justify-center px-4 text-sm text-neutral-500 dark:text-neutral-400">
      <p>{props.label}</p>
      <Button className="mt-3" onClick={props.onRetry} type="button">
        重试
      </Button>
    </div>
  )
}

function AnalyzeSkeleton() {
  return (
    <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
      {Array.from({ length: 5 }).map((_, index) => (
        <div className="px-4 py-3" key={index}>
          <div className="h-4 w-2/5 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
          <div className="mt-3 h-3 w-3/5 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
        </div>
      ))}
    </div>
  )
}

function EmptyBlock(props: { label: string }) {
  return (
    <div className="flex min-h-[14rem] items-center justify-center px-4 text-sm text-neutral-500 dark:text-neutral-400">
      {props.label}
    </div>
  )
}

function TrendChart(props: { data: TrendPoint[] }) {
  const maxValue = Math.max(
    1,
    ...props.data.flatMap((item) => [item.ip, item.pv]),
  )

  return (
    <div className="p-4">
      <Scroll
        className="border-b border-l border-neutral-200 dark:border-neutral-800"
        orientation="horizontal"
      >
        <div className="flex h-64 items-end gap-3 px-2 pb-6">
          {props.data.map((item) => (
            <div
              className="flex min-w-12 flex-1 flex-col items-center gap-2"
              key={item.label}
            >
              <div className="flex h-48 items-end gap-1">
                <span
                  className="w-3 rounded-t bg-neutral-950 dark:bg-neutral-50"
                  style={{
                    height: `${Math.max(4, (item.pv / maxValue) * 100)}%`,
                  }}
                  title={`PV ${item.pv}`}
                />
                <span
                  className="w-3 rounded-t bg-[var(--color-primary)]"
                  style={{
                    height: `${Math.max(4, (item.ip / maxValue) * 100)}%`,
                  }}
                  title={`IP ${item.ip}`}
                />
              </div>
              <span className="max-w-16 truncate text-xs text-neutral-500 dark:text-neutral-400">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </Scroll>
      <div className="mt-3 flex items-center gap-4 px-2 text-xs text-neutral-500 dark:text-neutral-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-neutral-950 dark:bg-neutral-50" />
          PV
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-[var(--color-primary)]" />
          IP
        </span>
      </div>
    </div>
  )
}

function buildTrendData(
  aggregate: IPAggregate | undefined,
  period: AnalyzePeriod,
): TrendPoint[] {
  if (!aggregate) return []

  const source =
    period === 'day'
      ? aggregate.today
      : period === 'week'
        ? aggregate.weeks
        : aggregate.months
  const map = new Map<string, TrendPoint>()

  for (const item of source) {
    const label =
      'hour' in item
        ? item.hour
        : 'day' in item
          ? item.day
          : formatMonthDate(item.date)
    const current = map.get(label) ?? { ip: 0, label, pv: 0 }

    if (item.key === 'pv') current.pv = item.value
    else current.ip = item.value

    map.set(label, current)
  }

  return Array.from(map.values())
}

function buildRefObjectMap(
  objects: ActivityListResponseObjects | undefined,
): Map<string, { id: string; title?: string }> {
  const map = new Map<string, { id: string; title?: string }>()

  if (!objects) return map
  ;[
    ...(objects.posts ?? []),
    ...(objects.notes ?? []),
    ...(objects.pages ?? []),
    ...(objects.recentlies ?? []),
  ].forEach((item) => {
    map.set(item.id, item)
  })

  return map
}

type ActivityListResponseObjects = NonNullable<
  Awaited<ReturnType<typeof getActivityList>>['objects']
>

function getRankRange(range: RankRange) {
  const end = Date.now()
  const days = range === 'day' ? 1 : range === 'week' ? 7 : 30

  return {
    end,
    start: end - days * 24 * 60 * 60 * 1000,
  }
}

function formatDuration(value: number) {
  const totalSeconds = Math.max(0, Math.floor(value / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) return `${hours}小时 ${minutes}分钟 ${seconds}秒`
  if (minutes > 0) return `${minutes}分钟 ${seconds}秒`
  return `${seconds}秒`
}

function formatMonthDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function formatNumber(value?: number) {
  return typeof value === 'number' ? value.toLocaleString() : '-'
}

function formatAverageDepth(pv?: number, uv?: number) {
  if (!pv || !uv) return '0'
  return (pv / uv).toFixed(1)
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}
