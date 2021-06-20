import { Comment, React } from '@vicons/fa'
import {
  Code24Filled,
  Comment24Filled,
  Extension24Filled,
  Link24Filled,
  Note24Filled,
} from '@vicons/fluent'
import { ChatbubblesSharp, RefreshOutline } from '@vicons/ionicons5'
import {
  AddLinkFilled,
  BubbleChartFilled,
  OnlinePredictionFilled,
} from '@vicons/material'
import { Activity, Copy, File, Refresh } from '@vicons/tabler'
import { Icon } from '@vicons/utils'
import { defineComponent } from '@vue/runtime-core'
import { HeaderActionButton } from 'components/button/rounded-button'
import { IpInfoPopover } from 'components/ip-info'
import { ContentLayout } from 'layouts/content'
import { pick } from 'lodash-es'
import { Stat } from 'models/stat'
import {
  NBadge,
  NButton,
  NCard,
  NGi,
  NGrid,
  NH1,
  NH3,
  NP,
  NSkeleton,
  NSpace,
  NStatistic,
  NText,
  NThing,
  useMessage,
} from 'naive-ui'
import { RouteName } from 'router/name'
import { UserStore } from 'stores/user'
import { parseDate, RESTManager, useInjector } from 'utils'
import { onBeforeMount, ref } from 'vue'
import { useRouter } from 'vue-router'

