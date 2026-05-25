import { Dialog } from '@base-ui/react/dialog'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  BookOpen,
  BrushCleaning,
  Clock3,
  Download,
  ExternalLink,
  File,
  FileText,
  Gauge,
  Globe,
  Heart,
  Link,
  MessageSquare,
  Pencil,
  Quote,
  Radio,
  RefreshCw,
  Search,
  Shield,
  Tags,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { EventSourcePolyfill } from 'event-source-polyfill'
import { toast } from 'sonner'
import type { LucideIcon } from 'lucide-react'
import type { StatCount } from '../api/aggregate'
import type { UpdateRepo } from '../api/github-update'

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
import { checkUpdateFromGitHub, getReleaseDetails } from '../api/github-update'
import { getOwner } from '../api/options'
import { rebuildSearchIndex } from '../api/search-index'
import { getAppInfo } from '../api/system'
import { API_URL } from '../constants/env'
import { Button } from '../ui/button'
import { cn } from '../ui/cn'
import { IpInfoPopover } from '../ui/ip-info-popover'
import { MarkdownRender } from '../ui/markdown-render'
import { Panel } from '../ui/panel'
import { Scroll } from '../ui/scroll'
import { isNewerVersion } from '../utils/version'

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
  const queryClient = useQueryClient()
  const [releaseModal, setReleaseModal] = useState<{
    repo: UpdateRepo
    title: string
    version: string
  } | null>(null)
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const notifiedUpdatesRef = useRef(new Set<string>())
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
  const ownerQuery = useQuery({
    queryFn: getOwner,
    queryKey: ['dashboard', 'owner'],
    retry: false,
  })
  const appInfoQuery = useQuery({
    queryFn: getAppInfo,
    queryKey: ['dashboard', 'app-info'],
    retry: false,
  })
  const adminVersion = __DEV__ ? 'dev mode' : window.version || 'N/A'
  const systemVersion = appInfoQuery.data?.version || 'N/A'
  const updateQuery = useQuery({
    enabled:
      !__DEV__ &&
      appInfoQuery.isSuccess &&
      !appInfoQuery.data?.version?.startsWith('demo'),
    queryFn: checkUpdateFromGitHub,
    queryKey: ['dashboard', 'github-update'],
    retry: false,
    staleTime: 60 * 60 * 1000,
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
  const rebuildSearchIndexMutation = useMutation({
    mutationFn: rebuildSearchIndex,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '重建搜索索引失败')),
    onSuccess: async (result) => {
      toast.success(formatSearchIndexStats(result))
      await queryClient.invalidateQueries({ queryKey: ['search-index'] })
    },
  })

  const updatedAt = useMemo(() => new Date(), [statQuery.dataUpdatedAt])

  useEffect(() => {
    if (__DEV__) return
    if (appInfoQuery.data?.version?.startsWith('demo')) {
      toast.info('Demo Mode - 当前处于演示模式，部分功能可能受到限制')
    }
  }, [appInfoQuery.data?.version])

  useEffect(() => {
    const updates = updateQuery.data
    if (!updates || __DEV__) return

    const closedTips = readClosedUpdateTips()

    if (
      isNewerVersion(adminVersion, updates.dashboard) &&
      closedTips.dashboard !== updates.dashboard &&
      !notifiedUpdatesRef.current.has(`dashboard:${updates.dashboard}`)
    ) {
      notifiedUpdatesRef.current.add(`dashboard:${updates.dashboard}`)
      toast.info(`管理后台有新版本：${adminVersion} → ${updates.dashboard}`, {
        action: {
          label: '更新',
          onClick: () => {
            writeClosedUpdateTip('dashboard', updates.dashboard)
            setUpgradeDialogOpen(true)
          },
        },
        duration: 10000,
      })
    }

    if (
      isNewerVersion(systemVersion, updates.system) &&
      closedTips.system !== updates.system &&
      !notifiedUpdatesRef.current.has(`system:${updates.system}`)
    ) {
      notifiedUpdatesRef.current.add(`system:${updates.system}`)
      toast.info(`系统有新版本：${systemVersion} → ${updates.system}`, {
        action: {
          label: '查看',
          onClick: () => {
            writeClosedUpdateTip('system', updates.system)
            setReleaseModal({
              repo: 'mx-server',
              title: '[系统] 更新详情',
              version: updates.system,
            })
          },
        },
        duration: 10000,
      })
    }
  }, [adminVersion, systemVersion, updateQuery.data])

  return (
    <Scroll
      className="h-full min-h-0 bg-white dark:bg-neutral-950"
      innerClassName="flex flex-col gap-6 p-4"
    >
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
            onPrimary={() => navigate('/recently?create=1')}
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
        <div className="grid gap-px bg-neutral-200 sm:grid-cols-2 xl:grid-cols-3 dark:bg-neutral-800">
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
          <SearchIndexRebuildCard
            forceLoading={
              rebuildSearchIndexMutation.isPending &&
              rebuildSearchIndexMutation.variables === true
            }
            incrementalLoading={
              rebuildSearchIndexMutation.isPending &&
              rebuildSearchIndexMutation.variables !== true
            }
            onForceRebuild={() => {
              if (
                window.confirm(
                  '将清空全部索引行后重新构建，期间搜索结果可能短暂为空，确定继续？',
                )
              ) {
                rebuildSearchIndexMutation.mutate(true)
              }
            }}
            onIncrementalRebuild={() =>
              rebuildSearchIndexMutation.mutate(false)
            }
          />
        </div>
      </Panel>

      <OwnerLoginStat
        lastLoginIp={ownerQuery.data?.lastLoginIp}
        lastLoginTime={ownerQuery.data?.lastLoginTime}
      />

      <DashboardRuntimeFooter
        adminLatestVersion={updateQuery.data?.dashboard}
        adminVersion={adminVersion}
        onCheckUpdates={() => {
          void appInfoQuery.refetch()
          void updateQuery.refetch()
        }}
        onOpenUpgrade={() => setUpgradeDialogOpen(true)}
        pageSource={window.pageSource || ''}
        refreshing={appInfoQuery.isFetching || updateQuery.isFetching}
        systemLatestVersion={updateQuery.data?.system}
        systemVersion={systemVersion}
      />

      <UpdateReleaseDialog
        onClose={() => setReleaseModal(null)}
        release={releaseModal}
      />
      <DashboardUpgradeDialog
        onClose={() => setUpgradeDialogOpen(false)}
        open={upgradeDialogOpen}
      />
    </Scroll>
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

function SearchIndexRebuildCard(props: {
  forceLoading: boolean
  incrementalLoading: boolean
  onForceRebuild: () => void
  onIncrementalRebuild: () => void
}) {
  return (
    <div className="bg-white p-4 dark:bg-neutral-950">
      <Search className="mb-3 size-5 text-neutral-400" />
      <div className="text-sm text-neutral-500">搜索索引</div>
      <div className="mt-1 text-lg font-semibold">BM25</div>
      <p className="mt-1 line-clamp-2 text-xs text-neutral-400 dark:text-neutral-500">
        按需重建全文索引；强制模式会清空后全量重建。
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          disabled={props.incrementalLoading || props.forceLoading}
          onClick={props.onIncrementalRebuild}
          type="button"
          variant="subtle"
        >
          {props.incrementalLoading ? (
            <RefreshCw aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          增量重建
        </Button>
        <Button
          className="border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-950 dark:text-amber-300 dark:hover:bg-amber-950/30"
          disabled={props.incrementalLoading || props.forceLoading}
          onClick={props.onForceRebuild}
          type="button"
          variant="subtle"
        >
          {props.forceLoading ? (
            <RefreshCw aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          强制全量重建
        </Button>
      </div>
    </div>
  )
}

function OwnerLoginStat(props: {
  lastLoginIp?: string
  lastLoginTime?: string
}) {
  if (!props.lastLoginIp && !props.lastLoginTime) return null

  return (
    <div className="grid gap-2 border-t border-neutral-100 pt-4 text-sm text-neutral-500 sm:grid-cols-2 dark:border-neutral-800 dark:text-neutral-400">
      <div className="inline-flex min-w-0 items-center gap-2">
        <Shield
          aria-hidden="true"
          className="size-4 shrink-0 text-neutral-400"
        />
        <span className="shrink-0">上次登录时间:</span>
        <time
          className="min-w-0 truncate text-neutral-700 dark:text-neutral-300"
          dateTime={props.lastLoginTime}
        >
          {props.lastLoginTime ? formatDateTime(props.lastLoginTime) : 'N/A'}
        </time>
      </div>
      <div className="inline-flex min-w-0 items-center gap-2 sm:justify-end">
        <Globe
          aria-hidden="true"
          className="size-4 shrink-0 text-neutral-400"
        />
        <span className="shrink-0">上次登录 IP:</span>
        {props.lastLoginIp ? (
          <IpInfoPopover
            className="inline-flex min-w-0 items-center gap-1.5 text-neutral-700 hover:underline dark:text-neutral-300"
            ip={props.lastLoginIp}
            trigger={<span className="truncate">{props.lastLoginIp}</span>}
          />
        ) : (
          <span className="text-neutral-700 dark:text-neutral-300">N/A</span>
        )}
      </div>
    </div>
  )
}

function DashboardRuntimeFooter(props: {
  adminLatestVersion?: string
  adminVersion: string
  onCheckUpdates: () => void
  onOpenUpgrade: () => void
  pageSource: string
  refreshing: boolean
  systemLatestVersion?: string
  systemVersion: string
}) {
  return (
    <footer className="border-t border-neutral-100 pb-4 pt-4 text-center text-xs leading-6 text-neutral-400 dark:border-neutral-800 dark:text-neutral-500">
      <div className="inline-flex flex-wrap items-center justify-center gap-2">
        <span>
          面板版本: {props.adminVersion}
          {props.adminLatestVersion
            ? ` / 最新 ${props.adminLatestVersion}`
            : ''}
        </span>
        <button
          aria-label="检查更新"
          className="inline-flex size-6 items-center justify-center rounded text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-900 dark:hover:text-neutral-200"
          disabled={props.refreshing}
          onClick={props.onCheckUpdates}
          type="button"
        >
          <RefreshCw
            aria-hidden="true"
            className={cn('size-3.5', props.refreshing && 'animate-spin')}
          />
        </button>
        <button
          className="inline-flex h-6 items-center gap-1 rounded border border-neutral-200 px-2 text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-800 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
          onClick={props.onOpenUpgrade}
          type="button"
        >
          <Download aria-hidden="true" className="size-3" />
          更新面板
        </button>
      </div>
      <div>
        系统版本: {props.systemVersion}
        {props.systemLatestVersion
          ? ` / 最新 ${props.systemLatestVersion}`
          : ''}
      </div>
      <div>页面来源: {props.pageSource || 'N/A'}</div>
    </footer>
  )
}

function UpdateReleaseDialog(props: {
  onClose: () => void
  release: { repo: UpdateRepo; title: string; version: string } | null
}) {
  const releaseQuery = useQuery({
    enabled: Boolean(props.release),
    queryFn: () => {
      if (!props.release) throw new Error('Missing release')
      return getReleaseDetails(props.release.repo, props.release.version)
    },
    queryKey: [
      'dashboard',
      'release-detail',
      props.release?.repo,
      props.release?.version,
    ],
    retry: false,
  })
  const details = releaseQuery.data

  return (
    <Dialog.Root
      onOpenChange={(open) => !open && props.onClose()}
      open={Boolean(props.release)}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Popup className="outline-hidden fixed left-1/2 top-1/2 z-50 flex max-h-[min(86vh,42rem)] w-[min(92vw,40rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
            <Dialog.Title className="min-w-0 truncate text-base font-semibold text-neutral-950 dark:text-neutral-50">
              {props.release?.title || '更新详情'}
            </Dialog.Title>
            <Dialog.Close className="inline-flex size-8 items-center justify-center rounded text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-900 dark:hover:text-neutral-100">
              <X aria-hidden="true" className="size-4" />
            </Dialog.Close>
          </div>
          <Scroll className="min-h-0 flex-1" innerClassName="p-4">
            {releaseQuery.isLoading ? (
              <div className="py-10 text-center text-sm text-neutral-500">
                正在获取更新详情...
              </div>
            ) : details ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">
                      {details.name || details.tagName}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                      <span className="rounded border border-neutral-200 px-2 py-0.5 dark:border-neutral-800">
                        {details.tagName}
                      </span>
                      <span>
                        发布于 {formatDateTime(details.publishedAt || '')}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => window.open(details.htmlUrl, '_blank')}
                    type="button"
                    variant="subtle"
                  >
                    <ExternalLink aria-hidden="true" className="size-4" />在
                    GitHub 查看
                  </Button>
                </div>
                {details.body ? (
                  <MarkdownRender
                    className="rounded border border-neutral-100 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50"
                    text={details.body}
                  />
                ) : (
                  <div className="py-8 text-center text-sm text-neutral-500">
                    此版本没有发布说明。
                  </div>
                )}
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-neutral-500">
                无法获取更新详情
              </div>
            )}
          </Scroll>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function DashboardUpgradeDialog(props: { onClose: () => void; open: boolean }) {
  const [output, setOutput] = useState('')
  const [running, setRunning] = useState(false)
  const outputRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!props.open) return

    setOutput('')
    setRunning(true)

    const source = new EventSourcePolyfill(
      `${API_URL}/update/upgrade/dashboard`,
      {
        withCredentials: true,
      },
    )

    source.onmessage = (event) => {
      setOutput((value) => `${value}${event.data}\n`)
    }
    source.onerror = (event) => {
      const errorEvent = event as unknown as { data?: string }
      source.close()
      setRunning(false)

      if (errorEvent.data) {
        toast.error(errorEvent.data)
        return
      }

      setOutput((value) => `${value}\nDone.\n`)
      window.setTimeout(() => {
        window.location.reload()
      }, 1500)
    }

    return () => {
      source.close()
      setRunning(false)
    }
  }, [props.open])

  useEffect(() => {
    const element = outputRef.current
    if (!element) return

    element.scrollTop = element.scrollHeight
  }, [output])

  return (
    <Dialog.Root
      onOpenChange={(open) => !open && props.onClose()}
      open={props.open}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/45" />
        <Dialog.Popup className="outline-hidden fixed left-1/2 top-1/2 z-50 flex h-[min(82vh,42rem)] w-[min(92vw,46rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
            <Dialog.Title className="text-base font-semibold text-neutral-950 dark:text-neutral-50">
              面板更新输出
            </Dialog.Title>
            <div className="flex items-center gap-2">
              {running ? (
                <span className="text-xs text-neutral-500">运行中...</span>
              ) : null}
              <Dialog.Close className="inline-flex size-8 items-center justify-center rounded text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-900 dark:hover:text-neutral-100">
                <X aria-hidden="true" className="size-4" />
              </Dialog.Close>
            </div>
          </div>
          <Scroll
            className="min-h-0 flex-1 bg-neutral-950"
            innerClassName="p-4"
            ref={outputRef}
          >
            <pre className="whitespace-pre-wrap break-all font-mono text-xs leading-5 text-neutral-100">
              {output || '正在连接更新服务...'}
            </pre>
          </Scroll>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
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

function formatSearchIndexStats(result: {
  created: number
  deleted: number
  skipped: number
  total: number
  updated: number
}) {
  return `共 ${result.total}：新建 ${result.created} · 更新 ${result.updated} · 删除 ${result.deleted} · 跳过 ${result.skipped}`
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

function readClosedUpdateTips() {
  try {
    return {
      dashboard: null,
      system: null,
      ...(JSON.parse(localStorage.getItem('closed-tips') || '{}') as {
        dashboard?: null | string
        system?: null | string
      }),
    }
  } catch {
    return {
      dashboard: null,
      system: null,
    }
  }
}

function writeClosedUpdateTip(type: 'dashboard' | 'system', version: string) {
  const tips = readClosedUpdateTips()
  localStorage.setItem(
    'closed-tips',
    JSON.stringify({
      ...tips,
      [type]: version,
    }),
  )
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}
