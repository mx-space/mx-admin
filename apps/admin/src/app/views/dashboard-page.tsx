import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Activity,
  BookOpen,
  BrushCleaning,
  Clock3,
  File,
  FileText,
  Gauge,
  Heart,
  Link,
  MessageSquare,
  Pencil,
  Quote,
  Radio,
  RefreshCw,
  Tags,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import type { LucideIcon } from 'lucide-react'
import type { StatCount } from '../api/aggregate'

import {
  cleanCache,
  cleanRedis,
  countReadAndLike,
  countSiteWords,
  getAggregateStat,
  getCategoryDistribution,
  getCommentActivity,
  getPublicationTrend,
  getSiteLikeCount,
  getTagCloud,
  getTopArticles,
  getTrafficSource,
} from '../api/aggregate'
import { Button } from '../ui/button'
import { cn } from '../ui/cn'
import { Panel } from '../ui/panel'

const defaultStat: StatCount = {
  callTime: 0,
  categories: 0,
  comments: 0,
  linkApply: 0,
  links: 0,
  notes: 0,
  online: 0,
  pages: 0,
  posts: 0,
  recently: 0,
  says: 0,
  todayIpAccessCount: 0,
  todayMaxOnline: 0,
  todayOnlineTotal: 0,
  unreadComments: 0,
  uv: 0,
}

