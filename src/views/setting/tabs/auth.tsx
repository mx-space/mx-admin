import {
  ExternalLink as ExternalLinkIcon,
  Fingerprint as FingerprintIcon,
  Key as KeyIcon,
  Plus as PlusIcon,
  ShieldCheck as ShieldCheckIcon,
  Trash2 as TrashIcon,
} from 'lucide-vue-next'
import {
  NButton,
  NCard,
  NDataTable,
  NForm,
  NFormItem,
  NInput,
  NPopconfirm,
  NSkeleton,
  NSwitch,
} from 'naive-ui'
import useSWRV from 'swrv'
import { defineComponent, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { AuthnModel } from '~/models/authn'
import type { DialogReactive } from 'naive-ui'
import type { FlatOauthData, OauthData } from './providers/oauth'

import { RelativeTime } from '~/components/time/relative-time'
import { useStoreRef } from '~/hooks/use-store-ref'
import { UIStore } from '~/stores/ui'
import { RESTManager } from '~/utils'
import { getSession } from '~/utils/authjs/session'
import { AuthnUtils } from '~/utils/authn'

import styles from '../index.module.css'
import { flattenOauthData, useProvideOauthData } from './providers/oauth'
import { GitHubProvider, GoogleProvider } from './sections/oauth'

export const TabAuth = defineComponent({
  setup() {
    return () => (
      <div class={styles.tabContent}>
        <Passkey />
        <Oauth />
      </div>
    )
  },
})

const Passkey = defineComponent(() => {
  const uiStore = useStoreRef(UIStore)
  const { data: passkeys, mutate: refetchTable } = useSWRV(
    'passkey-table',
    () => {
      return RESTManager.api.passkey.items.get<AuthnModel[]>()
    },
  )

  const onDeleteToken = (id: string) => {
    RESTManager.api.passkey
      .items(id)
      .delete<{}>()
      .then(() => {
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

  const { data: setting, mutate: refetchSetting } = useSWRV(
    'current-disable-status',
    async () => {
      const { data } = await RESTManager.api.options('authSecurity').get<{
        data: { disablePasswordLogin: boolean }
      }>()
      return data
    },
  )

  const updateSetting = (value: boolean) => {
    RESTManager.api
      .options('authSecurity')
      .patch({
        data: {
          disablePasswordLogin: value,
        },
      })
      .then(() => {
        refetchSetting()
      })
  }

  // @ts-ignore
  NewModalContent.props = ['dialog']

  return () => (
    <NCard size="small">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            <FingerprintIcon
              class="mr-2 inline-block size-5"
              aria-hidden="true"
            />
            通行密钥
          </h2>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">
            使用生物识别或安全密钥登录
          </p>
        </div>
        <div class="flex items-center gap-2">
          <NButton
            type="tertiary"
            onClick={() => {
              AuthnUtils.validate(true)
            }}
          >
            <ShieldCheckIcon class="mr-1 size-4" />
            验证
          </NButton>
          <NButton
            type="primary"
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

      <div class="mb-4 flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
        <div class="flex flex-col gap-0.5">
          <span class="text-sm font-medium text-neutral-700 dark:text-neutral-200">
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
              message.error('至少需要一个 Passkey 才能开启这个功能')
              return
            }
            updateSetting(v)
          }}
        />
      </div>

      <div>
        {!passkeys.value ? (
          <NSkeleton text style={{ width: '100%', height: '150px' }} />
        ) : passkeys.value.length === 0 ? (
          <div class={styles.empty}>
            <div class={styles.emptyIcon}>
              <KeyIcon />
            </div>
            <h3 class={styles.emptyTitle}>暂无通行密钥</h3>
            <p class={styles.emptyDescription}>
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
            data={passkeys.value}
            columns={[
              {
                key: 'name',
                title: '名称',
                render({ name }) {
                  return (
                    <div class="flex items-center gap-2">
                      <FingerprintIcon class="size-4 text-blue-500" />
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
                  )
                },
              },
            ]}
          />
        )}
      </div>
    </NCard>
  )
})

const Oauth = defineComponent(() => {
  const route = useRoute()
  const router = useRouter()

  const oauthDataRef = ref({} as FlatOauthData)
  onMounted(async () => {
    const data = await RESTManager.api.options('oauth').get<{
      data: OauthData
    }>()

    oauthDataRef.value = flattenOauthData(data.data)
  })

  useProvideOauthData()(oauthDataRef)

  onMounted(async () => {
    const validate = route.query.validate

    router.replace({ query: { ...route.query, validate: '' } })
    if (validate) {
      const session = await getSession()

      if (session) {
        message.success('验证成功')

        dialog.create({
          title: '设定为主人账户？',
          positiveText: '是',
          negativeText: '否',

          onPositiveClick(_e) {
            RESTManager.api.auth('as-owner').patch()
          },
        })
      }
    }
  })

  return () => (
    <section class={[styles.settingsGroup, 'mt-8']}>
      <div class={styles.sectionHeader}>
        <div>
          <h2 class={styles.sectionTitle}>
            <ExternalLinkIcon
              class="mr-2 inline-block size-5"
              aria-hidden="true"
            />
            OAuth 登录
          </h2>
          <p class={styles.sectionSubtitle}>配置第三方账号登录方式</p>
        </div>
      </div>

      <div class={styles.authGrid}>
        <GitHubProvider />
        <GoogleProvider />
      </div>
    </section>
  )
})
