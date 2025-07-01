import { pick } from 'es-toolkit/compat'
import {
  NButton,
  NCard,
  NElement,
  NGi,
  NGrid,
  NH1,
  NH3,
  NH4,
  NIcon,
  NP,
  NPopover,
  NSpace,
  NText,
  useMessage,
  useNotification,
} from 'naive-ui'
import {
  computed,
  defineComponent,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  ref,
  watchEffect,
} from 'vue'
import { useRouter } from 'vue-router'
import type { ShiJuData } from '~/external/api/jinrishici'
import type { Stat } from '~/models/stat'
import type { CardProps } from './card'

import { Icon } from '@vicons/utils'

import {
  ActivityIcon,
  AddLinkFilledIcon,
  BubbleChartFilledIcon,
  ChatbubblesSharpIcon,
  CodeIcon,
  CommentIcon,
  CommentsIcon,
  CopyIcon,
  ExtensionIcon,
  FileIcon,
  GamesIcon,
  GuestIcon,
  HeartIcon,
  LinkIcon,
  NotebookMinimalistic,
  NoteIcon,
  OnlinePredictionFilledIcon,
  PencilIcon,
  PhAlignLeft,
  RedisIcon,
  RefreshIcon,
} from '~/components/icons'
import { IpInfoPopover } from '~/components/ip-info'
import { useShorthand } from '~/components/shorthand'
import { useUpdateDetailModal } from '~/components/update-detail-modal'
import { checkUpdateFromGitHub } from '~/external/api/github-check-update'
import { fetchHitokoto, SentenceType } from '~/external/api/hitokoto'
import { getJinRiShiCiOne } from '~/external/api/jinrishici'
import { usePortalElement } from '~/hooks/use-portal-element'
import { useStoreRef } from '~/hooks/use-store-ref'
import { ContentLayout } from '~/layouts/content'
import { RouteName } from '~/router/name'
import { AppStore } from '~/stores/app'
import { UserStore } from '~/stores/user'
import { parseDate, RESTManager } from '~/utils'

import PKG from '../../../package.json'
import { Card } from './card'
import { UpdatePanel } from './update-panel'

