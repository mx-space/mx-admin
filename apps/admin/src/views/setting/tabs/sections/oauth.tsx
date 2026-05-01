import { Copy as CopyIcon, Github as GithubIcon } from 'lucide-vue-next'
import { NButton, NForm, NFormItem, NInput, NSwitch } from 'naive-ui'
import { defineComponent, ref, watchEffect } from 'vue'
import { toast } from 'vue-sonner'
import type { AuthSocialProviders } from '~/utils/authjs/auth'
import type { FormInst } from 'naive-ui/lib'

import { optionsApi } from '~/api/options'
import { API_URL } from '~/constants/env'
import { authClient } from '~/utils/authjs/auth'

import { useInjectOauthData } from '../providers/oauth'

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" class="size-5">
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="currentColor"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="currentColor"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="currentColor"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
)

const providerIcons: Record<string, any> = {
  github: GithubIcon,
  google: GoogleIcon,
}

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

        await optionsApi.patch('oauth', {
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
        })
        toast.success('保存成功')
      }

      const copyCallbackUrl = async () => {
        const url = `${API_URL}/auth/callback/${type}`
        try {
          await navigator.clipboard.writeText(url)
          toast.success('已复制到剪贴板')
        } catch {
          toast.error('复制失败')
        }
      }

      const IconComponent = providerIcons[type] || GithubIcon

      return () => (
        <div class="px-4 py-4">
          {/* Header */}
          <div class="mb-4 flex items-center gap-3">
            <div class="flex size-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
              <IconComponent class="size-4" />
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {options.name}
              </h3>
            </div>
            <NSwitch
              size="small"
              value={isEnabled.value}
              onUpdateValue={(v) => {
                isEnabled.value = v
              }}
            />
          </div>

          {/* Form */}
          <NForm
            model={formValueRef.value}
            ref={formRef}
            rules={rules}
            labelPlacement="top"
            showRequireMark={false}
          >
            <NFormItem label="Client ID" path="clientId">
              <NInput
                size="small"
                value={formValueRef.value.clientId}
                onUpdateValue={(v) => {
                  formValueRef.value.clientId = v
                }}
                placeholder="输入 Client ID"
              />
            </NFormItem>

            <NFormItem label="Client Secret" path="secret">
              <NInput
                size="small"
                showPasswordToggle
                type="password"
                value={formValueRef.value.secret}
                onUpdateValue={(v) => {
                  formValueRef.value.secret = v
                }}
                placeholder="输入 Client Secret"
              />
            </NFormItem>
          </NForm>

          {/* Callback URL */}
          <div class="mb-4 mt-2">
            <div class="mb-1 text-xs text-neutral-500 dark:text-neutral-400">
              Callback URL
            </div>
            <div class="flex items-center gap-2">
              <span class="flex-1 truncate font-mono text-xs text-neutral-600 dark:text-neutral-400">
                {API_URL}/auth/callback/{type}
              </span>
              <button
                type="button"
                class="hover:text-primary text-neutral-400 transition-colors"
                onClick={copyCallbackUrl}
              >
                <CopyIcon class="size-3.5" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div class="flex items-center justify-end gap-2">
            <NButton onClick={handleValidate} size="tiny" quaternary>
              验证连接
            </NButton>
            <NButton onClick={handleSave} type="primary" size="tiny" secondary>
              保存配置
            </NButton>
          </div>
        </div>
      )
    },
  })

export const GitHubProvider = createProvideSectionComponent('github', {
  name: 'GitHub',
})

export const GoogleProvider = createProvideSectionComponent('google', {
  name: 'Google',
})
