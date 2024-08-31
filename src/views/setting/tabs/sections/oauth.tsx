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
import type { FormInst } from 'naive-ui/lib'

import { RESTManager } from '~/utils'
import { signIn } from '~/utils/authjs'

import { useInjectOauthData } from '../providers/oauth'

export const GitHubProvider = defineComponent({
  setup() {
    const handleValidate = async () => {
      await signIn('github', { callbackUrl: `${location.href}?validate=true` })
    }

    const oauthData = useInjectOauthData()
    const formValueRef = ref({
      clientId: '',
      secret: '',
    })
    const isEnabled = ref(false)

    watchEffect(() => {
      if (oauthData.value.github === undefined) return
      const { clientId, enabled } = oauthData.value.github
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

      const type = 'github'
      RESTManager.api.options('oauth').patch({
        data: {
          providers: [
            {
              type,
              enabled: true,
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
      <NCard title={'GitHub'}>
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
                  请在 GitHub Developer Settings 中创建 OAuth App
                  <br /> Callback URL 填写{' '}
                  <NButton
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${RESTManager.endpoint}/auth/callback/github`,
                      )
                      message.success('已复制到剪贴板')
                    }}
                    text
                  >
                    {RESTManager.endpoint}/auth/callback/github
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