export const DashBoardView = defineComponent({
  name: 'DashboardView',

  setup() {
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

    const refreshHitokoto = () => {
      fetchHitokoto([
        SentenceType.动画,
        SentenceType.原创,
        SentenceType.哲学,
        SentenceType.文学,
      ]).then((data) => {
        const postfix = Object.values(
          pick(data, ['from', 'from_who', 'creator']),
        ).find(Boolean)
        if (!data.hitokoto) {
          hitokoto.value = '没有获取到句子信息'
        } else {
          hitokoto.value = data.hitokoto + (postfix ? ` —— ${postfix}` : '')
        }
      })
    }

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

    const shiju = ref('')
    const shijuData = ref<ShiJuData | null>(null)

    onBeforeMount(() => {
      refreshHitokoto()
      fetchStat()

      getJinRiShiCiOne().then((data) => {
        shiju.value = data.content
        shijuData.value = data
      })
    })

    const hitokoto = ref('')
    const message = useMessage()

    const userStore = useStoreRef(UserStore)
    const router = useRouter()
    const UserLoginStat = defineComponent(() => () => (
      <>
        <NH3 class="font-light text-opacity-80">登录记录</NH3>
        <p class="relative -mt-2 mb-3 text-gray-500">
          <span>
            上次登录 IP:{' '}
            {userStore.user.value?.lastLoginIp ? (
              <IpInfoPopover
                trigger="hover"
                triggerEl={<span>{userStore.user.value?.lastLoginIp}</span>}
                ip={userStore.user.value?.lastLoginIp}
              ></IpInfoPopover>
            ) : (
              'N/A'
            )}
          </span>
          <div class="pt-[.5rem]"></div>
          <span>
            上次登录时间:{' '}
            {userStore.user.value?.lastLoginTime ? (
              <time>
                {parseDate(
                  userStore.user.value?.lastLoginTime,
                  'yyyy 年 M 月 d 日 HH:mm:ss',
                )}
              </time>
            ) : (
              'N/A'
            )}
          </span>
        </p>

        <div class="pb-4"></div>
      </>
    ))

    const { create: createShortHand } = useShorthand()

    const dataStat = computed<CardProps[]>(() => [
      {
        label: '博文',
        value: stat.value.posts,
        icon: <CodeIcon />,
        actions: [
          {
            name: '撰写',
            primary: true,
            onClick() {
              router.push({ name: RouteName.EditPost })
            },
          },
          {
            name: '管理',
            onClick() {
              router.push({ name: RouteName.ViewPost, query: { page: 1 } })
            },
          },
        ],
      },

      {
        label: '日记',
        value: stat.value.notes,
        icon: <NoteIcon />,
        actions: [
          {
            name: '撰写',
            primary: true,
            onClick() {
              router.push({ name: RouteName.EditNote })
            },
          },
          {
            name: '管理',
            onClick() {
              router.push({ name: RouteName.ViewNote, query: { page: 1 } })
            },
          },
        ],
      },

      {
        label: '页面',
        value: stat.value.pages,
        icon: <FileIcon />,
        actions: [
          {
            primary: true,
            name: '管理',
            onClick() {
              router.push({ name: RouteName.ListPage, query: { page: 1 } })
            },
          },
        ],
      },
      {
        label: '速记',
        value: stat.value.recently,
        icon: <PencilIcon />,
        actions: [
          {
            primary: true,
            name: '记点啥',

            onClick() {
              createShortHand()
            },
          },
          {
            name: '管理',
            onClick() {
              router.push({ name: RouteName.ListShortHand, query: { page: 1 } })
            },
          },
        ],
      },

      {
        label: '分类',
        value: stat.value.categories,
        icon: <ExtensionIcon />,
        actions: [
          {
            primary: true,
            name: '管理',
            onClick() {
              router.push({ name: RouteName.EditCategory })
            },
          },
        ],
      },

      {
        label: '全部评论',
        value: stat.value.allComments,
        icon: <CommentIcon />,
        actions: [
          {
            primary: true,
            name: '管理',
            onClick() {
              router.push({ name: RouteName.Comment, query: { state: 1 } })
            },
          },
        ],
      },
      {
        label: '未读评论',
        value: stat.value.unreadComments,
        icon: <ChatbubblesSharpIcon />,
        actions: [
          {
            primary: true,
            showBadage: true,
            name: '查看',
            onClick() {
              router.push({ name: RouteName.Comment, query: { state: 0 } })
            },
          },
        ],
      },

      {
        label: '友链',
        value: stat.value.links,
        icon: <LinkIcon />,
        actions: [
          {
            primary: true,
            name: '管理',
            onClick() {
              router.push({ name: RouteName.Friend, query: { state: 0 } })
            },
          },
        ],
      },
      {
        label: '新的友链申请',
        value: stat.value.linkApply,
        icon: <AddLinkFilledIcon />,
        actions: [
          {
            primary: true,
            showBadage: true,
            name: '查看',
            onClick() {
              router.push({ name: RouteName.Friend, query: { state: 1 } })
            },
          },
        ],
      },

      {
        label: '说说',
        value: stat.value.says,
        icon: <CommentsIcon />,
        actions: [
          {
            primary: true,

            name: '说一句',
            onClick() {
              router.push({
                name: RouteName.EditSay,
              })
            },
          },

          {
            primary: false,
            name: '管理',
            onClick() {
              router.push({
                name: RouteName.ListSay,
              })
            },
          },
        ],
      },
      {
        label: '缓存',
        value: 'Redis',
        icon: <RedisIcon />,
        actions: [
          {
            primary: false,
            name: '清除 API 缓存',
            onClick() {
              RESTManager.api.clean_catch.get().then(() => {
                message.success('清除成功')
              })
            },
          },
          {
            primary: false,
            name: '清除数据缓存',
            onClick() {
              RESTManager.api.clean_redis.get().then(() => {
                message.success('清除成功')
              })
            },
          },
        ],
      },

      {
        label: 'API 总调用次数',
        value: stat.value.callTime,
        icon: <ActivityIcon />,
        actions: [
          {
            primary: true,
            name: '查看',
            onClick() {
              router.push({
                name: RouteName.Analyze,
              })
            },
          },
        ],
      },
      {
        label: '今日 IP 访问次数',
        value: stat.value.todayIpAccessCount,
        icon: <BubbleChartFilledIcon />,
        actions: [
          {
            primary: true,
            name: '查看',
            onClick() {
              router.push({
                name: RouteName.Analyze,
              })
            },
          },
        ],
      },
      {
        label: '全站字符数',
        value: siteWordCount.value,
        icon: <PhAlignLeft />,
      },

      {
        label: '总阅读量',
        value: readAndLikeCounts.value.totalReads,
        icon: <NotebookMinimalistic />,
      },
      {
        label: '文章总点赞数',
        value: readAndLikeCounts.value.totalLikes,
        icon: <HeartIcon />,
      },
      {
        label: '站点总点赞数',
        value: readAndLikeCounts.value.siteLikeCount,
        icon: <HeartIcon />,
      },

      {
        label: '当前在线访客',
        value: stat.value.online,
        icon: <OnlinePredictionFilledIcon />,
      },
      {
        label: '今日访客',
        value: stat.value.todayOnlineTotal,
        icon: <GuestIcon />,
      },
      {
        value: stat.value.todayMaxOnline,
        label: '今日最多同时在线人数',
        icon: <GamesIcon />,
      },
    ])

    const DataStat = defineComponent(() => {
      return () => (
        <>
          <NSpace vertical>
            <NH3 class="font-light text-opacity-80">数据统计</NH3>

            <p class="relative -mt-4 mb-3 flex items-center text-gray-500">
              <span>数据更新于：</span>
              <time>
                {' '}
                {statTime.value
                  ? parseDate(statTime.value, 'yyyy 年 M 月 d 日 HH:mm:ss')
                  : 'N/A'}
              </time>

              <NButton text onClick={fetchStat} class="ml-4">
                <Icon>
                  <RefreshIcon />
                </Icon>
              </NButton>
            </p>
          </NSpace>
          <NGrid
            xGap={20}
            yGap={20}
            cols={'2 100:1 400:2 600:3 900:4 1200:5 1600:6'}
          >
            {dataStat.value.map((props) => (
              <NGi key={props.label}>
                <Card {...props} />
              </NGi>
            ))}
          </NGrid>
        </>
      )
    })
    return () => (
      <ContentLayout>
        <NH1 class="font-light">欢迎回来</NH1>
        <NGrid xGap={12} cols={'1 900:2'}>
          <NGi>
            <NH3 class="!mb-[10px] !mt-[10px] font-light text-opacity-80">
              一言
            </NH3>
            <NP>
              <NSpace align="center" class="min-h-[3rem]">
                {hitokoto.value ? (
                  <>
                    <NText class="leading-normal">{hitokoto.value}</NText>
                    <div class="flex items-center space-x-2">
                      <NButton
                        text
                        onClick={refreshHitokoto}
                        class="phone:float-right ml-0"
                      >
                        <Icon>
                          <RefreshIcon />
                        </Icon>
                      </NButton>

                      <NButton
                        text
                        onClick={() => {
                          navigator.clipboard.writeText(hitokoto.value)
                          message.success('已复制')
                          message.info(hitokoto.value)
                        }}
                      >
                        <Icon>
                          <CopyIcon />
                        </Icon>
                      </NButton>
                    </div>
                  </>
                ) : (
                  <NText>加载中...</NText>
                )}
              </NSpace>
            </NP>
          </NGi>
          <NGi>
            <NH3 class="!mb-[10px] !mt-[10px] font-light text-opacity-80">
              今日诗句
            </NH3>
            <NP>
              <NPopover trigger={'hover'} placement="bottom">
                {{
                  trigger() {
                    return <NText>{shiju.value || '获取中'}</NText>
                  },
                  default() {
                    const origin = shijuData.value?.origin
                    if (!origin) {
                      return null
                    }
                    return (
                      <NCard
                        class="box-border max-h-[60vh] max-w-[65vw] overflow-auto text-center"
                        bordered={false}
                      >
                        <NElement>
                          <NH3
                            class={
                              'sticky top-0 bg-[var(--popover-color)] py-2'
                            }
                          >
                            {origin.title}
                          </NH3>
                        </NElement>
                        <NH4>
                          【{origin.dynasty.replace(/代$/, '')}】{origin.author}
                        </NH4>
                        <div class={'px-6'}>
                          {origin.content.map((c) => (
                            <NP key={c} class="flex">
                              {c}
                            </NP>
                          ))}
                        </div>
                      </NCard>
                    )
                  },
                }}
              </NPopover>
            </NP>
          </NGi>
        </NGrid>
        <UserLoginStat />
        <DataStat />
        <AppIF />
      </ContentLayout>
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

    const { openModal: openUpdateModal, Modal: UpdateDetailModal } = useUpdateDetailModal()

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
        dashboard !== PKG.version &&
        closedTips.value.dashboard !== dashboard
      ) {
        const $notice = notice.info({
          title: '[管理中台] 有新版本啦！',
          content: () => (
            <div>
              <p>{`当前版本：${PKG.version}，最新版本：${dashboard}`}</p>
              <div class={'text-right space-x-2'}>
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
        versionMap.value.system !== app.value.version
      ) {
        notice.info({
          title: '[系统] 有新版本啦！',
          content: () => (
            <div>
              <p>{`当前版本：${app.value?.version || 'N/A'}，最新版本：${versionMap.value.system}`}</p>
              <div class={'text-right space-x-2'}>
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
