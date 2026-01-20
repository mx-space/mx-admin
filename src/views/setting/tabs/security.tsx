import {
  Check as CheckIcon,
  Copy as CopyIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Globe as GlobeIcon,
  Key as KeyIcon,
  Lock as LockIcon,
  Monitor as MonitorIcon,
  Plus as PlusIcon,
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
import { useRouter } from 'vue-router'
import type { TokenModel } from '~/models/token'

import { authApi } from '~/api/auth'
import { userApi } from '~/api/user'
import { IpInfoPopover } from '~/components/ip-info'
import { RelativeTime } from '~/components/time/relative-time'
import { useStoreRef } from '~/hooks/use-store-ref'
import { RouteName } from '~/router/name'
import { UIStore } from '~/stores/ui'
import { parseDate, removeToken } from '~/utils'
import { authClient } from '~/utils/authjs/auth'

import styles from '../index.module.css'
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
    <div class={styles.tabContent}>
      {/* Sessions Section */}
      <div class={styles.settingsGroup}>
        <div class={styles.sectionHeader}>
          <div>
            <h2 class={styles.sectionTitle}>
              <MonitorIcon
                class="mr-2 inline-block size-5"
                aria-hidden="true"
              />
              登录设备
            </h2>
            <p class={styles.sectionSubtitle}>管理你的登录会话，保护账户安全</p>
          </div>
          <NPopconfirm onPositiveClick={handleKickAll}>
            {{
              trigger: () => (
                <NButton
                  size="small"
                  type="error"
                  tertiary
                  disabled={
                    sessions.value.length === 1 && sessions.value[0]?.current
                  }
                >
                  <TrashIcon class="mr-1 size-4" />
                  踢掉全部
                </NButton>
              ),
              default: () => '确定踢掉全部登录设备（除当前会话）？',
            }}
          </NPopconfirm>
        </div>

        {loading.value ? (
          <SessionSkeleton />
        ) : (
          <div class={styles.sessionList}>
            {sessions.value.map(({ id, ua, ip, date, current }) => (
              <div
                key={id}
                class={[
                  styles.sessionItem,
                  current && styles.sessionItemCurrent,
                ]}
              >
                <div class={styles.sessionHeader}>
                  <span
                    class={[
                      styles.sessionBadge,
                      current
                        ? styles.sessionBadgeCurrent
                        : styles.sessionBadgeOther,
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

                  <NPopconfirm
                    onPositiveClick={() => handleKick(!!current, id)}
                  >
                    {{
                      trigger: () => (
                        <NButton
                          size="small"
                          type={current ? 'warning' : 'error'}
                          tertiary
                        >
                          {current ? '注销' : '踢出'}
                        </NButton>
                      ),
                      default: () =>
                        current ? '确定要注销当前会话？' : '确定要踢出此设备？',
                    }}
                  </NPopconfirm>
                </div>

                <div class={styles.sessionContent}>
                  {ua && <div class={styles.sessionUA}>{ua}</div>}

                  <div class="mt-3 flex flex-wrap items-center gap-4 text-sm">
                    {ip && (
                      <div class={styles.sessionRow}>
                        <GlobeIcon class="size-4 text-neutral-400" />
                        <IpInfoPopover
                          ip={ip}
                          triggerEl={
                            <NButton quaternary size="tiny" type="primary">
                              {ip}
                            </NButton>
                          }
                        />
                      </div>
                    )}

                    <div class={styles.sessionRow}>
                      <span class={styles.sessionLabel}>
                        {current ? '活跃时间:' : '登录时间:'}
                      </span>
                      <RelativeTime time={date} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Password Reset Section */}
      <div class={styles.settingsGroup}>
        <ResetPass />
      </div>

      {/* API Token Section */}
      <div class={styles.settingsGroup}>
        <ApiToken />
      </div>
    </div>
  )
})

const SessionSkeleton = defineComponent(() => {
  return () => (
    <div class={styles.sessionList}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} class={styles.sessionItem}>
          <div class={styles.sessionHeader}>
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
      message.error('创建 Token 失败，请重试')
    }
  }

  const onDeleteToken = async (id: string) => {
    await authApi.deleteToken(id)
    message.success('删除成功')
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
        message.error('获取Token详情失败，请重试')
      }
    }
  }

  const copyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token)
      message.success('Token 已复制到剪贴板')
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
        message.success('Token 已复制到剪贴板')
      } catch {
        message.error('复制失败，请手动复制Token')
      }
      document.body.removeChild(textArea)
    }
  }

  const uiStore = useStoreRef(UIStore)

  return () => (
    <>
      <div class={styles.tokenCard}>
        <div class={styles.tokenHeader}>
          <div>
            <h3 class={styles.tokenTitle}>
              <KeyIcon class="mr-2 inline-block size-5" aria-hidden="true" />
              API Token
            </h3>
            <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              用于 API 调用的访问令牌
            </p>
          </div>
          <NButton
            type="primary"
            onClick={() => {
              newTokenDialogShow.value = true
            }}
          >
            <PlusIcon class="mr-1 size-4" />
            新增 Token
          </NButton>
        </div>

        {loading.value ? (
          <NSkeleton text style={{ width: '100%', height: '200px' }} />
        ) : (
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
                    <div class="flex items-center gap-2">
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
      </div>

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
              <div class={styles.infoRow}>
                <span class={styles.infoLabel}>Token 名称:</span>
                <span class={styles.infoValue}>
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
                <div class={styles.infoRow}>
                  <span class={styles.infoLabel}>过期时间:</span>
                  <span class={styles.infoValue}>
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
        message.success('密码修改成功，请重新登录')
        removeToken()
        router.push({ name: RouteName.Login })
      }
    })
  }

  function validatePasswordSame(_rule: any, value: string) {
    return value === resetPassword.password
  }

  return () => (
    <div class={styles.passwordSection}>
      <div class={styles.passwordHeader}>
        <div class={styles.passwordIcon}>
          <LockIcon />
        </div>
        <div>
          <h3 class={styles.passwordTitle}>修改密码</h3>
          <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            修改后需要重新登录
          </p>
        </div>
      </div>

      <NForm
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
        <div class="grid gap-4 md:grid-cols-2">
          <NFormItem label="新密码" required path="password">
            <NInput
              {...autosizeableProps}
              value={resetPassword.password}
              onInput={(e) => void (resetPassword.password = e)}
              type="password"
              showPasswordOn="click"
              placeholder="输入新密码"
            />
          </NFormItem>
          <NFormItem label="确认密码" required path="reenteredPassword">
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

        <div class="mt-4 flex justify-end">
          <NButton onClick={reset} type="primary">
            <ShieldIcon class="mr-1 size-4" />
            修改密码
          </NButton>
        </div>
      </NForm>
    </div>
  )
})
