import {
  ArrowLeft as ArrowLeftIcon,
  Check as CheckIcon,
  ChevronRight as ChevronRightIcon,
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
  NDatePicker,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NPopconfirm,
  NScrollbar,
  NSkeleton,
  NSwitch,
  NText,
} from 'naive-ui'
import {
  computed,
  defineComponent,
  inject,
  onMounted,
  provide,
  reactive,
  ref,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import type { TokenModel } from '~/models/token'
import type { DialogReactive } from 'naive-ui'
import type { InjectionKey, Ref } from 'vue'
import type { FlatOauthData, OauthData } from './providers/oauth'

import { useQuery } from '@tanstack/vue-query'

import { authApi } from '~/api/auth'
import { optionsApi } from '~/api/options'
import { userApi } from '~/api/user'
import { IpInfoPopover } from '~/components/ip-info'
import { useMasterDetailLayout } from '~/components/layout'
import { RelativeTime } from '~/components/time/relative-time'
import { queryKeys } from '~/hooks/queries/keys'
import { SettingsSection } from '~/layouts/settings-layout'
import { RouteName } from '~/router/name'
import { parseDate } from '~/utils'
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

type ActivePanel = 'tokens' | 'passkeys' | null

const ActivePanelKey: InjectionKey<{
  activePanel: Ref<ActivePanel>
  setActivePanel: (panel: ActivePanel) => void
}> = Symbol('activePanel')

const useActivePanel = () => {
  const ctx = inject(ActivePanelKey)
  if (!ctx) throw new Error('useActivePanel must be used within TabAccount')
  return ctx
}

export const TabAccount = defineComponent(() => {
  const activePanel = ref<ActivePanel>(null)
  const { isMobile } = useMasterDetailLayout()

  const setActivePanel = (panel: ActivePanel) => {
    activePanel.value = panel
  }

  provide(ActivePanelKey, { activePanel, setActivePanel })

  const SettingsContent = () => (
    <>
      <SessionSection />
      <ResetPass />
      <ApiTokenEntry />
      <PasskeyEntry />
      <Oauth />
    </>
  )

  const SidePanelContent = () => {
    if (activePanel.value === 'tokens') {
      return <TokenListPanel />
    }
    if (activePanel.value === 'passkeys') {
      return <PasskeyListPanel />
    }
    return null
  }

  const hasPanel = computed(() => activePanel.value !== null)

  const MobileLayout = () => (
    <div class="relative h-full overflow-hidden">
      <div
        class={[
          'absolute inset-0 transition-transform duration-300 ease-out',
          hasPanel.value && '-translate-x-full',
        ]}
      >
        <NScrollbar class="h-full">
          <div class="space-y-8 p-6">
            <SettingsContent />
          </div>
        </NScrollbar>
      </div>

      <div
        class={[
          'absolute inset-0 bg-white transition-transform duration-300 ease-out dark:bg-black',
          hasPanel.value ? 'translate-x-0' : 'translate-x-full',
        ]}
      >
        <SidePanelContent />
      </div>
    </div>
  )

  const DesktopLayout = () => (
    <div class="relative h-full overflow-hidden">
      <div
        class={[
          'absolute inset-y-0 left-0 overflow-hidden transition-all duration-300 ease-out',
          hasPanel.value &&
            'border-r border-neutral-200 dark:border-neutral-800',
        ]}
        style={{ right: hasPanel.value ? '50%' : '0' }}
      >
        <NScrollbar class="h-full">
          <div class="mx-auto max-w-3xl space-y-8 p-6">
            <SettingsContent />
          </div>
        </NScrollbar>
      </div>

      <div
        class={[
          'absolute inset-y-0 right-0 w-1/2 overflow-hidden bg-white transition-transform duration-300 ease-out dark:bg-black',
          hasPanel.value ? 'translate-x-0' : 'translate-x-full',
        ]}
      >
        <SidePanelContent />
      </div>
    </div>
  )

  return () => (isMobile.value ? <MobileLayout /> : <DesktopLayout />)
})

const SessionSection = defineComponent(() => {
  const sessions = ref<Session[]>([])
  const loading = ref(true)
  const expanded = ref(false)
  const MAX_VISIBLE = 5

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

  const visibleSessions = computed(() => {
    if (expanded.value) return sessions.value
    return sessions.value.slice(0, MAX_VISIBLE)
  })

  const hasMore = computed(() => sessions.value.length > MAX_VISIBLE)
  const hiddenCount = computed(() => sessions.value.length - MAX_VISIBLE)

  const SessionItem = ({
    id,
    ua,
    ip,
    date,
    current,
  }: {
    id: string
    ua?: string
    ip?: string
    date: string
    current?: boolean
  }) => (
    <div class="px-4 py-4">
      <div class="mb-2 flex items-center justify-between">
        <span
          class={[
            'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
            current
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
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

      {ua && (
        <div class="mb-2 font-mono text-xs text-neutral-600 dark:text-neutral-300">
          {ua}
        </div>
      )}

      <div class="flex flex-wrap items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
        {ip && (
          <div class="flex items-center gap-1.5">
            <GlobeIcon class="size-3.5" />
            <IpInfoPopover
              ip={ip}
              triggerEl={
                <span class="cursor-pointer hover:underline">{ip}</span>
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
  )

  return () => (
    <SettingsSection
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
        <div class="divide-y divide-neutral-100 dark:divide-neutral-800">
          {visibleSessions.value.map(({ id, ua, ip, date, current }) => (
            <SessionItem
              key={id}
              id={id}
              ua={ua}
              ip={ip}
              date={date}
              current={current}
            />
          ))}

          {hasMore.value && (
            <div class="px-4 py-3">
              <button
                type="button"
                class="flex w-full items-center justify-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                onClick={() => {
                  expanded.value = !expanded.value
                }}
              >
                {expanded.value ? (
                  <>收起</>
                ) : (
                  <>查看更多 ({hiddenCount.value} 个设备)</>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </SettingsSection>
  )
})

const SessionSkeleton = defineComponent(() => {
  return () => (
    <div class="divide-y divide-neutral-100 dark:divide-neutral-800">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} class="py-4">
          <div class="mb-2 flex items-center justify-between">
            <NSkeleton text style={{ width: '80px', height: '22px' }} />
            <NSkeleton text style={{ width: '50px', height: '24px' }} />
          </div>
          <NSkeleton text style={{ width: '100%', height: '16px' }} />
          <div class="mt-2 flex gap-4">
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
    currentPassword: '',
    newPassword: '',
    reenteredPassword: '',
  })
  const formRef = ref<typeof NForm>()
  const router = useRouter()
  const showModal = ref(false)
  const isSubmitting = ref(false)

  const resetForm = () => {
    resetPassword.currentPassword = ''
    resetPassword.newPassword = ''
    resetPassword.reenteredPassword = ''
  }

  const reset = async () => {
    if (!formRef.value || isSubmitting.value) {
      return
    }

    formRef.value.validate(async (err: any) => {
      if (!err) {
        isSubmitting.value = true
        try {
          const result = await authClient.changePassword({
            currentPassword: resetPassword.currentPassword,
            newPassword: resetPassword.newPassword,
            revokeOtherSessions: true,
          })
          if (result.error) {
            toast.error(result.error.message || '密码修改失败')
            return
          }
          toast.success('密码修改成功，请重新登录')
          showModal.value = false
          await authClient.signOut()
          router.push({ name: RouteName.Login })
        } catch (error: any) {
          toast.error(error.message || '密码修改失败')
        } finally {
          isSubmitting.value = false
        }
      }
    })
  }

  function validatePasswordSame(_rule: any, value: string) {
    return value === resetPassword.newPassword
  }

  return () => (
    <>
      <SettingsSection
        title="修改密码"
        description="修改后需要重新登录"
        icon={LockIcon}
      >
        <div class="flex items-center justify-between px-4 py-4">
          <div class="text-sm text-neutral-600 dark:text-neutral-400">
            定期更改密码可以提高账户安全性
          </div>
          <NButton
            size="small"
            type="primary"
            secondary
            onClick={() => {
              resetForm()
              showModal.value = true
            }}
          >
            <LockIcon class="mr-1 size-4" />
            修改密码
          </NButton>
        </div>
      </SettingsSection>

      <NModal
        transformOrigin="center"
        show={showModal.value}
        onUpdateShow={(e) => void (showModal.value = e)}
      >
        <NCard
          bordered={false}
          title="修改密码"
          class="w-[400px] max-w-full"
          closable
          onClose={() => void (showModal.value = false)}
        >
          <NForm
            ref={formRef}
            model={resetPassword}
            labelPlacement="top"
            showRequireMark={false}
            rules={{
              currentPassword: [
                {
                  required: true,
                  message: '请输入当前密码',
                },
              ],
              newPassword: [
                {
                  required: true,
                  message: '请输入新密码',
                },
              ],
              reenteredPassword: [
                {
                  required: true,
                  message: '请再次输入新密码',
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
            <NFormItem label="当前密码" path="currentPassword">
              <NInput
                {...autosizeableProps}
                value={resetPassword.currentPassword}
                onInput={(e) => void (resetPassword.currentPassword = e)}
                type="password"
                showPasswordOn="click"
                placeholder="输入当前密码"
              />
            </NFormItem>
            <NFormItem label="新密码" path="newPassword">
              <NInput
                {...autosizeableProps}
                value={resetPassword.newPassword}
                onInput={(e) => void (resetPassword.newPassword = e)}
                type="password"
                showPasswordOn="click"
                placeholder="输入新密码"
              />
            </NFormItem>
            <NFormItem label="确认新密码" path="reenteredPassword">
              <NInput
                {...autosizeableProps}
                value={resetPassword.reenteredPassword}
                onInput={(e) => void (resetPassword.reenteredPassword = e)}
                type="password"
                showPasswordOn="click"
                placeholder="再次输入新密码"
              />
            </NFormItem>
          </NForm>

          <div class="flex justify-end gap-3">
            <NButton onClick={() => void (showModal.value = false)}>
              取消
            </NButton>
            <NButton
              onClick={reset}
              type="primary"
              loading={isSubmitting.value}
            >
              <ShieldIcon class="mr-1 size-4" />
              确认修改
            </NButton>
          </div>
        </NCard>
      </NModal>
    </>
  )
})

const ApiTokenEntry = defineComponent(() => {
  const { activePanel, setActivePanel } = useActivePanel()
  const { data: tokens, isLoading } = useQuery({
    queryKey: queryKeys.auth.tokens(),
    queryFn: () => authApi.getTokens(),
  })

  const isActive = computed(() => activePanel.value === 'tokens')

  return () => (
    <SettingsSection
      title="API Token"
      description="用于 API 调用的访问令牌"
      icon={KeyIcon}
    >
      <button
        type="button"
        class={[
          'flex w-full items-center justify-between px-4 py-4 text-left transition-colors',
          isActive.value
            ? 'bg-neutral-100 dark:bg-neutral-800'
            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
        ]}
        onClick={() => setActivePanel(isActive.value ? null : 'tokens')}
      >
        <div>
          <div class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            管理 API Token
          </div>
          <div class="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            {isLoading.value
              ? '加载中...'
              : `已创建 ${tokens.value?.length ?? 0} 个 Token`}
          </div>
        </div>
        <ChevronRightIcon
          class={[
            'size-5 text-neutral-400 transition-transform',
            isActive.value && 'rotate-90',
          ]}
        />
      </button>
    </SettingsSection>
  )
})

const TokenListPanel = defineComponent(() => {
  const { setActivePanel } = useActivePanel()
  const {
    data: tokens,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: queryKeys.auth.tokens(),
    queryFn: () => authApi.getTokens(),
  })

  const newTokenDialogShow = ref(false)
  const tokenDisplayDialogShow = ref(false)
  const createdTokenInfo = ref<TokenModel | null>(null)
  const visibleTokens = ref<Set<string>>(new Set())

  const defaultModel = () => ({
    name: '',
    expired: false,
    expiredTime: new Date(),
  })
  const dataModel = reactive(defaultModel())

  const copyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token)
      toast.success('Token 已复制到剪贴板')
    } catch {
      toast.error('复制失败')
    }
  }

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
      } catch {}
      newTokenDialogShow.value = false
      Object.assign(dataModel, defaultModel())
      createdTokenInfo.value = response
      tokenDisplayDialogShow.value = true
      refetch()
    } catch {
      toast.error('创建 Token 失败')
    }
  }

  const onDeleteToken = async (id: string) => {
    await authApi.deleteToken(id)
    toast.success('删除成功')
    refetch()
  }

  const toggleTokenVisibility = async (tokenData: TokenModel) => {
    const tokenId = tokenData.id
    if (visibleTokens.value.has(tokenId)) {
      visibleTokens.value.delete(tokenId)
    } else {
      try {
        const response = await authApi.getToken(tokenId)
        if (tokens.value) {
          const index = tokens.value.findIndex((i) => i.id === tokenId)
          if (index !== -1) {
            tokens.value[index].token = response.token
          }
        }
        visibleTokens.value.add(tokenId)
      } catch {
        toast.error('获取 Token 详情失败')
      }
    }
  }

  const TokenItem = ({ token: tokenData }: { token: TokenModel }) => {
    const { id, name, token, created, expired } = tokenData
    const isVisible = visibleTokens.value.has(id)

    return (
      <div class="group px-4 py-4">
        <div class="mb-2 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <KeyIcon class="size-4 text-neutral-400" />
            <span class="font-medium text-neutral-900 dark:text-neutral-100">
              {name}
            </span>
          </div>
          <div class="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <NButton
              text
              type="primary"
              size="tiny"
              onClick={() => toggleTokenVisibility(tokenData)}
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
              onNegativeClick={() => onDeleteToken(id)}
            >
              {{
                trigger: () => (
                  <NButton text type="error" size="tiny">
                    <TrashIcon class="size-4" />
                  </NButton>
                ),
                default: () => (
                  <span class="max-w-48">确定要删除 Token "{name}"?</span>
                ),
              }}
            </NPopconfirm>
          </div>
        </div>

        <div class="mb-2">
          {isVisible && token && token !== '*'.repeat(40) ? (
            <button
              type="button"
              class="max-w-full truncate font-mono text-xs text-blue-600 hover:underline dark:text-blue-400"
              onClick={() => copyToken(token)}
            >
              {token}
            </button>
          ) : (
            <span class="font-mono text-xs text-neutral-400">
              {'•'.repeat(24)}
            </span>
          )}
        </div>

        <div class="flex flex-wrap items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
          <span>
            创建于 <RelativeTime time={created} />
          </span>
          <span>
            {expired ? (
              <>过期时间: {parseDate(expired, 'yyyy 年 M 月 d 日')}</>
            ) : (
              '永不过期'
            )}
          </span>
        </div>
      </div>
    )
  }

  return () => (
    <>
      <div class="flex h-full flex-col">
        <div class="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800">
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="flex size-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              onClick={() => setActivePanel(null)}
            >
              <ArrowLeftIcon class="size-5" />
            </button>
            <h2 class="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              API Token
            </h2>
          </div>
          <NButton
            type="primary"
            size="small"
            onClick={() => {
              newTokenDialogShow.value = true
            }}
          >
            <PlusIcon class="mr-1 size-4" />
            新增
          </NButton>
        </div>

        <NScrollbar class="min-h-0 flex-1">
          {isLoading.value ? (
            <div class="space-y-4 p-4">
              <NSkeleton text style={{ width: '100%', height: '80px' }} />
              <NSkeleton text style={{ width: '100%', height: '80px' }} />
            </div>
          ) : !tokens.value?.length ? (
            <div class="flex flex-col items-center justify-center py-16 text-center">
              <div class="mb-3 flex size-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500">
                <KeyIcon class="size-6" />
              </div>
              <h3 class="m-0 mb-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                暂无 Token
              </h3>
              <p class="m-0 text-xs text-neutral-500 dark:text-neutral-400">
                创建一个 Token 以便 API 调用
              </p>
            </div>
          ) : (
            <div class="divide-y divide-neutral-100 dark:divide-neutral-800">
              {tokens.value.map((token) => (
                <TokenItem key={token.id} token={token} />
              ))}
            </div>
          )}
        </NScrollbar>
      </div>

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
                    onClick={() => {
                      if (createdTokenInfo.value?.token) {
                        copyToken(createdTokenInfo.value.token)
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

const PasskeyEntry = defineComponent(() => {
  const { activePanel, setActivePanel } = useActivePanel()
  const { data: passkeys, isLoading } = useQuery({
    queryKey: queryKeys.auth.passkeys(),
    queryFn: () => authApi.getPasskeys(),
  })

  const { data: setting, refetch: refetchSetting } = useQuery({
    queryKey: queryKeys.options.detail('authSecurity'),
    queryFn: async () => {
      const res = await optionsApi.get<{
        data: { disablePasswordLogin: boolean }
      }>('authSecurity')
      return res.data
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

  const isActive = computed(() => activePanel.value === 'passkeys')

  return () => (
    <SettingsSection
      title="通行密钥"
      description="使用生物识别或安全密钥登录"
      icon={FingerprintIcon}
    >
      <div class="flex items-center justify-between px-4 py-4">
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

      <button
        type="button"
        class={[
          'flex w-full items-center justify-between border-t border-neutral-100 px-4 py-4 text-left transition-colors dark:border-neutral-800',
          isActive.value
            ? 'bg-neutral-100 dark:bg-neutral-800'
            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
        ]}
        onClick={() => setActivePanel(isActive.value ? null : 'passkeys')}
      >
        <div>
          <div class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            管理通行密钥
          </div>
          <div class="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            {isLoading.value
              ? '加载中...'
              : `已添加 ${passkeys.value?.length ?? 0} 个通行密钥`}
          </div>
        </div>
        <ChevronRightIcon
          class={[
            'size-5 text-neutral-400 transition-transform',
            isActive.value && 'rotate-90',
          ]}
        />
      </button>
    </SettingsSection>
  )
})

const PasskeyListPanel = defineComponent(() => {
  const { setActivePanel } = useActivePanel()
  const {
    data: passkeys,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: queryKeys.auth.passkeys(),
    queryFn: () => authApi.getPasskeys(),
  })

  const onDeletePasskey = (id: string) => {
    authApi.deletePasskey(id).then(() => {
      refetch()
    })
  }

  const NewModalContent = defineComponent(
    (props: { dialog: DialogReactive }) => {
      const name = ref('')
      const handleCreate = (e: Event) => {
        e.preventDefault()
        e.stopPropagation()
        AuthnUtils.createPassKey(name.value).then(() => {
          refetch()
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

  // @ts-ignore
  NewModalContent.props = ['dialog']

  const PasskeyItem = ({
    passkey,
  }: {
    passkey: { credentialID: string; name: string }
  }) => (
    <div class="group px-4 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <FingerprintIcon class="size-4 text-blue-500" />
          <span class="font-medium text-neutral-900 dark:text-neutral-100">
            {passkey.name}
          </span>
        </div>
        <div class="opacity-0 transition-opacity group-hover:opacity-100">
          <NPopconfirm
            positiveText="取消"
            negativeText="删除"
            onNegativeClick={() => onDeletePasskey(passkey.credentialID)}
          >
            {{
              trigger: () => (
                <NButton text type="error" size="tiny">
                  <TrashIcon class="size-4" />
                </NButton>
              ),
              default: () => (
                <span class="max-w-48">
                  确定要删除 Passkey "{passkey.name}"?
                </span>
              ),
            }}
          </NPopconfirm>
        </div>
      </div>
    </div>
  )

  return () => (
    <div class="flex h-full flex-col">
      <div class="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800">
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="flex size-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
            onClick={() => setActivePanel(null)}
          >
            <ArrowLeftIcon class="size-5" />
          </button>
          <h2 class="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            通行密钥
          </h2>
        </div>
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
      </div>

      <NScrollbar class="min-h-0 flex-1">
        {isLoading.value ? (
          <div class="space-y-4 p-4">
            <NSkeleton text style={{ width: '100%', height: '60px' }} />
            <NSkeleton text style={{ width: '100%', height: '60px' }} />
          </div>
        ) : !passkeys.value?.length ? (
          <div class="flex flex-col items-center justify-center py-16 text-center">
            <div class="mb-3 flex size-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500">
              <FingerprintIcon class="size-6" />
            </div>
            <h3 class="m-0 mb-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
              暂无通行密钥
            </h3>
            <p class="m-0 text-xs text-neutral-500 dark:text-neutral-400">
              添加一个通行密钥以启用无密码登录
            </p>
          </div>
        ) : (
          <div class="divide-y divide-neutral-100 dark:divide-neutral-800">
            {passkeys.value.map((passkey) => (
              <PasskeyItem key={passkey.credentialID} passkey={passkey} />
            ))}
          </div>
        )}
      </NScrollbar>
    </div>
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
    <SettingsSection
      title="OAuth 登录"
      description="配置第三方账号登录方式"
      icon={ExternalLinkIcon}
    >
      <div class="divide-y divide-neutral-100 dark:divide-neutral-800">
        <GitHubProvider />
        <GoogleProvider />
      </div>
    </SettingsSection>
  )
})
