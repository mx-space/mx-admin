import {
  Activity as ActivityIcon,
  Link as AddLinkFilledIcon,
  ChartScatter as BubbleChartFilledIcon,
  MessageCircle as ChatbubblesSharpIcon,
  Code as CodeIcon,
  MessageSquare as CommentIcon,
  MessagesSquare as CommentsIcon,
  Puzzle as ExtensionIcon,
  File as FileIcon,
  UserRound as GuestIcon,
  Heart as HeartIcon,
  Link as LinkIcon,
  BookOpen as NotebookMinimalistic,
  StickyNote as NoteIcon,
  Radio as OnlinePredictionFilledIcon,
  Pencil as PencilIcon,
  AlignLeft as PhAlignLeft,
  RefreshCw as RefreshIcon,
  TrendingUp as TrendingUpIcon,
} from 'lucide-vue-next'
import {
  NButton,
  NElement,
  NGi,
  NGrid,
  NH1,
  NIcon,
  NP,
  useMessage,
  useNotification,
} from 'naive-ui'
import {
  defineComponent,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  ref,
  watchEffect,
} from 'vue'
import { useRouter } from 'vue-router'
import type { Stat } from '~/models/stat'
import type { PropType, VNode } from 'vue'

import { Icon } from '@vicons/utils'

import { IpInfoPopover } from '~/components/ip-info'
import { useShorthand } from '~/components/shorthand'
import { useUpdateDetailModal } from '~/components/update-detail-modal'
import { checkUpdateFromGitHub } from '~/external/api/github-check-update'
import { usePortalElement } from '~/hooks/use-portal-element'
import { useStoreRef } from '~/hooks/use-store-ref'
import { useLayout } from '~/layouts/content'
import { RouteName } from '~/router/name'
import { AppStore } from '~/stores/app'
import { UserStore } from '~/stores/user'
import { parseDate, RESTManager } from '~/utils'
import { isNewerVersion } from '~/utils/version'

import PKG from '../../../package.json'
import { CategoryPie } from './components/CategoryPie'
import { CommentActivity } from './components/CommentActivity'
import { PublicationTrend } from './components/PublicationTrend'
import { TagCloud } from './components/TagCloud'
import { TopArticles } from './components/TopArticles'
import { TrafficSource } from './components/TrafficSource'
import { UpdatePanel } from './update-panel'

// 分区标题组件
const SectionTitle = defineComponent({
  props: {
    title: { type: String, required: true },
    extra: { type: Object as PropType<VNode> },
  },
  setup(props, { slots }) {
    return () => (
      <div class="mb-4">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-medium text-neutral-700 dark:text-neutral-300">
            {props.title}
          </h3>
          {slots.extra?.() || props.extra}
        </div>
        <div class="mt-2 h-px bg-neutral-200 dark:bg-neutral-700" />
      </div>
    )
  },
})

// 实时数据项 - 扁平设计
const LiveStatItem = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: [Number, String], required: true },
    icon: { type: Object as PropType<VNode>, required: true },
    isLive: { type: Boolean, default: false },
  },
  setup(props) {
    return () => (
      <div class="flex items-center gap-4 rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800/50">
        <div class="relative shrink-0">
          {props.isLive && (
            <span class="absolute -right-1 -top-1 flex h-2.5 w-2.5">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
            </span>
          )}
          <Icon class="text-2xl text-neutral-400">{props.icon}</Icon>
        </div>
        <div>
          <div class="text-2xl font-semibold tabular-nums">
            {typeof props.value === 'number'
              ? Intl.NumberFormat('en-us').format(props.value)
              : props.value}
          </div>
          <div class="text-xs text-neutral-500">{props.label}</div>
        </div>
      </div>
    )
  },
})

// 简洁统计项 - 无边框设计
const StatItem = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: [Number, String], required: true },
    icon: { type: Object as PropType<VNode> },
    onClick: { type: Function as PropType<() => void> },
  },
  setup(props) {
    return () => (
      <div
        class={[
          'flex items-center gap-3 rounded-md p-3 transition-colors',
          props.onClick
            ? 'cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800'
            : '',
        ]}
        onClick={props.onClick}
      >
        {props.icon && (
          <Icon class="shrink-0 text-lg text-neutral-400">{props.icon}</Icon>
        )}
        <div class="min-w-0 flex-1">
          <div class="truncate text-xs text-neutral-500">{props.label}</div>
          <div class="text-lg font-medium tabular-nums">
            {typeof props.value === 'number'
              ? Intl.NumberFormat('en-us').format(props.value)
              : props.value}
          </div>
        </div>
      </div>
    )
  },
})

