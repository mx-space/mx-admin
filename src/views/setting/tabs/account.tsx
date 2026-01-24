import {
  Check as CheckIcon,
  Copy as CopyIcon,
  ExternalLinkIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Fingerprint as FingerprintIcon,
  Globe as GlobeIcon,
  Key as KeyIcon,
  Lock as LockIcon,
  Monitor as MonitorIcon,
  Plus as PlusIcon,
  ShieldCheck as ShieldCheckIcon,
  Shield as ShieldIcon,
  Smartphone as SmartphoneIcon,
  Trash2 as TrashIcon,
} from 'lucide-vue-next'
import {
  NButton,
  NCard,
  NDataTable,
  NDatePicker,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NPopconfirm,
  NSkeleton,
  NSwitch,
  NText,
} from 'naive-ui'
import { defineComponent, onBeforeMount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import type { TokenModel } from '~/models/token'
import type { DialogReactive } from 'naive-ui'
import type { FlatOauthData, OauthData } from './providers/oauth'

import { useQuery } from '@tanstack/vue-query'

import { authApi } from '~/api/auth'
import { optionsApi } from '~/api/options'
import { userApi } from '~/api/user'
import { IpInfoPopover } from '~/components/ip-info'
import { RelativeTime } from '~/components/time/relative-time'
import { queryKeys } from '~/hooks/queries/keys'
import { useStoreRef } from '~/hooks/use-store-ref'
import { SettingsCard } from '~/layouts/settings-layout'
import { RouteName } from '~/router/name'
import { UIStore } from '~/stores/ui'
import { parseDate, removeToken } from '~/utils'
import { authClient } from '~/utils/authjs/auth'
import { getSession } from '~/utils/authjs/session'
import { AuthnUtils } from '~/utils/authn'

import { flattenOauthData, useProvideOauthData } from './providers/oauth'
import { GitHubProvider, GoogleProvider } from './sections/oauth'
import { autosizeableProps } from './system'

type Session = {
  id: string
  ua?: string
  ip?: string
  date: string
  current?: boolean
}

export const TabAccount = defineComponent(() => {
  return () => (
    <div class="py-6">
      <style>
        {`
          .n-data-table .n-data-table-td {
            vertical-align: baseline !important;
          }
          /* 统一表格首列和末列的缩进，与卡片 Header 保持一致 */
          .n-data-table .n-data-table-th:first-child,
          .n-data-table .n-data-table-td:first-child {
            padding-left: 24px !important;
          }
          .n-data-table .n-data-table-th:last-child,
          .n-data-table .n-data-table-td:last-child {
            padding-right: 24px !important;
          }
        `}
      </style>
      <SessionSection />
      <ResetPass />
      <ApiToken />
      <Passkey />
      <Oauth />
    </div>
  )
})

const SessionSection = defineComponent(() => {
  const sessions = ref<Session[]>([])
  const loading = ref(true)

  const fetchSession = async () => {
    loading.value = true
    const res = await userApi.getSessions()
    sessions.value =
      res?.map((s) => ({
        ...s,
        date: s.lastActiveAt,
      })) || []
    loading.value = false
  }

  onMounted(() => {
    fetchSession()
  })

  const handleKick = async (current: boolean, id?: string) => {
    if (current) {
      await userApi.logout()
      removeToken()
      await authClient.signOut()
      window.location.reload()
    } else {
      await userApi.deleteSession(id!)
      sessions.value = sessions.value.filter((item) => item.id !== id)
    }
  }

  const handleKickAll = async () => {
    await userApi.deleteAllSessions()
    await fetchSession()
  }

  return () => (
    <SettingsCard
      title="登录设备"
      description="管理你的登录会话，保护账户安全"
      icon={MonitorIcon}
      v-slots={{
        actions: () => (
          <NPopconfirm onPositiveClick={handleKickAll}>
            {{
              trigger: () => (
                <NButton
                  size="small"
                  type="error"
                  secondary
                  disabled={
                    sessions.value.length === 1 && sessions.value[0]?.current
                  }
                >
                  {{
                    icon: () => <TrashIcon class="size-4" />,
                    default: () => '踢掉全部',
                  }}
                </NButton>
              ),
              default: () => '确定踢掉全部登录设备（除当前会话）？',
            }}
          </NPopconfirm>
        ),
      }}
    >
      {loading.value ? (
        <SessionSkeleton />
      ) : (
        <div class="flex flex-col gap-4">
          {sessions.value.map(({ id, ua, ip, date, current }) => (
            <div
              key={id}
              class={[
                'rounded-lg border bg-neutral-50/50 p-4 transition-shadow dark:bg-neutral-800/20',
                current
                  ? 'border-primary/20 bg-primary/5 dark:border-primary/20 dark:bg-primary/5'
                  : 'border-neutral-200 dark:border-neutral-800',
              ]}
            >
              <div class="mb-3 flex items-center justify-between">
                <span
                  class={[
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                    current
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400',
                  ]}
                >
                  {current ? (
                    <>
                      <CheckIcon class="size-3" />
                      当前设备
                    </>
                  ) : (
                    <>
                      <SmartphoneIcon class="size-3" />
                      其他设备
                    </>
                  )}
                </span>

                <NPopconfirm onPositiveClick={() => handleKick(!!current, id)}>
                  {{
                    trigger: () => (
                      <NButton
                        size="tiny"
                        type={current ? 'warning' : 'error'}
                        quaternary
                      >
                        {current ? '注销' : '踢出'}
                      </NButton>
                    ),
                    default: () =>
                      current ? '确定要注销当前会话？' : '确定要踢出此设备？',
                  }}
                </NPopconfirm>
              </div>

              <div class="space-y-2">
                {ua && (
                  <div class="font-mono text-xs text-neutral-600 dark:text-neutral-300">
                    {ua}
                  </div>
                )}

                <div class="mt-3 flex flex-wrap items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                  {ip && (
                    <div class="flex items-center gap-1.5">
                      <GlobeIcon class="size-3.5" />
                      <IpInfoPopover
                        ip={ip}
                        triggerEl={
                          <span class="cursor-pointer hover:underline">
                            {ip}
                          </span>
                        }
                      />
                    </div>
                  )}

                  <div class="flex items-center gap-1.5">
                    <span>{current ? '活跃时间:' : '登录时间:'}</span>
                    <RelativeTime time={date} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </SettingsCard>
  )
})

const SessionSkeleton = defineComponent(() => {
  return () => (
    <div class="flex flex-col gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          class="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div class="mb-3 flex items-center justify-between">
            <NSkeleton text style={{ width: '80px', height: '24px' }} />
            <NSkeleton text style={{ width: '60px', height: '28px' }} />
          </div>
          <NSkeleton
            text
            style={{ width: '100%', height: '40px', marginTop: '12px' }}
          />
          <div class="mt-3 flex gap-4">
            <NSkeleton text style={{ width: '100px' }} />
            <NSkeleton text style={{ width: '120px' }} />
          </div>
        </div>
      ))}
    </div>
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

    formRef.value.validate(async (err: any) => {
      if (!err) {
        await userApi.updateMaster({
          password: resetPassword.password,
        })
        toast.success('密码修改成功，请重新登录')
        removeToken()
        router.push({ name: RouteName.Login })
      }
    })
  }

  function validatePasswordSame(_rule: any, value: string) {
    return value === resetPassword.password
  }

  return () => (
    <SettingsCard
      title="修改密码"
      description="修改后需要重新登录"
      icon={LockIcon}
    >
      <NForm
        ref={formRef}
        model={resetPassword}
        labelPlacement="top"
        showRequireMark={false}
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
        <div class="grid gap-6 md:grid-cols-2">
          <NFormItem label="新密码" path="password">
            <NInput
              {...autosizeableProps}
              value={resetPassword.password}
              onInput={(e) => void (resetPassword.password = e)}
              type="password"
              showPasswordOn="click"
              placeholder="输入新密码"
            />
          </NFormItem>
          <NFormItem label="确认密码" path="reenteredPassword">
            <NInput
              {...autosizeableProps}
              value={resetPassword.reenteredPassword}
              onInput={(e) => void (resetPassword.reenteredPassword = e)}
              type="password"
              showPasswordOn="click"
              placeholder="再次输入新密码"
            />
          </NFormItem>
        </div>

        <div class="mt-4 flex justify-end border-t border-neutral-100 pt-4 dark:border-neutral-800">
          <NButton onClick={reset} type="primary">
            <ShieldIcon class="mr-1 size-4" />
            修改密码
          </NButton>
        </div>
      </NForm>
    </SettingsCard>
  )
})

const ApiToken = defineComponent(() => {
  const tokens = ref([] as TokenModel[])
  const loading = ref(true)

  const defaultModel = () => ({
    name: '',
    expired: false,
    expiredTime: new Date(),
  })
  const dataModel = reactive(defaultModel())

  const fetchToken = async () => {
    loading.value = true
    const data = await authApi.getTokens()
    tokens.value = data
    loading.value = false
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

      const response = await authApi.createToken(payload)

      try {
        await navigator.clipboard.writeText(response.token)
      } catch {
        console.warn('复制到剪贴板失败')
      }

      newTokenDialogShow.value = false
      const n = defaultModel()
      for (const key in n) {
        dataModel[key] = n[key]
      }

      createdTokenInfo.value = response
      tokenDisplayDialogShow.value = true

      await fetchToken()
      const index = tokens.value.findIndex((i) => i.name === payload.name)
      if (index !== -1) {
        tokens.value[index].token = response.token
      }
    } catch {
      toast.error('创建 Token 失败，请重试')
    }
  }

  const onDeleteToken = async (id: string) => {
    await authApi.deleteToken(id)
    toast.success('删除成功')
    const index = tokens.value.findIndex((i) => i.id === id)
    if (index !== -1) {
      tokens.value.splice(index, 1)
    }
  }

  const toggleTokenVisibility = async (tokenData: TokenModel) => {
    const tokenId = tokenData.id
    if (visibleTokens.value.has(tokenId)) {
      visibleTokens.value.delete(tokenId)
    } else {
      try {
        const response = await authApi.getToken(tokenId)
        const index = tokens.value.findIndex((i) => i.id === tokenId)
        if (index !== -1) {
          tokens.value[index].token = response.token
        }
        visibleTokens.value.add(tokenId)
      } catch (error) {
        console.error('获取Token详情失败:', error)
        toast.error('获取Token详情失败，请重试')
      }
    }
  }

  const copyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token)
      toast.success('Token 已复制到剪贴板')
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = token
      textArea.style.position = 'fixed'
      textArea.style.left = '-9999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
        toast.success('Token 已复制到剪贴板')
      } catch {
        toast.error('复制失败，请手动复制Token')
      }
      document.body.removeChild(textArea)
    }
  }

  const uiStore = useStoreRef(UIStore)

  return () => (
    <>
      <SettingsCard
        title="API Token"
        description="用于 API 调用的访问令牌"
        icon={KeyIcon}
        pure
        v-slots={{
          actions: () => (
            <NButton
              type="primary"
              size="small"
              secondary
              onClick={() => {
                newTokenDialogShow.value = true
              }}
            >
              <PlusIcon class="mr-1 size-4" />
              新增 Token
            </NButton>
          ),
        }}
      >
        {loading.value ? (
          <div class="p-6">
            <NSkeleton text style={{ width: '100%', height: '200px' }} />
          </div>
        ) : (
          <NDataTable
            scrollX={Math.max(
              800,
              uiStore.contentWidth.value - uiStore.contentInsetWidth.value,
            )}
            remote
            bordered={false}
            data={tokens.value}
            rowClassName={() => 'group'}
            columns={[
              { key: 'name', title: '名称' },
              {
                key: 'token',
                title: 'Token',
                render(row) {
                  const { token, id } = row
                  const isVisible = visibleTokens.value.has(id)

                  if (isVisible && token && token !== '*'.repeat(40)) {
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
                    return (
                      <span class="font-mono text-neutral-400">
                        {'•'.repeat(32)}
                      </span>
                    )
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
                  return expired ? (
                    parseDate(expired, 'yyyy 年 M 月 d 日 HH:mm:ss')
                  ) : (
                    <span class="text-neutral-400">永不过期</span>
                  )
                },
              },
              {
                title: '操作',
                key: 'id',
                render(row) {
                  const { id, name } = row
                  const isVisible = visibleTokens.value.has(id)

                  return (
                    <div class="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <NButton
                        text
                        type="primary"
                        onClick={() => toggleTokenVisibility(row)}
                      >
                        {isVisible ? (
                          <EyeOffIcon class="size-4" />
                        ) : (
                          <EyeIcon class="size-4" />
                        )}
                      </NButton>
                      <NPopconfirm
                        positiveText="取消"
                        negativeText="删除"
                        onNegativeClick={() => {
                          onDeleteToken(id)
                        }}
                      >
                        {{
                          trigger: () => (
                            <NButton text type="error">
                              <TrashIcon class="size-4" />
                            </NButton>
                          ),
                          default: () => (
                            <span class="max-w-48">
                              确定要删除 Token "{name}"?
                            </span>
                          ),
                        }}
                      </NPopconfirm>
                    </div>
                  )
                },
              },
            ]}
          />
        )}
      </SettingsCard>

      {/* Create Token Modal */}
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
                placeholder="为这个 Token 起个名字…"
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
                value={dataModel.expiredTime.getTime()}
                type="datetime"
                onUpdateValue={(e) =>
                  void (dataModel.expiredTime = new Date(e!))
                }
              />
            </NFormItem>
          </NForm>

          <div class="flex justify-end gap-3">
            <NButton onClick={() => void (newTokenDialogShow.value = false)}>
              取消
            </NButton>
            <NButton
              type="primary"
              disabled={!dataModel.name.trim()}
              onClick={newToken}
            >
              确定
            </NButton>
          </div>
        </NCard>
      </NModal>

      {/* Token Display Modal */}
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
            <div class="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-green-700 dark:bg-green-900/20 dark:text-green-400">
              <CheckIcon class="size-5" />
              <span>Token 创建成功，请妥善保存</span>
            </div>

            <div class="space-y-3">
              <div class="flex items-center gap-2 rounded-lg bg-neutral-50 px-4 py-3 text-sm dark:bg-neutral-800">
                <span class="shrink-0 text-neutral-500 dark:text-neutral-400">
                  Token 名称:
                </span>
                <span class="ml-auto font-medium text-neutral-700 dark:text-neutral-200">
                  {createdTokenInfo.value?.name}
                </span>
              </div>

              <div>
                <div class="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Token:
                </div>
                <div class="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800">
                  <NText code class="flex-1 break-all text-sm">
                    {createdTokenInfo.value?.token}
                  </NText>
                  <NButton
                    size="small"
                    type="primary"
                    onClick={async () => {
                      if (createdTokenInfo.value?.token) {
                        await copyToken(createdTokenInfo.value.token)
                      }
                    }}
                  >
                    <CopyIcon class="size-4" />
                  </NButton>
                </div>
              </div>

              {createdTokenInfo.value?.expired && (
                <div class="flex items-center gap-2 rounded-lg bg-neutral-50 px-4 py-3 text-sm dark:bg-neutral-800">
                  <span class="shrink-0 text-neutral-500 dark:text-neutral-400">
                    过期时间:
                  </span>
                  <span class="ml-auto font-medium text-neutral-700 dark:text-neutral-200">
                    {parseDate(
                      createdTokenInfo.value.expired,
                      'yyyy 年 M 月 d 日 HH:mm:ss',
                    )}
                  </span>
                </div>
              )}
            </div>

            <div class="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
              请将此 Token 保存在安全的地方，关闭此窗口后将无法再次查看完整
              Token。
            </div>
          </div>

          <div class="mt-6 flex justify-end">
            <NButton
              type="primary"
              onClick={() => void (tokenDisplayDialogShow.value = false)}
            >
              我已保存
            </NButton>
          </div>
        </NCard>
      </NModal>
    </>
  )
})

