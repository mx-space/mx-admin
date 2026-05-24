import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChartLine,
  Eye,
  Globe2,
  Loader2,
  RefreshCw,
  Route,
  Trash2,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import type { AnalyzeRecord } from '../api/analyze'

import { relativeTimeFromNow } from '~/app/utils/time'

import {
  deleteAllAnalyzeRecords,
  getAnalyzeAggregate,
  getAnalyzeList,
} from '../api/analyze'
import { Button } from '../ui/button'
import { cn } from '../ui/cn'
import { CompactPagination } from '../ui/compact-pagination'
import { MetricCard } from '../ui/metric-card'
import { Panel } from '../ui/panel'

const analyzeQueryKey = ['analyze']
const pageSize = 20

export function AnalyzePage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)

  const aggregateQuery = useQuery({
    queryFn: getAnalyzeAggregate,
    queryKey: [...analyzeQueryKey, 'aggregate'],
  })

  const recordsQuery = useQuery({
    placeholderData: (previous) => previous,
    queryFn: () => getAnalyzeList({ page, size: pageSize }),
    queryKey: [...analyzeQueryKey, 'records', { page, size: pageSize }],
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
  const records = recordsQuery.data?.data ?? []
  const pagination = recordsQuery.data?.pagination
  const totalPages = pagination
    ? 'totalPages' in pagination
      ? pagination.totalPages
      : ((pagination as { totalPage?: number }).totalPage ?? 1)
    : 1

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-neutral-950 dark:text-neutral-50">
            数据分析
          </h2>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            访问量、独立访客、路径分布和访问记录。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            disabled={aggregateQuery.isFetching || recordsQuery.isFetching}
            onClick={() => {
              void aggregateQuery.refetch()
              void recordsQuery.refetch()
            }}
            type="button"
            variant="subtle"
          >
            <RefreshCw
              aria-hidden="true"
              className={cn(
                'size-4',
                (aggregateQuery.isFetching || recordsQuery.isFetching) &&
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
        </div>
      </div>

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
            <div className="flex max-h-80 flex-wrap gap-2 overflow-y-auto p-4">
              {aggregate.todayIps.map((ip) => (
                <span
                  className="rounded border border-neutral-200 bg-neutral-50 px-2 py-1 font-mono text-xs text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                  key={ip}
                >
                  {ip}
                </span>
              ))}
            </div>
          ) : (
            <EmptyBlock label="暂无今日 IP" />
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
          <div className="overflow-x-auto">
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
          </div>
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
    </div>
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
        {record.ip || '-'}
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
