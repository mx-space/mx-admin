import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import type { ReleaseModalState } from '../types/dashboard'

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
} from '~/api/aggregate'
import { checkUpdateFromGitHub } from '~/api/github-update'
import { getOwner } from '~/api/options'
import { rebuildSearchIndex } from '~/api/search-index'
import { getAppInfo } from '~/api/system'
import { Button } from '~/ui/button'
import { cn } from '~/ui/cn'
import { Panel } from '~/ui/panel'
import { Scroll } from '~/ui/scroll'
import { isNewerVersion } from '~/utils/version'

import {
  aggregateStatRefetchInterval,
  dashboardQueryKeys,
  defaultStat,
  updateStaleTime,
} from '../constants'
import {
  formatSearchIndexStats,
  getErrorMessage,
  readClosedUpdateTips,
  writeClosedUpdateTip,
} from '../utils/dashboard'
import { ActionCard } from './ActionCard'
import { BarPanel } from './BarPanel'
import { LiveCard, MaintenanceCard, StatCell } from './DashboardPrimitives'
import { DashboardRuntimeFooter } from './DashboardRuntimeFooter'
import { DashboardUpgradeDialog } from './DashboardUpgradeDialog'
import { OwnerLoginStat } from './OwnerLoginStat'
import { SearchIndexRebuildCard } from './SearchIndexRebuildCard'
import { TagCloudPanel } from './TagCloudPanel'
import { TopArticlesPanel } from './TopArticlesPanel'
import { TrafficPanel } from './TrafficPanel'
import { UpdateReleaseDialog } from './UpdateReleaseDialog'

export function DashboardRouteViewContent() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [releaseModal, setReleaseModal] = useState<ReleaseModalState | null>(
    null,
  )
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const notifiedUpdatesRef = useRef(new Set<string>())
  const statQuery = useQuery({
    queryFn: getAggregateStat,
    queryKey: dashboardQueryKeys.aggregateStat,
    refetchInterval: aggregateStatRefetchInterval,
  })
  const stat = statQuery.data ?? defaultStat
  const wordCountQuery = useQuery({
    queryFn: countSiteWords,
    queryKey: dashboardQueryKeys.wordCount,
  })
  const readLikeQuery = useQuery({
    queryFn: countReadAndLike,
    queryKey: dashboardQueryKeys.readLike,
  })
  const siteLikeQuery = useQuery({
    queryFn: getSiteLikeCount,
    queryKey: dashboardQueryKeys.siteLike,
  })
  const ownerQuery = useQuery({
    queryFn: getOwner,
    queryKey: dashboardQueryKeys.owner,
    retry: false,
  })
  const appInfoQuery = useQuery({
    queryFn: getAppInfo,
    queryKey: dashboardQueryKeys.appInfo,
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
    queryKey: dashboardQueryKeys.githubUpdate,
    retry: false,
    staleTime: updateStaleTime,
  })
  const categoryQuery = useQuery({
    queryFn: getCategoryDistribution,
    queryKey: dashboardQueryKeys.categoryDistribution,
  })
  const trendQuery = useQuery({
    queryFn: getPublicationTrend,
    queryKey: dashboardQueryKeys.publicationTrend,
  })
  const tagsQuery = useQuery({
    queryFn: getTagCloud,
    queryKey: dashboardQueryKeys.tagCloud,
  })
  const topArticlesQuery = useQuery({
    queryFn: getTopArticles,
    queryKey: dashboardQueryKeys.topArticles,
  })
  const commentActivityQuery = useQuery({
    queryFn: getCommentActivity,
    queryKey: dashboardQueryKeys.commentActivity,
  })
  const trafficSourceQuery = useQuery({
    queryFn: getTrafficSource,
    queryKey: dashboardQueryKeys.trafficSource,
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