const Passkey = defineComponent(() => {
  const uiStore = useStoreRef(UIStore)
  const { data: passkeys, refetch: refetchTable } = useQuery({
    queryKey: queryKeys.auth.passkeys(),
    queryFn: () => authApi.getPasskeys(),
  })

  const onDeleteToken = (id: string) => {
    authApi.deletePasskey(id).then(() => {
      refetchTable()
    })
  }

  const NewModalContent = defineComponent(
    (props: { dialog: DialogReactive }) => {
      const name = ref('')
      const handleCreate = (e: Event) => {
        e.preventDefault()
        e.stopPropagation()
        AuthnUtils.createPassKey(name.value).then(() => {
          refetchTable()
          props.dialog.destroy()
        })
      }
      return () => (
        <NForm onSubmit={handleCreate}>
          <NFormItem label="名称" required>
            <NInput
              value={name.value}
              onUpdateValue={(e) => {
                name.value = e
              }}
              placeholder="为这个 Passkey 起个名字…"
            />
          </NFormItem>
          <div class="flex justify-end">
            <NButton
              disabled={name.value.length === 0}
              type="primary"
              onClick={handleCreate}
            >
              创建
            </NButton>
          </div>
        </NForm>
      )
    },
  )

  const { data: setting, refetch: refetchSetting } = useQuery({
    queryKey: queryKeys.options.detail('authSecurity'),
    queryFn: async () => {
      const data = await optionsApi.get<{
        disablePasswordLogin: boolean
      }>('authSecurity')
      return data
    },
  })

  const updateSetting = (value: boolean) => {
    optionsApi
      .patch('authSecurity', {
        disablePasswordLogin: value,
      })
      .then(() => {
        refetchSetting()
      })
  }

  // @ts-ignore
  NewModalContent.props = ['dialog']

  return () => (
    <SettingsCard
      title="通行密钥"
      description="使用生物识别或安全密钥登录"
      icon={FingerprintIcon}
      pure
      v-slots={{
        actions: () => (
          <div class="flex items-center gap-2">
            <NButton
              secondary
              size="small"
              onClick={() => {
                AuthnUtils.validate(true)
              }}
            >
              <ShieldCheckIcon class="mr-1 size-4" />
              验证
            </NButton>
            <NButton
              type="primary"
              secondary
              size="small"
              onClick={() => {
                const $dialog = dialog.create({
                  title: '创建 Passkey',
                  content: () => <NewModalContent dialog={$dialog} />,
                })
              }}
            >
              <PlusIcon class="mr-1 size-4" />
              新增
            </NButton>
          </div>
        ),
      }}
    >
      <div class="flex items-baseline justify-between border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
        <div class="flex flex-col gap-0.5">
          <span class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            禁止密码登录
          </span>
          <span class="text-xs text-neutral-500 dark:text-neutral-400">
            开启后只能通过 Passkey 或 OAuth 登录
          </span>
        </div>
        <NSwitch
          value={setting.value?.disablePasswordLogin}
          onUpdateValue={(v) => {
            if (v && !passkeys.value?.length) {
              toast.error('至少需要一个 Passkey 才能开启这个功能')
              return
            }
            updateSetting(v)
          }}
        />
      </div>

      <div>
        {!passkeys.value ? (
          <div class="p-6">
            <NSkeleton text style={{ width: '100%', height: '150px' }} />
          </div>
        ) : passkeys.value.length === 0 ? (
          <div class="flex flex-col items-center justify-center py-12 text-center">
            <div class="mb-4 flex size-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500">
              <KeyIcon class="size-7" />
            </div>
            <h3 class="m-0 mb-2 text-base font-medium text-neutral-900 dark:text-neutral-100">
              暂无通行密钥
            </h3>
            <p class="m-0 text-sm text-neutral-500 dark:text-neutral-400">
              添加一个通行密钥以启用无密码登录
            </p>
          </div>
        ) : (
          <NDataTable
            scrollX={Math.max(
              600,
              uiStore.contentWidth.value - uiStore.contentInsetWidth.value,
            )}
            remote
            bordered={false}
            rowClassName={() => 'group'}
            data={passkeys.value}
            columns={[
              {
                key: 'name',
                title: '名称',
                render({ name }) {
                  return (
                    <div class="flex items-baseline gap-2">
                      <FingerprintIcon class="size-4 translate-y-0.5 text-blue-500" />
                      <span class="font-medium">{name}</span>
                    </div>
                  )
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
                title: '操作',
                key: 'id',
                width: 100,
                render({ id, name }) {
                  return (
                    <div class="opacity-0 transition-opacity group-hover:opacity-100">
                      <NPopconfirm
                        positiveText="取消"
                        negativeText="删除"
                        onNegativeClick={() => {
                          onDeleteToken(id)
                        }}
                      >
                        {{
                          trigger: () => (
                            <NButton text type="error">
                              <TrashIcon class="size-4" />
                            </NButton>
                          ),
                          default: () => (
                            <span class="max-w-48">
                              确定要删除 Passkey "{name}"?
                            </span>
                          ),
                        }}
                      </NPopconfirm>
                    </div>
                  )
                },
              },
            ]}
          />
        )}
      </div>
    </SettingsCard>
  )
})

const Oauth = defineComponent(() => {
  const route = useRoute()
  const router = useRouter()

  const oauthDataRef = ref({} as FlatOauthData)
  onMounted(async () => {
    const res = await optionsApi.get<{ data: OauthData }>('oauth')

    oauthDataRef.value = flattenOauthData(res.data)
  })

  useProvideOauthData()(oauthDataRef)

  onMounted(async () => {
    const validate = route.query.validate

    router.replace({ query: { ...route.query, validate: '' } })
    if (validate) {
      const session = await getSession()

      if (session) {
        toast.success('验证成功')

        dialog.create({
          title: '设定为主人账户？',
          positiveText: '是',
          negativeText: '否',

          onPositiveClick(_e) {
            authApi.authAsOwner()
          },
        })
      }
    }
  })

  return () => (
    <SettingsCard
      title="OAuth 登录"
      description="配置第三方账号登录方式"
      icon={ExternalLinkIcon}
    >
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <GitHubProvider />
        <GoogleProvider />
      </div>
    </SettingsCard>
  )
})