export function DashboardPage() {
  const navigate = useNavigate()
  const statQuery = useQuery({
    queryFn: getAggregateStat,
    queryKey: ['dashboard', 'aggregate-stat'],
    refetchInterval: 3000,
  })
  const stat = statQuery.data ?? defaultStat
  const wordCountQuery = useQuery({
    queryFn: countSiteWords,
    queryKey: ['dashboard', 'word-count'],
  })
  const readLikeQuery = useQuery({
    queryFn: countReadAndLike,
    queryKey: ['dashboard', 'read-like'],
  })
  const siteLikeQuery = useQuery({
    queryFn: getSiteLikeCount,
    queryKey: ['dashboard', 'site-like'],
  })
  const categoryQuery = useQuery({
    queryFn: getCategoryDistribution,
    queryKey: ['dashboard', 'category-distribution'],
  })
  const trendQuery = useQuery({
    queryFn: getPublicationTrend,
    queryKey: ['dashboard', 'publication-trend'],
  })
  const tagsQuery = useQuery({
    queryFn: getTagCloud,
    queryKey: ['dashboard', 'tag-cloud'],
  })
  const topArticlesQuery = useQuery({
    queryFn: getTopArticles,
    queryKey: ['dashboard', 'top-articles'],
  })
  const commentActivityQuery = useQuery({
    queryFn: getCommentActivity,
    queryKey: ['dashboard', 'comment-activity'],
  })
  const trafficSourceQuery = useQuery({
    queryFn: getTrafficSource,
    queryKey: ['dashboard', 'traffic-source'],
  })

  const cleanCacheMutation = useMutation({
    mutationFn: cleanCache,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '清除 API 缓存失败')),
    onSuccess: () => toast.success('API 缓存已清除'),
  })
  const cleanRedisMutation = useMutation({
    mutationFn: cleanRedis,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '清除数据缓存失败')),
    onSuccess: () => toast.success('数据缓存已清除'),
  })

  const updatedAt = useMemo(() => new Date(), [statQuery.dataUpdatedAt])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-950 dark:text-neutral-50">
            欢迎回来
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            实时数据、内容入口和系统维护操作。
          </p>
        </div>
        <Button
          disabled={statQuery.isFetching}
          onClick={() => void statQuery.refetch()}
          type="button"
          variant="subtle"
        >
          <RefreshCw
            aria-hidden="true"
            className={cn('size-4', statQuery.isFetching && 'animate-spin')}
          />
          刷新实时数据
        </Button>
      </div>

      <section className="grid gap-3 md:grid-cols-3">
        <LiveCard icon={Radio} label="当前在线访客" live value={stat.online} />
        <LiveCard icon={Users} label="今日访客" value={stat.todayOnlineTotal} />
        <LiveCard
          icon={TrendingUp}
          label="今日最高在线"
          value={stat.todayMaxOnline}
        />
      </section>

      <Panel
        description={`更新于 ${updatedAt.toLocaleTimeString('zh-CN')}`}
        title="快速操作"
      >
        <div className="grid gap-px bg-neutral-200 sm:grid-cols-2 lg:grid-cols-4 dark:bg-neutral-800">
          <ActionCard
            icon={FileText}
            label="博文"
            onManage={() => navigate('/posts')}
            onPrimary={() => navigate('/posts/edit')}
            primaryLabel="撰写"
            value={stat.posts}
          />
          <ActionCard
            icon={BookOpen}
            label="日记"
            onManage={() => navigate('/notes')}
            onPrimary={() => navigate('/notes/edit')}
            primaryLabel="撰写"
            value={stat.notes}
          />
          <ActionCard
            icon={Pencil}
            label="速记"
            onManage={() => navigate('/recently')}
            onPrimary={() => navigate('/recently')}
            primaryLabel="新建速记"
            value={stat.recently}
          />
          <ActionCard
            icon={Quote}
            label="说说"
            onManage={() => navigate('/says')}
            onPrimary={() => navigate('/says')}
            primaryLabel="发布说说"
            value={stat.says}
          />
        </div>
      </Panel>

      <Panel title="数据统计">
        <div className="grid gap-px bg-neutral-200 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 dark:bg-neutral-800">
          <StatCell
            icon={File}
            label="页面"
            onClick={() => navigate('/pages')}
            value={stat.pages}
          />
          <StatCell
            icon={Tags}
            label="分类"
            onClick={() => navigate('/posts/category')}
            value={stat.categories}
          />
          <StatCell
            icon={MessageSquare}
            label="全部评论"
            onClick={() => navigate('/comments?state=1')}
            value={stat.allComments ?? stat.comments}
          />
          <StatCell
            icon={MessageSquare}
            label="未读评论"
            onClick={() => navigate('/comments?state=0')}
            value={stat.unreadComments}
          />
          <StatCell
            icon={Link}
            label="友链"
            onClick={() => navigate('/friends?state=0')}
            value={stat.links}
          />
          <StatCell
            icon={Link}
            label="友链申请"
            onClick={() => navigate('/friends?state=1')}
            value={stat.linkApply ?? 0}
          />
          <StatCell
            icon={Activity}
            label="API 调用"
            onClick={() => navigate('/analyze')}
            value={stat.callTime}
          />
          <StatCell
            icon={Gauge}
            label="今日 IP 访问"
            onClick={() => navigate('/analyze')}
            value={stat.todayIpAccessCount}
          />
          <StatCell
            icon={FileText}
            label="全站字符数"
            value={wordCountQuery.data?.count ?? 0}
          />
          <StatCell
            icon={BookOpen}
            label="总阅读量"
            value={readLikeQuery.data?.totalReads ?? 0}
          />
          <StatCell
            icon={Heart}
            label="文章点赞"
            value={readLikeQuery.data?.totalLikes ?? 0}
          />
          <StatCell
            icon={Heart}
            label="站点点赞"
            value={siteLikeQuery.data ?? 0}
          />
          <StatCell
            icon={Clock3}
            label="UV"
            onClick={() => navigate('/analyze')}
            value={stat.uv}
          />
        </div>
      </Panel>

      <section className="grid gap-4 xl:grid-cols-2">
        <BarPanel
          items={(trendQuery.data ?? []).map((item) => ({
            label: item.date,
            value: item.posts + item.notes,
          }))}
          title="发布趋势"
        />
        <BarPanel
          items={(categoryQuery.data ?? []).map((item) => ({
            label: item.name,
            value: item.count,
          }))}
          title="分类分布"
        />
        <BarPanel
          items={(commentActivityQuery.data ?? []).map((item) => ({
            label: item.date,
            value: item.count,
          }))}
          title="评论活动"
        />
        <TrafficPanel data={trafficSourceQuery.data} />
        <TopArticlesPanel articles={topArticlesQuery.data ?? []} />
        <TagCloudPanel tags={tagsQuery.data ?? []} />
      </section>

      <Panel title="系统操作">
        <div className="grid gap-px bg-neutral-200 sm:grid-cols-2 dark:bg-neutral-800">
          <MaintenanceCard
            disabled={cleanCacheMutation.isPending}
            icon={BrushCleaning}
            label="API 缓存"
            onClick={() => cleanCacheMutation.mutate()}
            value="HTTP"
          />
          <MaintenanceCard
            disabled={cleanRedisMutation.isPending}
            icon={BrushCleaning}
            label="数据缓存"
            onClick={() => cleanRedisMutation.mutate()}
            value="Redis"
          />
        </div>
      </Panel>
    </div>
  )
}

