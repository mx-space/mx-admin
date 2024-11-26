import {
  NButton,
  NButtonGroup,
  NDataTable,
  NForm,
  NFormItem,
  NH2,
  NInput,
  NLayoutContent,
  NPopconfirm,
  NSpace,
  NSwitch,
  NText,
} from 'naive-ui'
import useSWRV from 'swrv'
import { defineComponent, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { AuthnModel } from '~/models/authn'
import type { DialogReactive } from 'naive-ui'
import type { FlatOauthData, OauthData } from './providers/oauth'

import { Icon } from '@vicons/utils'

import { CheckIcon, PlusIcon as Plus } from '~/components/icons'
import { RelativeTime } from '~/components/time/relative-time'
import { useStoreRef } from '~/hooks/use-store-ref'
import { UIStore } from '~/stores/ui'
import { RESTManager } from '~/utils'
import { getSession } from '~/utils/authjs/session'
import { AuthnUtils } from '~/utils/authn'

import { flattenOauthData, useProvideOauthData } from './providers/oauth'
import { GitHubProvider, GoogleProvider } from './sections/oauth'

export const TabAuth = defineComponent({
  setup() {
    return () => (
      <div>
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
            />
          </NFormItem>
          <div class={'flex justify-end'}>
            <NButton
              disabled={name.value.length === 0}
              type="primary"
              onClick={handleCreate}
              round
              size="small"
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
    <NLayoutContent embedded class="!overflow-visible">
      <div class={'flex items-center justify-between'}>
        <NH2 class={'mb-0'}>通行秘钥</NH2>
        <NButtonGroup>
          <NButton
            type="tertiary"
            onClick={() => {
              AuthnUtils.validate(true)
            }}
            round
          >
            <Icon>
              <CheckIcon />
            </Icon>
            <span class="ml-2">验证</span>
          </NButton>
          <NButton
            round
            type="primary"
            onClick={() => {
              const $dialog = dialog.create({
                title: '创建 Passkey',
                content: () => <NewModalContent dialog={$dialog} />,
              })
            }}
          >
            <Icon>
              <Plus />
            </Icon>
            <span class="ml-2">新增</span>
          </NButton>
        </NButtonGroup>
      </div>
      <NForm class={'mt-4'} labelAlign="left" labelPlacement="left">
        <NFormItem label="禁止密码登入">
          <NSwitch
            value={setting.value?.disablePasswordLogin}
            onUpdateValue={(v) => {
              if (!passkeys.value?.length) {
                message.error('至少需要一个 Passkey 才能开启这个功能')
              }
              updateSetting(v)
            }}
          />
        </NFormItem>
        <div class={'-mt-8 mb-4'}>
          <NText class="mb-2 text-xs" depth={3}>
            <span>禁用密码登录需要至少开启 Oauth 或者 PassKey 登录的一项</span>
          </NText>
        </div>
      </NForm>
      <NDataTable
        scrollX={Math.max(
          800,
          uiStore.contentWidth.value - uiStore.contentInsetWidth.value,
        )}
        remote
        bordered={false}
        data={passkeys.value}
        columns={[
          { key: 'name', title: '名称' },

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
            render({ id, name }) {
              return (
                <NSpace>
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
                        <span class="max-w-48">
                          确定要删除 Passkey "{name}"?
                        </span>
                      ),
                    }}
                  </NPopconfirm>
                </NSpace>
              )
            },
          },
        ]}
      ></NDataTable>
    </NLayoutContent>
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

          onPositiveClick(e) {
            RESTManager.api.auth('as-owner').patch()
          },
        })
      }
    }
  })

  return () => (
    <NLayoutContent embedded class="mt-12 !overflow-visible">
      <NH2 class={'mb-0'}>OAuth</NH2>
      <div class={'mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'}>
        <GitHubProvider />
        <GoogleProvider />
      </div>
    </NLayoutContent>
  )
})
