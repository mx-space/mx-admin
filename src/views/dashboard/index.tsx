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
  LinkIcon,
  NoteIcon,
  OnlinePredictionFilledIcon,
  PencilIcon,
  RefreshIcon,
} from 'components/icons'
import { IpInfoPopover } from 'components/ip-info'
import { useShorthand } from 'components/shorthand'
import { fetchHitokoto, SentenceType } from 'external/api/hitokoto'
import { getJinRiShiCiOne, ShiJuData } from 'external/api/jinrishici'
import { useInjector } from 'hooks/use-deps-injection'
import { ContentLayout } from 'layouts/content'
import { pick } from 'lodash-es'
import { Stat } from 'models/stat'
import {
  NButton,
  NCard,
  NElement,
  NGi,
  NGrid,
  NH1,
  NH3,
  NP,
  NPopover,
  NSpace,
  NText,
  useMessage,
} from 'naive-ui'
import { RouteName } from 'router/name'
import { AppStore } from 'stores/app'
import { UserStore } from 'stores/user'
import { parseDate, RESTManager } from 'utils'
import { computed, defineComponent, onBeforeMount, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Card, CardProps } from './card'

export const DashBoardView = defineComponent({
  name: 'Dashboard',
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

    const refreshHitokoto = () => {
      fetchHitokoto([
        SentenceType.动画,
        SentenceType.原创,
        SentenceType.哲学,
        SentenceType.文学,
      ]).then((data) => {
        const postfix = Object.values(
          pick(data, ['from', 'from_who', 'creator']),
        ).filter(Boolean)[0]
        if (!data.hitokoto) {
          hitokoto.value = '没有获取到句子信息'
        } else {
          hitokoto.value = data.hitokoto + (postfix ? ' —— ' + postfix : '')
        }
      })
    }

    // 轮询状态计时器
    let timer: any
    onMounted(() => {
      timer = setTimeout(function polling() {
        fetchStat().then(() => {
          timer = setTimeout(polling, 3000)
        })
      }, 3000)
    })
    onUnmounted(() => {
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

    const userStore = useInjector(UserStore)
    const router = useRouter()
    const UserLoginStat = defineComponent(() => () => (
      <>
        <NH3 class="text-opacity-80 font-light">登陆记录</NH3>
        <p class="-mt-2 mb-3 relative text-gray-500">
          <span>
            上次登陆 IP:{' '}
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
            上次登陆时间:{' '}
            {userStore.user.value?.lastLoginTime ? (
              <time>
                {parseDate(
                  userStore.user.value?.lastLoginTime,
                  'yyyy年M月d日 HH:mm:ss',
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
        label: 'API 总调用次数',
        value:
          // @ts-expect-error
          stat.value.callTime !== 'N/A'
            ? Intl.NumberFormat('en-us').format(stat.value.callTime)
            : 'N/A',
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

          {
            name: '清空缓存',
            onClick() {
              RESTManager.api.clean_catch.get().then(() => {
                message.success('清除成功')
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
            <NH3 class="text-opacity-80 font-light">数据统计</NH3>

            <p class="-mt-4 mb-3 relative text-gray-500 flex items-center">
              <span>数据更新于: </span>
              <time>
                {' '}
                {statTime.value
                  ? parseDate(statTime.value, 'yyyy年M月d日 HH:mm:ss')
                  : 'N/A'}
              </time>

              <NButton text onClick={fetchStat} class="ml-4 text-black">
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
            <NH3 class="text-opacity-80 font-light !mt-[10px] !mb-[10px]">
              一言
            </NH3>
            <NP>
              <NSpace align="center" class="min-h-[3rem]">
                {hitokoto.value ? (
                  <>
                    <NText class="leading-normal">{hitokoto.value}</NText>
                    <div class="space-x-2 flex items-center">
                      <NButton
                        text
                        onClick={refreshHitokoto}
                        class="ml-0 phone:float-right"
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
            <NH3 class="text-opacity-80 font-light !mt-[10px] !mb-[10px]">
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
                        class="text-center min-w-[350px] max-w-[65vw] max-h-[60vh] overflow-auto"
                        bordered={false}
                      >
                        <NH3>{origin.title}</NH3>
                        {origin.content.map((c) => (
                          <NP key={c}>{c}</NP>
                        ))}
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
    const { app } = useInjector(AppStore)
    return () => (
      <NElement tag="footer" class="mt-12">
        <NP
          class="text-center"
          style={{ color: 'var(--text-color-3)' }}
          depth="1"
        >
          面板版本: {__DEV__ ? 'dev mode' : window.version || 'N/A'}
          <br />
          系统版本: {app.value?.version || 'N/A'}
          <br />
          页面来源: {window.pageSource || ''}
        </NP>
      </NElement>
    )
  },
})