function LiveCard(props: {
  icon: LucideIcon
  label: string
  live?: boolean
  value: number | string
}) {
  const Icon = props.icon

  return (
    <div className="rounded border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-center gap-4">
        <div className="relative">
          {props.live ? (
            <span className="absolute -right-1 -top-1 flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-green-500" />
            </span>
          ) : null}
          <Icon className="size-5 text-neutral-400" />
        </div>
        <div>
          <div className="text-xl font-semibold tabular-nums">
            {formatNumber(props.value)}
          </div>
          <div className="text-sm text-neutral-500">{props.label}</div>
        </div>
      </div>
    </div>
  )
}

function ActionCard(props: {
  icon: LucideIcon
  label: string
  onManage: () => void
  onPrimary: () => void
  primaryLabel: string
  value: number | string
}) {
  const Icon = props.icon

  return (
    <div className="bg-white p-4 dark:bg-neutral-950">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-neutral-500">{props.label}</div>
          <div className="mt-1 text-xl font-semibold tabular-nums">
            {formatNumber(props.value)}
          </div>
        </div>
        <Icon className="size-5 text-neutral-400" />
      </div>
      <div className="mt-3 flex gap-2">
        <Button onClick={props.onPrimary} type="button">
          {props.primaryLabel}
        </Button>
        <Button onClick={props.onManage} type="button" variant="subtle">
          管理
        </Button>
      </div>
    </div>
  )
}

function StatCell(props: {
  icon: LucideIcon
  label: string
  onClick?: () => void
  value: number | string
}) {
  const Icon = props.icon

  return (
    <button
      className={cn(
        'bg-white p-4 text-left dark:bg-neutral-950',
        props.onClick &&
          'transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900',
      )}
      disabled={!props.onClick}
      onClick={props.onClick}
      type="button"
    >
      <Icon className="mb-3 size-4 text-neutral-400" />
      <div className="text-xs text-neutral-500">{props.label}</div>
      <div className="mt-1 text-lg font-medium tabular-nums">
        {formatNumber(props.value)}
      </div>
    </button>
  )
}

function BarPanel(props: {
  items: Array<{ label: string; value: number }>
  title: string
}) {
  const max = Math.max(...props.items.map((item) => item.value), 1)

  return (
    <Panel title={props.title}>
      <div className="space-y-3 p-4">
        {props.items.length === 0 ? (
          <EmptyDashboardBlock />
        ) : (
          props.items.slice(-8).map((item) => (
            <div
              className="grid grid-cols-[8rem_minmax(0,1fr)_4rem] items-center gap-3 text-sm"
              key={item.label}
            >
              <span className="truncate text-neutral-500">{item.label}</span>
              <span className="h-2 overflow-hidden rounded bg-neutral-100 dark:bg-neutral-900">
                <span
                  className="block h-full rounded bg-neutral-900 dark:bg-neutral-100"
                  style={{ width: `${Math.max((item.value / max) * 100, 2)}%` }}
                />
              </span>
              <span className="text-right tabular-nums">
                {formatNumber(item.value)}
              </span>
            </div>
          ))
        )}
      </div>
    </Panel>
  )
}

