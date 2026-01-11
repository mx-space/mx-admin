import {
  NButton,
  NButtonGroup,
  NCard,
  NCollapse,
  NCollapseItem,
  NDataTable,
  NDatePicker,
  NForm,
  NFormItem,
  NH3,
  NInput,
  NLayoutContent,
  NList,
  NListItem,
  NModal,
  NP,
  NPopconfirm,
  NSpace,
  NSwitch,
  NText,
} from 'naive-ui'
import { defineComponent, onBeforeMount, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { TokenModel } from '~/models/token'

import { Icon } from '@vicons/utils'

import { If } from '~/components/directives/if'
import { PlusIcon as Plus } from '~/components/icons'
import { IpInfoPopover } from '~/components/ip-info'
import { RelativeTime } from '~/components/time/relative-time'
import { useStoreRef } from '~/hooks/use-store-ref'
import { RouteName } from '~/router/name'
import { UIStore } from '~/stores/ui'
import { parseDate, removeToken, RESTManager } from '~/utils'
import { authClient } from '~/utils/authjs/auth'

import { autosizeableProps } from './system'

type Session = {
  id: string
  ua?: string
  ip?: string
  date: string
  current?: boolean
}
export const TabSecurity = defineComponent(() => {
  const sessions = ref<Session[]>([])
  const fetchSession = async () => {
    const res = await RESTManager.api.user.session.get<{ data: Session[] }>({})
    sessions.value = res.data || []
  }
  onMounted(() => {
    fetchSession()
  })
  const handleKick = async (current: boolean, id?: string) => {
    if (current) {
      await RESTManager.api.user.logout.post<{}>({})

      removeToken()
      await authClient.signOut()
      window.location.reload()
    } else {
      await RESTManager.api.user.session(id).delete<{}>({})
      sessions.value = sessions.value.filter((item) => item.id !== id)
    }
  }
  const handleKickAll = async () => {
    await RESTManager.api.user.session.all.delete<{}>({})

    await fetchSession()
  }
  return () => (
    <Fragment>
      <NH3 class={'flex items-center justify-between'}>
        <span class={'ml-4'}>登录设备</span>

        <NPopconfirm onPositiveClick={handleKickAll}>
          {{
            trigger() {
              return (
                <NButton
                  size="small"
                  quaternary
                  type="error"
                  disabled={
                    sessions.value.length == 1 && sessions.value[0].current
                  }
                >
                  踢掉全部
                </NButton>
              )
            },
            default() {
              return '确定踢掉全部登录设备（除当前会话）？'
            },
          }}
        </NPopconfirm>
      </NH3>

      <NList bordered>
        {sessions.value.map(({ id, ua, ip, date, current }) => (
          <NListItem key={id}>
            {{
              prefix() {
                return (
                  <div class={'w-20 text-center'}>
                    {current ? '当前' : null}
                  </div>
                )
              },
              suffix() {
                return (
                  <NButtonGroup>
                    <NPopconfirm
                      onPositiveClick={() => handleKick(!!current, id)}
                    >
                      {{
                        trigger() {
                          return (
                            <NButton tertiary type="error">
                              {current ? '注销' : '踢'}
                            </NButton>
                          )
                        },
                        default() {
                          return current ? '登出？' : '确定要踢出吗？'
                        },
                      }}
                    </NPopconfirm>
                  </NButtonGroup>
                )
              },
              default() {
                return (
                  <NSpace vertical>
                    <If condition={!!ua}>
                      <NP>User Agent: {ua}</NP>
                    </If>

                    <If condition={!!ip}>
                      <NP>
                        IP:{' '}
                        <IpInfoPopover
                          ip={ip!}
                          triggerEl={
                            <NButton quaternary size="tiny" type="primary">
                              {ip}
                            </NButton>
                          }
                        />
                      </NP>
                    </If>

                    <NP>
                      {current ? '活跃时间' : '登录时间'}:{' '}
                      <RelativeTime time={date} />
                    </NP>
                  </NSpace>
                )
              },
            }}
          </NListItem>
        ))}
      </NList>

      <div class="pt-4" />
      <NCollapse defaultExpandedNames={['']} displayDirective="show">
        <NCollapseItem name="reset" title="修改密码">
          <ResetPass />
        </NCollapseItem>

        <NCollapseItem name="token" title="API Token">
          <ApiToken />
        </NCollapseItem>
      </NCollapse>
    </Fragment>
  )
})

const ApiToken = defineComponent(() => {
  const tokens = ref([] as TokenModel[])

  const defaultModel = () => ({
    name: '',
    expired: false,
    expiredTime: new Date(),
  })
  const dataModel = reactive(defaultModel())
  const fetchToken = async () => {
    const { data } = (await RESTManager.api.auth.token.get()) as any

    tokens.value = data
  }

  onBeforeMount(() => {
    fetchToken()
  })
  const newTokenDialogShow = ref(false)
  const tokenDisplayDialogShow = ref(false)
  const createdTokenInfo = ref<TokenModel | null>(null)
  const visibleTokens = ref<Set<string>>(new Set())

  const newToken = async () => {
    try {
      const payload = {
        name: dataModel.name,
        expired: dataModel.expired
          ? dataModel.expiredTime.toISOString()
          : undefined,
      }

      const response = (await RESTManager.api.auth.token.post({
        data: payload,
      })) as TokenModel

      // 尝试复制到剪贴板，但不阻塞后续流程
      try {
        await navigator.clipboard.writeText(response.token)
      } catch (clipboardError) {
        // Safari 或其他浏览器可能不支持或需要权限
        console.warn('复制到剪贴板失败:', clipboardError)
      }

      newTokenDialogShow.value = false
      const n = defaultModel()
      for (const key in n) {
        dataModel[key] = n[key]
      }

      // 显示token详情弹窗
      createdTokenInfo.value = response
      tokenDisplayDialogShow.value = true

      await fetchToken()
      // Backend bug.
      const index = tokens.value.findIndex((i) => i.name === payload.name)
      if (index !== -1) {
        tokens.value[index].token = response.token
      }
    } catch (_error) {
      alert('创建 Token 失败，请重试')
    }
  }

  const onDeleteToken = async (id) => {
    await RESTManager.api.auth.token.delete({ params: { id } })
    message.success('删除成功')
    const index = tokens.value.findIndex((i) => i.id === id)
    if (index != -1) {
      tokens.value.splice(index, 1)
    }
  }

  const toggleTokenVisibility = async (tokenData: TokenModel) => {
    const tokenId = tokenData.id
    if (visibleTokens.value.has(tokenId)) {
      // 隐藏token
      visibleTokens.value.delete(tokenId)
    } else {
      // 显示token，需要从后端获取完整信息
      try {
        const response = await RESTManager.api.auth.token.get<TokenModel>({
          params: { id: tokenId },
        })
        // 更新tokens数组中的token信息
        const index = tokens.value.findIndex((i) => i.id === tokenId)
        if (index !== -1) {
          tokens.value[index].token = response.token
        }
        visibleTokens.value.add(tokenId)
      } catch (error) {
        console.error('获取Token详情失败:', error)
        alert('获取Token详情失败，请重试')
      }
    }
  }

  const copyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token)
      message.success('Token 已复制到剪贴板')
    } catch (_error) {
      // Safari 兼容性处理：使用传统的复制方法
      const textArea = document.createElement('textarea')
      textArea.value = token
      textArea.style.position = 'fixed'
      textArea.style.left = '-9999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
        message.success('Token 已复制到剪贴板')
      } catch (fallbackError) {
        console.warn('复制失败:', fallbackError)
        alert('复制失败，请手动复制Token')
      }
      document.body.removeChild(textArea)
    }
  }

  const uiStore = useStoreRef(UIStore)
  return () => (
    <NLayoutContent class="!overflow-visible">
      <NModal
        transformOrigin="center"
        show={newTokenDialogShow.value}
        onUpdateShow={(e) => void (newTokenDialogShow.value = e)}
      >
        <NCard bordered={false} title="创建 Token" class="w-[500px] max-w-full">
          <NForm>
            <NFormItem label="名称" required>
              <NInput
                value={dataModel.name}
                onInput={(e) => void (dataModel.name = e)}
              />
            </NFormItem>

            <NFormItem label="是否过期">
              <NSwitch
                value={dataModel.expired}
                onUpdateValue={(e) => void (dataModel.expired = e)}
              />
            </NFormItem>

            <NFormItem label="过期时间">
              <NDatePicker
                disabled={!dataModel.expired}
                // @ts-expect-error
                value={dataModel.expiredTime}
                type="datetime"
                onUpdateValue={(e) =>
                  void (dataModel.expiredTime = new Date(e))
                }
              />
            </NFormItem>
          </NForm>
          <NSpace>
            <NButton
              round
              onClick={() => void (newTokenDialogShow.value = false)}
            >
              取消
            </NButton>
            <NButton
              round
              type="primary"
              disabled={!dataModel.name.trim()}
              onClick={newToken}
            >
              确定
            </NButton>
          </NSpace>
        </NCard>
      </NModal>

      {/* Token 显示弹窗 */}
      <NModal
        transformOrigin="center"
        show={tokenDisplayDialogShow.value}
        onUpdateShow={(e) => void (tokenDisplayDialogShow.value = e)}
      >
        <NCard
          bordered={false}
          title="Token 创建成功"
          class="w-[600px] max-w-full"
          closable
          onClose={() => void (tokenDisplayDialogShow.value = false)}
        >
          <div class="space-y-4">
            <div>
              <NText depth={3} class="text-sm">
                Token 创建成功，请妥善保存以下信息：
              </NText>
            </div>

            <div class="space-y-3">
              <div>
                <NText strong>Token 名称：</NText>
                <NText>{createdTokenInfo.value?.name}</NText>
              </div>

              <div>
                <NText strong>Token：</NText>
                <div class="mt-2 flex items-center gap-2 rounded border bg-gray-50 p-3 dark:bg-gray-800">
                  <NText
                    code
                    class="flex-1 break-all text-gray-900 dark:text-gray-100"
                  >
                    {createdTokenInfo.value?.token}
                  </NText>
                  <NButton
                    size="small"
                    type="primary"
                    onClick={async () => {
                      if (createdTokenInfo.value?.token) {
                        try {
                          await navigator.clipboard.writeText(
                            createdTokenInfo.value.token,
                          )
                          message.success('Token 已复制到剪贴板')
                        } catch (_error) {
                          // Safari 兼容性处理：使用传统的复制方法
                          const textArea = document.createElement('textarea')
                          textArea.value = createdTokenInfo.value.token
                          textArea.style.position = 'fixed'
                          textArea.style.left = '-9999px'
                          document.body.appendChild(textArea)
                          textArea.focus()
                          textArea.select()
                          try {
                            document.execCommand('copy')
                            message.success('Token 已复制到剪贴板')
                          } catch (fallbackError) {
                            console.warn('复制失败:', fallbackError)
                            alert('复制失败，请手动复制Token')
                          }
                          document.body.removeChild(textArea)
                        }
                      }
                    }}
                  >
                    复制
                  </NButton>
                </div>
              </div>

              {createdTokenInfo.value?.expired && (
                <div>
                  <NText strong>过期时间：</NText>
                  <NText>
                    {createdTokenInfo.value.expired
                      ? parseDate(
                          createdTokenInfo.value.expired,
                          'yyyy 年 M 月 d 日 HH:mm:ss',
                        )
                      : '永不过期'}
                  </NText>
                </div>
              )}
            </div>

            <div class="pt-2">
              <NText depth={3} class="text-sm">
                💡 建议将此 Token 保存在安全的地方，避免泄露给他人。
              </NText>
            </div>
          </div>

          <div class="mt-6 flex justify-end">
            <NButton
              type="primary"
              onClick={() => void (tokenDisplayDialogShow.value = false)}
            >
              确定
            </NButton>
          </div>
        </NCard>
      </NModal>

      <NButton
        class="absolute right-0 top-[-3rem]"
        round
        type="primary"
        onClick={() => {
          newTokenDialogShow.value = true
        }}
      >
        <Icon>
          <Plus />
        </Icon>
        <span class="ml-2">新增</span>
      </NButton>
      <NDataTable
        scrollX={Math.max(
          800,
          uiStore.contentWidth.value - uiStore.contentInsetWidth.value,
        )}
        remote
        bordered={false}
        data={tokens.value}
        columns={[
          { key: 'name', title: '名称' },
          {
            key: 'token',
            title: 'Token',
            render(row) {
              const { token, id } = row
              const isVisible = visibleTokens.value.has(id)

              if (isVisible && token && token !== '*'.repeat(40)) {
                // 显示真实token，可点击复制
                return (
                  <NButton
                    text
                    type="primary"
                    onClick={() => copyToken(token)}
                    class="max-w-[200px] truncate text-left font-mono"
                  >
                    {token}
                  </NButton>
                )
              } else {
                // 显示星号
                return '*'.repeat(40)
              }
            },
          },
          {
            title: '创建时间',
            key: 'created',
            render({ created }) {
              return <RelativeTime time={created} />
            },
          },
          {
            title: '过期时间',
            key: 'expired',
            render({ expired }) {
              return parseDate(expired, 'yyyy 年 M 月 d 日 HH:mm:ss')
            },
          },
          {
            title: '操作',
            key: 'id',
            render(row) {
              const { id, name } = row
              const isVisible = visibleTokens.value.has(id)

              return (
                <NSpace>
                  <NButton
                    text
                    type="primary"
                    onClick={() => toggleTokenVisibility(row)}
                  >
                    {isVisible ? '隐藏' : '查看'}
                  </NButton>
                  <NPopconfirm
                    positiveText={'取消'}
                    negativeText="删除"
                    onNegativeClick={() => {
                      onDeleteToken(id)
                    }}
                  >
                    {{
                      trigger: () => (
                        <NButton text type="error">
                          删除
                        </NButton>
                      ),

                      default: () => (
                        <span class="max-w-48">确定要删除 Token "{name}"?</span>
                      ),
                    }}
                  </NPopconfirm>
                </NSpace>
              )
            },
          },
        ]}
      />
    </NLayoutContent>
  )
})
const ResetPass = defineComponent(() => {
  const resetPassword = reactive({
    password: '',
    reenteredPassword: '',
  })
  const formRef = ref<typeof NForm>()
  const router = useRouter()
  const reset = async () => {
    if (!formRef.value) {
      return
    }

    formRef.value.validate(async (err) => {
      if (!err) {
        await RESTManager.api.master.patch({
          data: {
            password: resetPassword.password,
          },
        })
        message.success('更改成功')
        removeToken()
        router.push({ name: RouteName.Login })
      } else {
        // noop
      }
    })
  }

  function validatePasswordSame(_rule, value) {
    return value === resetPassword.password
  }

  return () => (
    <NForm
      class="max-w-[300px]"
      ref={formRef}
      model={resetPassword}
      rules={{
        password: [
          {
            required: true,
            message: '请输入密码',
          },
        ],
        reenteredPassword: [
          {
            required: true,
            message: '请再次输入密码',
            trigger: ['input', 'blur'],
          },
          {
            validator: validatePasswordSame,
            message: '两次密码输入不一致',
            trigger: ['blur', 'password-input'],
          },
        ],
      }}
    >
      <NFormItem label="新密码" required path="password">
        <NInput
          {...autosizeableProps}
          value={resetPassword.password}
          onInput={(e) => void (resetPassword.password = e)}
          type="password"
        />
      </NFormItem>
      <NFormItem label="重复密码" required path="reenteredPassword">
        <NInput
          {...autosizeableProps}
          value={resetPassword.reenteredPassword}
          onInput={(e) => void (resetPassword.reenteredPassword = e)}
          type="password"
        />
      </NFormItem>
      <div class="quaternary-right w-full">
        <NButton onClick={reset} type="primary" round>
          保存
        </NButton>
      </div>
    </NForm>
  )
})