export const DashBoardView = defineComponent({
  name: 'Dashboard',
  setup() {
    const fetchHitokoto = async () => {
      const json = await fetch('https://v1.hitokoto.cn/?c=d')
      const data = (await (json.json() as unknown)) as {
        hitokoto: string
        from: string
        from_who: string
        creator: string
      }
      const postfix = Object.values(
        pick(data, ['from', 'from_who', 'creator']),
      ).filter(Boolean)[0]
      hitokoto.value = data.hitokoto + (postfix ? ' —— ' + postfix : '')
    }

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
    onBeforeMount(() => {
      fetchHitokoto()
      fetchStat()
    })
    const hitokoto = ref('')
    const message = useMessage()
    // const uiStore = useInjector(UIStore)
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
    const DataStat = defineComponent(() => () => (
      <>
        <div class="flex justify-between">
          <NSpace vertical>
            <NH3 class="text-opacity-80 font-light">数据统计</NH3>
            <p class="-mt-4 mb-3 relative text-gray-500">
              <span>数据更新于: </span>
              <time>
                {' '}
                {statTime.value
                  ? parseDate(statTime.value, 'yyyy年M月d日 HH:mm:ss')
                  : 'N/A'}
              </time>
            </p>
          </NSpace>

          <HeaderActionButton icon={<RefreshOutline />}></HeaderActionButton>
        </div>
        <NGrid xGap={20} yGap={20} cols={'4 400:2 600:3 900:4 1200:5 1600:6'}>
          {/* 博文 */}
          <NGi>
            <NCard>
              <NThing>
                {{
                  header() {
                    return (
                      <Statistic
                        label="博文"
                        value={stat.value.posts}
                      ></Statistic>
                    )
                  },
                  ['header-extra']() {
                    return (
                      <Icon class="text-4xl opacity-70">
                        <Code24Filled />
                      </Icon>
                    )
                  },

                  action() {
                    return (
                      <NSpace size="medium" align="center">
                        <NButton
                          round
                          type="primary"
                          onClick={() => {
                            router.push({ name: RouteName.EditPost })
                          }}
                        >
                          撰写
                        </NButton>
                        <NButton
                          text
                          onClick={() => {
                            router.push({ name: RouteName.ViewPost })
                          }}
                        >
                          管理
                        </NButton>
                      </NSpace>
                    )
                  },
                }}
              </NThing>
            </NCard>
          </NGi>

          {/* 日记 */}
          <NGi>
            <NCard>
              <NThing>
                {{
                  header() {
                    return (
                      <Statistic
                        label="日记"
                        value={stat.value.notes}
                      ></Statistic>
                    )
                  },
                  ['header-extra']() {
                    return (
                      <Icon class="text-4xl opacity-70">
                        <Note24Filled />
                      </Icon>
                    )
                  },

                  action() {
                    return (
                      <NSpace size="medium" align="center">
                        <NButton
                          round
                          type="primary"
                          onClick={() => {
                            router.push({ name: RouteName.EditNote })
                          }}
                        >
                          撰写
                        </NButton>
                        <NButton
                          text
                          onClick={() => {
                            router.push({ name: RouteName.ViewNote })
                          }}
                        >
                          管理
                        </NButton>
                      </NSpace>
                    )
                  },
                }}
              </NThing>
            </NCard>
          </NGi>
          {/* 页面 */}
          <NGi>
            <NCard>
              <NThing>
                {{
                  header() {
                    return (
                      <Statistic
                        label="页面"
                        value={stat.value.pages}
                      ></Statistic>
                    )
                  },
                  ['header-extra']() {
                    return (
                      <Icon class="text-4xl opacity-70">
                        <File />
                      </Icon>
                    )
                  },

                  action() {
                    return (
                      <NSpace size="medium" align="center">
                        <NButton
                          round
                          type="primary"
                          onClick={() => {
                            router.push({
                              name: RouteName.ListPage,
                            })
                          }}
                        >
                          管理
                        </NButton>
                      </NSpace>
                    )
                  },
                }}
              </NThing>
            </NCard>
          </NGi>

          <NGi>
            <NCard>
              <NThing>
                {{
                  header() {
                    return (
                      <Statistic
                        label="分类"
                        value={stat.value.categories}
                      ></Statistic>
                    )
                  },
                  ['header-extra']() {
                    return (
                      <Icon class="text-4xl opacity-70">
                        <Extension24Filled />
                      </Icon>
                    )
                  },

                  action() {
                    return (
                      <NSpace size="medium" align="center">
                        <NButton
                          round
                          type="primary"
                          onClick={() => {
                            router.push({ name: RouteName.EditCategory })
                          }}
                        >
                          管理
                        </NButton>
                      </NSpace>
                    )
                  },
                }}
              </NThing>
            </NCard>
          </NGi>
          <NGi>
            <NCard>
              <NThing>
                {{
                  header() {
                    return (
                      <Statistic
                        label="全部评论"
                        value={stat.value.allComments}
                      ></Statistic>
                    )
                  },
                  ['header-extra']() {
                    return (
                      <Icon class="text-4xl opacity-70">
                        <Comment24Filled />
                      </Icon>
                    )
                  },

                  action() {
                    return (
                      <NSpace size="medium" align="center">
                        <NButton
                          round
                          type="primary"
                          onClick={() => {
                            router.push({
                              name: RouteName.Comment,
                              query: { state: 1 },
                            })
                          }}
                        >
                          管理
                        </NButton>
                      </NSpace>
                    )
                  },
                }}
              </NThing>
            </NCard>
          </NGi>
          <NGi>
            <NCard>
              <NThing>
                {{
                  header() {
                    return (
                      <Statistic
                        label="未读评论"
                        value={stat.value.unreadComments}
                      ></Statistic>
                    )
                  },
                  ['header-extra']() {
                    return (
                      <Icon class="text-4xl opacity-70">
                        <ChatbubblesSharp />
                      </Icon>
                    )
                  },

                  action() {
                    return (
                      <NSpace size="medium" align="center">
                        <Badge value={stat.value.unreadComments} processing>
                          <NButton
                            round
                            type="primary"
                            onClick={() => {
                              router.push({
                                name: RouteName.Comment,
                                query: { state: 0 },
                              })
                            }}
                          >
                            查看
                          </NButton>
                        </Badge>
                      </NSpace>
                    )
                  },
                }}
              </NThing>
            </NCard>
          </NGi>

          <NGi>
            <NCard>
              <NThing>
                {{
                  header() {
                    return (
                      <Statistic
                        label="友链"
                        value={stat.value.links}
                      ></Statistic>
                    )
                  },
                  ['header-extra']() {
                    return (
                      <Icon class="text-4xl opacity-70">
                        <Link24Filled />
                      </Icon>
                    )
                  },

                  action() {
                    return (
                      <NSpace size="medium" align="center">
                        <NButton
                          round
                          type="primary"
                          onClick={() => {
                            router.push({
                              name: RouteName.Friend,
                              query: { state: 0 },
                            })
                          }}
                        >
                          管理
                        </NButton>
                      </NSpace>
                    )
                  },
                }}
              </NThing>
            </NCard>
          </NGi>

          <NGi>
            <NCard>
              <NThing>
                {{
                  header() {
                    return (
                      <Statistic
                        label="新的友链申请"
                        value={stat.value.linkApply}
                      ></Statistic>
                    )
                  },
                  ['header-extra']() {
                    return (
                      <Icon class="text-4xl opacity-70">
                        <AddLinkFilled />
                      </Icon>
                    )
                  },

                  action() {
                    return (
                      <NSpace size="medium" align="center">
                        <Badge value={stat.value.linkApply} processing>
                          <NButton
                            round
                            type="primary"
                            onClick={() => {
                              router.push({
                                name: RouteName.Friend,
                                query: { state: 1 },
                              })
                            }}
                          >
                            查看
                          </NButton>
                        </Badge>
                      </NSpace>
                    )
                  },
                }}
              </NThing>
            </NCard>
          </NGi>

          <NGi>
            <NCard>
              <NThing>
                {{
                  header() {
                    return (
                      <Statistic
                        label="说说"
                        value={stat.value.says}
                      ></Statistic>
                    )
                  },
                  ['header-extra']() {
                    return (
                      <Icon class="text-4xl opacity-70">
                        <Comment />
                      </Icon>
                    )
                  },

                  action() {
                    return (
                      <NSpace size="medium" align="center">
                        <NButton
                          round
                          type="primary"
                          onClick={() => {
                            router.push({
                              name: RouteName.EditSay,
                            })
                          }}
                        >
                          说一句
                        </NButton>
                        <NButton
                          text
                          onClick={() => {
                            router.push({
                              name: RouteName.ListSay,
                            })
                          }}
                        >
                          管理
                        </NButton>
                      </NSpace>
                    )
                  },
                }}
              </NThing>
            </NCard>
          </NGi>

          {/* Analyze */}
          <NGi>
            <NCard>
              <NThing>
                {{
                  header() {
                    return (
                      <Statistic
                        label="API 总调用次数"
                        value={Intl.NumberFormat('en-us').format(
                          stat.value.callTime,
                        )}
                      ></Statistic>
                    )
                  },
                  ['header-extra']() {
                    return (
                      <Icon class="text-4xl opacity-70">
                        <Activity />
                      </Icon>
                    )
                  },

                  action() {
                    return (
                      <NSpace size="medium" align="center">
                        <NButton
                          round
                          type="primary"
                          onClick={() => {
                            router.push({
                              name: RouteName.Analyze,
                            })
                          }}
                        >
                          查看
                        </NButton>

                        <NButton
                          onClick={() => {
                            RESTManager.api.clean_catch.get().then(() => {
                              message.success('清除成功')
                            })
                          }}
                          text
                        >
                          清空缓存
                        </NButton>
                      </NSpace>
                    )
                  },
                }}
              </NThing>
            </NCard>
          </NGi>

          <NGi>
            <NCard>
              <NThing>
                {{
                  header() {
                    return (
                      <Statistic
                        label="今日 IP 访问次数"
                        value={stat.value.todayIpAccessCount}
                      ></Statistic>
                    )
                  },
                  ['header-extra']() {
                    return (
                      <Icon class="text-4xl opacity-70">
                        <BubbleChartFilled />
                      </Icon>
                    )
                  },

                  action() {
                    return (
                      <NSpace size="medium" align="center">
                        <NButton
                          round
                          type="primary"
                          onClick={() => {
                            router.push({
                              name: RouteName.Analyze,
                            })
                          }}
                        >
                          查看
                        </NButton>
                      </NSpace>
                    )
                  },
                }}
              </NThing>
            </NCard>
          </NGi>

          <NGi>
            <NCard>
              <NThing>
                {{
                  header() {
                    return (
                      <Statistic
                        label="当前在线访客"
                        value={stat.value.online}
                      ></Statistic>
                    )
                  },
                  ['header-extra']() {
                    return (
                      <Icon class="text-4xl opacity-70">
                        <OnlinePredictionFilled />
                      </Icon>
                    )
                  },
                }}
              </NThing>
            </NCard>
          </NGi>
        </NGrid>
      </>
    ))
    return () => (
      <ContentLayout>
        <NH1 class="font-light">欢迎回来</NH1>
        <NP>
          <NSpace align="center" class="min-h-[3rem]">
            {hitokoto.value && (
              <>
                <NText>{hitokoto.value}</NText>
                <NButton text onClick={fetchHitokoto} class="ml-4">
                  <Icon>
                    <Refresh />
                  </Icon>
                </NButton>

                <NButton
                  text
                  onClick={() => {
                    navigator.clipboard.writeText(hitokoto.value)
                    message.success('已复制, ' + hitokoto.value)
                  }}
                >
                  <Icon>
                    <Copy />
                  </Icon>
                </NButton>
              </>
            )}
          </NSpace>
        </NP>
        <UserLoginStat />
        <DataStat />
      </ContentLayout>
    )
  },
})

const Statistic = defineComponent({
  props: { label: String, value: [String, Number] },
  setup(props) {
    return () => (
      <Fragment>
        {props.value === 'N/A' ? (
          <NSpace vertical align="center" class="min-h-[4rem]">
            <NSkeleton style={{ height: '.8rem', width: '5rem' }}></NSkeleton>
            <NSkeleton style={{ height: '1.8rem', width: '3rem' }}></NSkeleton>
          </NSpace>
        ) : (
          <NStatistic label={props.label} value={props.value}></NStatistic>
        )}
      </Fragment>
    )
  },
})

const Badge = defineComponent({
  props: { processing: Boolean, value: [String, Number] },
  setup(props, ctx) {
    return () => (
      <Fragment>
        {props.value === 'N/A' ? (
          ctx.slots
        ) : (
          <NBadge {...props}>{ctx.slots}</NBadge>
        )}
      </Fragment>
    )
  },
})