interface ActionItem {
  name: string
  primary?: boolean
  onClick: () => void
}

// 带操作按钮的统计项 - 扁平设计
const ActionStatItem = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: [Number, String], required: true },
    icon: { type: Object as PropType<VNode> },
    actions: { type: Array as PropType<ActionItem[]>, default: () => [] },
  },
  setup(props) {
    return () => (
      <div class="rounded-md p-3">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0 flex-1">
            <div class="text-xs text-neutral-500">{props.label}</div>
            <div class="mt-1 text-2xl font-semibold tabular-nums">
              {typeof props.value === 'number'
                ? Intl.NumberFormat('en-us').format(props.value)
                : props.value}
            </div>
          </div>
          {props.icon && (
            <Icon class="mt-1 shrink-0 text-xl text-neutral-400">
              {props.icon}
            </Icon>
          )}
        </div>
        {props.actions.length > 0 && (
          <div class="mt-3 flex items-center gap-2">
            {props.actions.map((action, index) => (
              <NButton
                key={index}
                size="small"
                type={action.primary ? 'primary' : 'default'}
                secondary={!action.primary}
                onClick={action.onClick}
              >
                {action.name}
              </NButton>
            ))}
          </div>
        )}
      </div>
    )
  },
})

const RedisIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="m10.5 2.661l.54.997l-1.797.644l2.409.218l.748 1.246l.467-1.121l2.077-.208l-1.61-.613l.426-1.017l-1.578.519zm6.905 2.077L13.76 6.182l3.292 1.298l.353-.146l3.293-1.298zm-10.51.312a2.97 1.153 0 0 0-2.97 1.152a2.97 1.153 0 0 0 2.97 1.153a2.97 1.153 0 0 0 2.97-1.153a2.97 1.153 0 0 0-2.97-1.152zM24 6.805s-8.983 4.278-10.395 4.953c-1.226.561-1.901.561-3.261.094C8.318 11.022 0 7.241 0 7.241v1.038c0 .24.332.499.966.8c1.277.613 8.34 3.677 9.45 4.206c1.112.53 1.9.54 3.313-.197c1.412-.738 8.049-3.905 9.326-4.57c.654-.342.945-.602.945-.84zm-10.042.602L8.39 8.26l3.884 1.61zM24 10.637s-8.983 4.279-10.395 4.954c-1.226.56-1.901.56-3.261.093C8.318 14.854 0 11.074 0 11.074v1.038c0 .238.332.498.966.8c1.277.612 8.34 3.676 9.45 4.205c1.112.53 1.9.54 3.313-.197c1.412-.737 8.049-3.905 9.326-4.57c.654-.332.945-.602.945-.84zm0 3.842l-10.395 4.954c-1.226.56-1.901.56-3.261.094C8.318 18.696 0 14.916 0 14.916v1.038c0 .239.332.499.966.8c1.277.613 8.34 3.676 9.45 4.206c1.112.53 1.9.54 3.313-.198c1.412-.737 8.049-3.904 9.326-4.569c.654-.343.945-.613.945-.841z"
    />
  </svg>
)