function TrafficPanel(props: {
  data?: {
    browser: Array<{ count: number; name: string }>
    os: Array<{ count: number; name: string }>
  }
}) {
  return (
    <Panel title="流量来源">
      <div className="grid gap-px bg-neutral-200 sm:grid-cols-2 dark:bg-neutral-800">
        <TrafficGroup items={props.data?.browser ?? []} title="Browser" />
        <TrafficGroup items={props.data?.os ?? []} title="OS" />
      </div>
    </Panel>
  )
}

function TrafficGroup(props: {
  items: Array<{ count: number; name: string }>
  title: string
}) {
  return (
    <div className="bg-white p-4 dark:bg-neutral-950">
      <h3 className="mb-3 text-xs font-medium uppercase text-neutral-500">
        {props.title}
      </h3>
      <div className="space-y-2">
        {props.items.length === 0 ? (
          <p className="text-sm text-neutral-500">暂无数据</p>
        ) : (
          props.items.slice(0, 6).map((item) => (
            <div
              className="flex items-center justify-between gap-3 text-sm"
              key={item.name}
            >
              <span className="truncate text-neutral-600 dark:text-neutral-300">
                {item.name}
              </span>
              <span className="tabular-nums">{formatNumber(item.count)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function TopArticlesPanel(props: {
  articles: Array<{ id: string; likes: number; reads: number; title: string }>
}) {
  return (
    <Panel title="热门文章">
      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {props.articles.length === 0 ? (
          <EmptyDashboardBlock />
        ) : (
          props.articles.slice(0, 8).map((article) => (
            <div
              className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
              key={article.id}
            >
              <span className="min-w-0 truncate text-neutral-800 dark:text-neutral-100">
                {article.title}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-neutral-500">
                {formatNumber(article.reads)} reads ·{' '}
                {formatNumber(article.likes)} likes
              </span>
            </div>
          ))
        )}
      </div>
    </Panel>
  )
}

function TagCloudPanel(props: { tags: Array<{ count: number; tag: string }> }) {
  return (
    <Panel title="标签云">
      <div className="flex min-h-40 flex-wrap content-start gap-2 p-4">
        {props.tags.length === 0 ? (
          <EmptyDashboardBlock />
        ) : (
          props.tags.map((tag) => (
            <span
              className="rounded bg-neutral-100 px-2 py-1 text-sm text-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
              key={tag.tag}
            >
              {tag.tag}
              <span className="ml-1 text-xs text-neutral-500">{tag.count}</span>
            </span>
          ))
        )}
      </div>
    </Panel>
  )
}

function MaintenanceCard(props: {
  disabled?: boolean
  icon: LucideIcon
  label: string
  onClick: () => void
  value: string
}) {
  const Icon = props.icon

  return (
    <div className="bg-white p-4 dark:bg-neutral-950">
      <Icon className="mb-3 size-5 text-neutral-400" />
      <div className="text-sm text-neutral-500">{props.label}</div>
      <div className="mt-1 text-lg font-semibold">{props.value}</div>
      <Button
        className="mt-3"
        disabled={props.disabled}
        onClick={props.onClick}
        type="button"
        variant="subtle"
      >
        清除
      </Button>
    </div>
  )
}

function EmptyDashboardBlock() {
  return (
    <div className="flex min-h-32 items-center justify-center text-sm text-neutral-500">
      暂无数据
    </div>
  )
}

function formatNumber(value: number | string) {
  return typeof value === 'number'
    ? new Intl.NumberFormat('en-US').format(value)
    : value
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}
