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
  RedisIcon,
  RefreshIcon,
} from 'components/icons'
import { IpInfoPopover } from 'components/ip-info'
import { ShellOutputNormal } from 'components/output-modal/normal'
import { useShorthand } from 'components/shorthand'
import { checkUpdateFromGitHub } from 'external/api/github-check-update'
import { SentenceType, fetchHitokoto } from 'external/api/hitokoto'
import type { ShiJuData } from 'external/api/jinrishici'
import { getJinRiShiCiOne } from 'external/api/jinrishici'
import { useStoreRef } from 'hooks/use-store-ref'
import { ContentLayout } from 'layouts/content'
import { pick } from 'lodash-es'
import type { Stat } from 'models/stat'
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
import { RouteName } from 'router/name'
import { AppStore } from 'stores/app'
import { UserStore } from 'stores/user'
import { RESTManager, parseDate } from 'utils'
import {
  computed,
  defineComponent,
  onBeforeMount,
  onBeforeUnmount,
  ref,
} from 'vue'
import { useRouter } from 'vue-router'

import { Icon } from '@vicons/utils'

import PKG from '../../../package.json'
import type { CardProps } from './card'
import { Card } from './card'

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

    const refreshHitokoto = () => {
      fetchHitokoto([
        SentenceType.??????,
        SentenceType.??????,
        SentenceType.??????,
        SentenceType.??????,
      ]).then((data) => {
        const postfix = Object.values(
          pick(data, ['from', 'from_who', 'creator']),
        ).filter(Boolean)[0]
        if (!data.hitokoto) {
          hitokoto.value = '???????????????????????????'
        } else {
          hitokoto.value = data.hitokoto + (postfix ? ` ?????? ${postfix}` : '')
        }
      })
    }

    // ?????????????????????
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
        <NH3 class="text-opacity-80 font-light">????????????</NH3>
        <p class="-mt-2 mb-3 relative text-gray-500">
          <span>
            ???????????? IP:{' '}
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
            ??????????????????:{' '}
            {userStore.user.value?.lastLoginTime ? (
              <time>
                {parseDate(
                  userStore.user.value?.lastLoginTime,
                  'yyyy???M???d??? HH:mm:ss',
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
        label: '??????',
        value: stat.value.posts,
        icon: <CodeIcon />,
        actions: [
          {
            name: '??????',
            primary: true,
            onClick() {
              router.push({ name: RouteName.EditPost })
            },
          },
          {
            name: '??????',
            onClick() {
              router.push({ name: RouteName.ViewPost, query: { page: 1 } })
            },
          },
        ],
      },

      {
        label: '??????',
        value: stat.value.notes,
        icon: <NoteIcon />,
        actions: [
          {
            name: '??????',
            primary: true,
            onClick() {
              router.push({ name: RouteName.EditNote })
            },
          },
          {
            name: '??????',
            onClick() {
              router.push({ name: RouteName.ViewNote, query: { page: 1 } })
            },
          },
        ],
      },

      {
        label: '??????',
        value: stat.value.pages,
        icon: <FileIcon />,
        actions: [
          {
            primary: true,
            name: '??????',
            onClick() {
              router.push({ name: RouteName.ListPage, query: { page: 1 } })
            },
          },
        ],
      },
      {
        label: '??????',
        value: stat.value.recently,
        icon: <PencilIcon />,
        actions: [
          {
            primary: true,
            name: '?????????',

            onClick() {
              createShortHand()
            },
          },
          {
            name: '??????',
            onClick() {
              router.push({ name: RouteName.ListShortHand, query: { page: 1 } })
            },
          },
        ],
      },

      {
        label: '??????',
        value: stat.value.categories,
        icon: <ExtensionIcon />,
        actions: [
          {
            primary: true,
            name: '??????',
            onClick() {
              router.push({ name: RouteName.EditCategory })
            },
          },
        ],
      },

      {
        label: '????????????',
        value: stat.value.allComments,
        icon: <CommentIcon />,
        actions: [
          {
            primary: true,
            name: '??????',
            onClick() {
              router.push({ name: RouteName.Comment, query: { state: 1 } })
            },
          },
        ],
      },
      {
        label: '????????????',
        value: stat.value.unreadComments,
        icon: <ChatbubblesSharpIcon />,
        actions: [
          {
            primary: true,
            showBadage: true,
            name: '??????',
            onClick() {
              router.push({ name: RouteName.Comment, query: { state: 0 } })
            },
          },
        ],
      },

      {
        label: '??????',
        value: stat.value.links,
        icon: <LinkIcon />,
        actions: [
          {
            primary: true,
            name: '??????',
            onClick() {
              router.push({ name: RouteName.Friend, query: { state: 0 } })
            },
          },
        ],
      },
      {
        label: '??????????????????',
        value: stat.value.linkApply,
        icon: <AddLinkFilledIcon />,
        actions: [
          {
            primary: true,
            showBadage: true,
            name: '??????',
            onClick() {
              router.push({ name: RouteName.Friend, query: { state: 1 } })
            },
          },
        ],
      },

      {
        label: '??????',
        value: stat.value.says,
        icon: <CommentsIcon />,
        actions: [
          {
            primary: true,

            name: '?????????',
            onClick() {
              router.push({
                name: RouteName.EditSay,
              })
            },
          },

          {
            primary: false,
            name: '??????',
            onClick() {
              router.push({
                name: RouteName.ListSay,
              })
            },
          },
        ],
      },
      {
        label: '??????',
        value: 'Redis',
        icon: <RedisIcon />,
        actions: [
          {
            primary: false,
            name: '?????? API ??????',
            onClick() {
              RESTManager.api.clean_catch.get().then(() => {
                message.success('????????????')
              })
            },
          },
          {
            primary: false,
            name: '??????????????????',
            onClick() {
              RESTManager.api.clean_redis.get().then(() => {
                message.success('????????????')
              })
            },
          },
        ],
      },

      {
        label: 'API ???????????????',
        value:
          // @ts-expect-error
          stat.value.callTime !== 'N/A'
            ? Intl.NumberFormat('en-us').format(stat.value.callTime)
            : 'N/A',
        icon: <ActivityIcon />,
        actions: [
          {
            primary: true,
            name: '??????',
            onClick() {
              router.push({
                name: RouteName.Analyze,
              })
            },
          },
        ],
      },
      {
        label: '?????? IP ????????????',
        value: stat.value.todayIpAccessCount,
        icon: <BubbleChartFilledIcon />,
        actions: [
          {
            primary: true,
            name: '??????',
            onClick() {
              router.push({
                name: RouteName.Analyze,
              })
            },
          },
        ],
      },

      {
        label: '??????????????????',
        value: stat.value.online,
        icon: <OnlinePredictionFilledIcon />,
      },
      {
        label: '????????????',
        value: stat.value.todayOnlineTotal,
        icon: <GuestIcon />,
      },
      {
        value: stat.value.todayMaxOnline,
        label: '??????????????????????????????',
        icon: <GamesIcon />,
      },
    ])

    const DataStat = defineComponent(() => {
      return () => (
        <>
          <NSpace vertical>
            <NH3 class="text-opacity-80 font-light">????????????</NH3>

            <p class="-mt-4 mb-3 relative text-gray-500 flex items-center">
              <span>???????????????: </span>
              <time>
                {' '}
                {statTime.value
                  ? parseDate(statTime.value, 'yyyy???M???d??? HH:mm:ss')
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
        <NH1 class="font-light">????????????</NH1>
        <NGrid xGap={12} cols={'1 900:2'}>
          <NGi>
            <NH3 class="text-opacity-80 font-light !mt-[10px] !mb-[10px]">
              ??????
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
                          message.success('?????????')
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
                  <NText>?????????...</NText>
                )}
              </NSpace>
            </NP>
          </NGi>
          <NGi>
            <NH3 class="text-opacity-80 font-light !mt-[10px] !mb-[10px]">
              ????????????
            </NH3>
            <NP>
              <NPopover trigger={'hover'} placement="bottom">
                {{
                  trigger() {
                    return <NText>{shiju.value || '?????????'}</NText>
                  },
                  default() {
                    const origin = shijuData.value?.origin
                    if (!origin) {
                      return null
                    }
                    return (
                      <NCard
                        class="text-center box-border max-w-[65vw] max-h-[60vh] overflow-auto"
                        bordered={false}
                      >
                        <NH3 class={'sticky top-0 bg-white py-2'}>
                          {origin.title}
                        </NH3>
                        <NH4>
                          ???{origin.dynasty.replace(/???$/, '')}???{origin.author}
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
    const handleUpdate = () => {
      $shellRef.value.run(`${RESTManager.endpoint}/update/upgrade/dashboard`)
    }

    onMounted(async () => {
      if (__DEV__) {
        return
      }
      if (app.value?.version.startsWith('demo')) {
        return
      }

      const { dashboard, system } = await checkUpdateFromGitHub()
      if (dashboard !== PKG.version) {
        const $notice = notice.info({
          title: '[????????????] ??????????????????',
          content: () => (
            <div>
              <p>{`????????????: ${PKG.version}???????????????: ${dashboard}`}</p>
              <div class={'text-right'}>
                <NButton
                  round
                  onClick={() => {
                    handleUpdate()
                    $notice.destroy()
                  }}
                >
                  ????????????
                </NButton>
              </div>
            </div>
          ),
          closable: true,
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
          content: '???????????? Demo ??????????????????????????????',
        })
        return
      }

      if (
        app.value?.version &&
        app.value.version !== 'dev' &&
        versionMap.value.system
      ) {
        if (versionMap.value.system !== app.value.version) {
          notice.info({
            title: '[??????] ??????????????????',
            content: `????????????: ${app.value.version}???????????????: ${versionMap.value.system}`,
            closable: true,
          })
        }
      }
    })
    const $shellRef = ref<any>()

    return () => (
      <NElement tag="footer" class="mt-12">
        <NP
          class="text-center"
          style={{ color: 'var(--text-color-3)' }}
          depth="1"
        >
          <div class={'inline-flex items-center'}>
            ????????????: {__DEV__ ? 'dev mode' : window.version || 'N/A'}
            <NButton text onClick={handleUpdate} size="small" class={'ml-4'}>
              <NIcon size={12}>
                <RefreshIcon />
              </NIcon>
            </NButton>
          </div>
          <br />
          ????????????: {app.value?.version || 'N/A'}
          <br />
          ????????????: {window.pageSource || ''}
        </NP>

        <ShellOutputNormal ref={$shellRef} />
      </NElement>
    )
  },
})