export const DashBoardView = defineComponent({
  name: 'DashboardView',

  setup() {
    const { setHideHeader } = useLayout()
    setHideHeader(true)

    const stat = ref(
      new Proxy(
        {},
        {
          get() {
            return 'N/A'
          },
        },
      ) as Stat,
    )
    const statTime = ref(null as unknown as Date)
    const fetchStat = async () => {
      const counts = (await RESTManager.api.aggregate.stat.get()) as any
      stat.value = counts
      statTime.value = new Date()
    }

    const siteWordCount = ref(0)
    const readAndLikeCounts = ref({
      totalLikes: 0,
      totalReads: 0,
      siteLikeCount: 0,
    })
    const fetchSiteWordCount = async () => {
      return await RESTManager.api.aggregate.count_site_words.get<{
        data: { length: number }
      }>()
    }

    const fetchReadAndLikeCounts = async () => {
      return await RESTManager.api.aggregate.count_read_and_like.get<{
        totalLikes: number
        totalReads: number
      }>()
    }

    const fetchSiteLikeCount = async () => {
      return await RESTManager.api('like_this').get<number>()
    }

    onMounted(async () => {
      const [c, rl, sl] = await Promise.all([
        fetchSiteWordCount(),
        fetchReadAndLikeCounts(),
        fetchSiteLikeCount(),
      ])
      siteWordCount.value = c.data.length

      readAndLikeCounts.value = {
        totalLikes: rl.totalLikes,
        totalReads: rl.totalReads,
        siteLikeCount: sl,
      }
    })

    // 轮询状态计时器
    let timer: any
    onMounted(() => {
      timer = setInterval(() => {
        fetchStat()
      }, 3000)
    })
    onBeforeUnmount(() => {
      timer = clearTimeout(timer)
    })

    onBeforeMount(() => {
      fetchStat()
    })

    const message = useMessage()

    const userStore = useStoreRef(UserStore)
    const router = useRouter()

    const { create: createShortHand } = useShorthand()

    // 渲染用户登录信息
    const renderUserLoginStat = () => (
      <div class="mt-8 text-sm text-neutral-500">
        <p>
          上次登录 IP:{' '}
          {userStore.user.value?.lastLoginIp ? (
            <IpInfoPopover
              trigger="hover"
              triggerEl={
                <span class="text-neutral-700 dark:text-neutral-300">
                  {userStore.user.value?.lastLoginIp}
                </span>
              }
              ip={userStore.user.value?.lastLoginIp}
            />
          ) : (
            'N/A'
          )}
        </p>
        <p class="mt-1">
          上次登录时间:{' '}
          {userStore.user.value?.lastLoginTime ? (
            <time class="text-neutral-700 dark:text-neutral-300">
              {parseDate(
                userStore.user.value?.lastLoginTime,
                'yyyy 年 M 月 d 日 HH:mm:ss',
              )}
            </time>
          ) : (
            'N/A'
          )}
        </p>
      </div>
    )

    return () => (
      <>
        <NH1 class="!mb-6 font-light">欢迎回来</NH1>

        {/* 实时数据区 */}
        <section class="mb-8">
          <SectionTitle title="实时数据" />
          <NGrid xGap={12} yGap={12} cols="1 500:3">
            <NGi>
              <LiveStatItem
                label="当前在线访客"
                value={stat.value.online}
                icon={<OnlinePredictionFilledIcon />}
                isLive
              />
            </NGi>
            <NGi>
              <LiveStatItem
                label="今日访客"
                value={stat.value.todayOnlineTotal}
                icon={<GuestIcon />}
              />
            </NGi>
            <NGi>
              <LiveStatItem
                label="今日最高在线"
                value={stat.value.todayMaxOnline}
                icon={<TrendingUpIcon />}
              />
            </NGi>
          </NGrid>
        </section>

        {/* 快速操作区 */}
        <section class="mb-8">
          <SectionTitle title="快速操作" />
          <div class="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
            <ActionStatItem
              label="博文"
              value={stat.value.posts}
              icon={<CodeIcon />}
              actions={[
                {
                  name: '撰写',
                  primary: true,
                  onClick: () => router.push({ name: RouteName.EditPost }),
                },
                {
                  name: '管理',
                  onClick: () =>
                    router.push({
                      name: RouteName.ViewPost,
                      query: { page: 1 },
                    }),
                },
              ]}
            />
            <ActionStatItem
              label="日记"
              value={stat.value.notes}
              icon={<NoteIcon />}
              actions={[
                {
                  name: '撰写',
                  primary: true,
                  onClick: () => router.push({ name: RouteName.EditNote }),
                },
                {
                  name: '管理',
                  onClick: () =>
                    router.push({
                      name: RouteName.ViewNote,
                      query: { page: 1 },
                    }),
                },
              ]}
            />
            <ActionStatItem
              label="速记"
              value={stat.value.recently}
              icon={<PencilIcon />}
              actions={[
                {
                  name: '记点啥',
                  primary: true,
                  onClick: () => createShortHand(),
                },
                {
                  name: '管理',
                  onClick: () =>
                    router.push({
                      name: RouteName.ListShortHand,
                      query: { page: 1 },
                    }),
                },
              ]}
            />
            <ActionStatItem
              label="说说"
              value={stat.value.says}
              icon={<CommentsIcon />}
              actions={[
                {
                  name: '说一句',
                  primary: true,
                  onClick: () => router.push({ name: RouteName.EditSay }),
                },
                {
                  name: '管理',
                  onClick: () => router.push({ name: RouteName.ListSay }),
                },
              ]}
            />
          </div>
        </section>

        {/* 数据统计区 - 扁平网格 */}
        <section class="mb-8">
          <SectionTitle
            title="数据统计"
            v-slots={{
              extra: () => (
                <div class="flex items-center text-xs text-neutral-400">
                  <span>
                    更新于{' '}
                    {statTime.value
                      ? parseDate(statTime.value, 'H:mm:ss A')
                      : '--:--:--'}
                  </span>
                  <NButton text onClick={fetchStat} class="ml-2">
                    <NIcon size={14}>
                      <RefreshIcon />
                    </NIcon>
                  </NButton>
                </div>
              ),
            }}
          />
          <div class="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            <StatItem
              label="页面"
              value={stat.value.pages}
              icon={<FileIcon />}
              onClick={() =>
                router.push({ name: RouteName.ListPage, query: { page: 1 } })
              }
            />
            <StatItem
              label="分类"
              value={stat.value.categories}
              icon={<ExtensionIcon />}
              onClick={() => router.push({ name: RouteName.EditCategory })}
            />
            <StatItem
              label="全部评论"
              value={stat.value.allComments}
              icon={<CommentIcon />}
              onClick={() =>
                router.push({ name: RouteName.Comment, query: { state: 1 } })
              }
            />
            <StatItem
              label="未读评论"
              value={stat.value.unreadComments}
              icon={<ChatbubblesSharpIcon />}
              onClick={() =>
                router.push({ name: RouteName.Comment, query: { state: 0 } })
              }
            />
            <StatItem
              label="友链"
              value={stat.value.links}
              icon={<LinkIcon />}
              onClick={() =>
                router.push({ name: RouteName.Friend, query: { state: 0 } })
              }
            />
            <StatItem
              label="友链申请"
              value={stat.value.linkApply}
              icon={<AddLinkFilledIcon />}
              onClick={() =>
                router.push({ name: RouteName.Friend, query: { state: 1 } })
              }
            />
            <StatItem
              label="API 调用"
              value={stat.value.callTime}
              icon={<ActivityIcon />}
              onClick={() => router.push({ name: RouteName.Analyze })}
            />
            <StatItem
              label="今日 IP 访问"
              value={stat.value.todayIpAccessCount}
              icon={<BubbleChartFilledIcon />}
              onClick={() => router.push({ name: RouteName.Analyze })}
            />
            <StatItem
              label="全站字符数"
              value={siteWordCount.value}
              icon={<PhAlignLeft />}
            />
            <StatItem
              label="总阅读量"
              value={readAndLikeCounts.value.totalReads}
              icon={<NotebookMinimalistic />}
            />
            <StatItem
              label="文章点赞"
              value={readAndLikeCounts.value.totalLikes}
              icon={<HeartIcon />}
            />
            <StatItem
              label="站点点赞"
              value={readAndLikeCounts.value.siteLikeCount}
              icon={<HeartIcon />}
            />
          </div>
        </section>

        {/* 数据图表区 */}
        <section class="mb-8">
          <SectionTitle title="数据图表" />
          <NGrid xGap={16} yGap={16} cols="1 800:2">
            <NGi>
              <PublicationTrend />
            </NGi>
            <NGi>
              <CategoryPie />
            </NGi>
            <NGi>
              <CommentActivity />
            </NGi>
            <NGi>
              <TrafficSource />
            </NGi>
            <NGi>
              <TopArticles />
            </NGi>
            <NGi>
              <TagCloud />
            </NGi>
          </NGrid>
        </section>

        {/* 系统操作 */}
        <section class="mb-8">
          <SectionTitle title="系统操作" />
          <div class="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4 lg:grid-cols-6">
            <ActionStatItem
              label="缓存"
              value="Redis"
              icon={<RedisIcon />}
              actions={[
                {
                  name: '清除 API 缓存',
                  onClick: () => {
                    RESTManager.api.clean_catch.get().then(() => {
                      message.success('清除成功')
                    })
                  },
                },
                {
                  name: '清除数据缓存',
                  onClick: () => {
                    RESTManager.api.clean_redis.get().then(() => {
                      message.success('清除成功')
                    })
                  },
                },
              ]}
            />
          </div>
        </section>

        {renderUserLoginStat()}
        <AppIF />
      </>
    )
  },
})

