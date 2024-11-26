import {
  NButton,
  NButtonGroup,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NP,
  NSwitch,
} from 'naive-ui'
import type { AuthSocialProviders } from '~/utils/authjs/auth'
import type { FormInst } from 'naive-ui/lib'

import { RESTManager } from '~/utils'
import { authClient } from '~/utils/authjs/auth'

import { useInjectOauthData } from '../providers/oauth'

export const createProvideSectionComponent = (
  type: AuthSocialProviders,
  options: {
    name: string
  },
) =>
  defineComponent({
    setup() {
      const handleValidate = async () => {
        await authClient.signIn.social({
          provider: type,
          callbackURL: `${location.href}?validate=true`,
        })
      }

      const oauthData = useInjectOauthData()
      const formValueRef = ref({
        clientId: '',
        secret: '',
      })
      const isEnabled = ref(false)

      watchEffect(() => {
        if (oauthData.value[type] === undefined) return
        const { clientId, enabled } = oauthData.value[type]
        isEnabled.value = enabled
        formValueRef.value.clientId = clientId
      })

      const formRef = ref<null | FormInst>(null)
      const rules = {
        clientId: [{ required: true, message: 'Client Id 不能为空' }],
        secret: [{ required: true, message: 'Client Secret 不能为空' }],
      }

      const handleSave = async () => {
        await formRef.value?.validate()

        RESTManager.api.options('oauth').patch({
          data: {
            providers: [
              {
                type,
                enabled: isEnabled.value,
              },
            ],
            secrets: {
              [type]: {
                clientSecret: formValueRef.value.secret,
              },
            },
            public: {
              [type]: {
                clientId: formValueRef.value.clientId,
              },
            },
          },
        })
      }

      return () => (
        <NCard title={options.name}>
          {{
            default() {
              return (
                <NForm model={formValueRef.value} ref={formRef} rules={rules}>
                  <NFormItem label="Client Id" path="clientId" required>
                    <NInput
                      value={formValueRef.value.clientId}
                      onUpdateValue={(v) => {
                        formValueRef.value.clientId = v
                      }}
                    />
                  </NFormItem>

                  <NFormItem label="Client Secret" required path="secret">
                    <NInput
                      showPasswordToggle
                      type="password"
                      value={formValueRef.value.secret}
                      onUpdateValue={(v) => {
                        formValueRef.value.secret = v
                      }}
                    />
                  </NFormItem>

                  <NP class={'text-sm'}>
                    <br /> Callback URL 填写{' '}
                    <NButton
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${RESTManager.endpoint}/auth/callback/${type}`,
                        )
                        message.success('已复制到剪贴板')
                      }}
                      text
                    >
                      {RESTManager.endpoint}/auth/callback/{type}
                    </NButton>
                  </NP>
                </NForm>
              )
            },
            action() {
              return (
                <div class={'flex justify-between'}>
                  <label class={'flex items-center gap-2'}>
                    启用
                    <NSwitch
                      value={isEnabled.value}
                      onUpdateValue={(v) => {
                        isEnabled.value = v
                      }}
                    />
                  </label>
                  <NButtonGroup>
                    <NButton onClick={handleValidate} type="tertiary" round>
                      验证
                    </NButton>
                    <NButton onClick={handleSave} type="primary" round>
                      保存
                    </NButton>
                  </NButtonGroup>
                </div>
              )
            },
          }}
        </NCard>
      )
    },
  })

export const GitHubProvider = createProvideSectionComponent('github', {
  name: 'GitHub',
})

export const GoogleProvider = createProvideSectionComponent('google', {
  name: 'Google',
})