const AppIF = defineComponent({
  setup() {
    const { app } = useStoreRef(AppStore)
    const notice = useNotification()
    const versionMap = ref({} as { admin: string; system: string })
    const closedTips = useStorage('closed-tips', {
      dashboard: null as string | null,
      system: null as string | null,
    })

    const { openModal: openUpdateModal, Modal: UpdateDetailModal } =
      useUpdateDetailModal()

    const portal = usePortalElement()
    const handleUpdate = () => {
      portal(<UpdatePanel />)
    }
    onMounted(async () => {
      if (__DEV__) {
        return
      }
      if (app.value?.version.startsWith('demo')) {
        return
      }

      const { dashboard, system } = await checkUpdateFromGitHub()

      if (
        isNewerVersion(PKG.version, dashboard) &&
        closedTips.value.dashboard !== dashboard
      ) {
        const $notice = notice.info({
          title: '[管理中台] 有新版本啦！',
          content: () => (
            <div>
              <p>{`当前版本：${PKG.version}，最新版本：${dashboard}`}</p>
              <div class={'space-x-2 text-right'}>
                <NButton
                  size="small"
                  onClick={() => {
                    openUpdateModal({
                      version: dashboard,
                      repo: 'mx-admin',
                      title: '[管理中台] 更新详情',
                    })
                  }}
                >
                  查看详情
                </NButton>
                <NButton
                  type="primary"
                  size="small"
                  onClick={() => {
                    handleUpdate()
                    $notice.destroy()
                  }}
                >
                  更更更！
                </NButton>
              </div>
            </div>
          ),
          closable: true,
          onClose: () => {
            closedTips.value.dashboard = dashboard
          },
        })
      }

      versionMap.value = {
        admin: dashboard,
        system,
      }
    })

    watchEffect(() => {
      if (__DEV__) {
        return
      }

      if (app.value?.version.startsWith('demo')) {
        notice.info({
          title: 'Demo Mode',
          content: '当前处于 Demo 模式，部分功能不可用',
        })
        return
      }

      if (
        app.value?.version &&
        app.value.version !== 'dev' &&
        versionMap.value.system &&
        closedTips.value.system !== versionMap.value.system &&
        isNewerVersion(app.value.version, versionMap.value.system)
      ) {
        notice.info({
          title: '[系统] 有新版本啦！',
          content: () => (
            <div>
              <p>{`当前版本：${app.value?.version || 'N/A'}，最新版本：${versionMap.value.system}`}</p>
              <div class={'space-x-2 text-right'}>
                <NButton
                  size="small"
                  onClick={() => {
                    openUpdateModal({
                      version: versionMap.value.system,
                      repo: 'mx-server',
                      title: '[系统] 更新详情',
                    })
                  }}
                >
                  查看详情
                </NButton>
              </div>
            </div>
          ),
          closable: true,
          onClose: () => {
            closedTips.value.system = versionMap.value.system
          },
        })
      }
    })

    return () => (
      <>
        <NElement tag="footer" class="mt-12">
          <NP
            class="text-center"
            style={{ color: 'var(--text-color-3)' }}
            depth="1"
          >
            <div class={'inline-flex items-center'}>
              面板版本: {__DEV__ ? 'dev mode' : window.version || 'N/A'}
              <NButton text onClick={handleUpdate} size="small" class={'ml-4'}>
                <NIcon size={12}>
                  <RefreshIcon />
                </NIcon>
              </NButton>
            </div>
            <br />
            系统版本：{app.value?.version || 'N/A'}
            <br />
            页面来源：{window.pageSource || ''}
          </NP>
        </NElement>
        <UpdateDetailModal />
      </>
    )
  },
})
