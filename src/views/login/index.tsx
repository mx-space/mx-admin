import { KeyRound as PassKeyOutlineIcon } from 'lucide-vue-next'
import { NButton, useMessage } from 'naive-ui'
import useSWRV from 'swrv'
import { defineComponent, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { AuthSocialProviders } from '~/utils/authjs/auth'
import type { UserModel } from '../../models/user'

import ParallaxButton from '~/components/button/parallax-button.vue'
import { SESSION_WITH_LOGIN } from '~/constants/keys'
import { authClient } from '~/utils/authjs/auth'
import { AuthnUtils } from '~/utils/authn'

import Avatar from '../../components/avatar/index.vue'
import { useUserStore } from '../../stores/user'
import { checkIsInit } from '../../utils/is-init'
import { RESTManager } from '../../utils/rest'
import styles from './index.module.css'

const GithubIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24">
    <path
      d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33c.85 0 1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"
      fill="#fff"
    />
  </svg>
)

export const LoginView = defineComponent({
  setup() {
    const userStore = useUserStore()

    const { updateToken } = userStore

    const { user } = storeToRefs(userStore)

    const router = useRouter()
    const inputRef = ref<HTMLInputElement>(null!)

    onBeforeMount(async () => {
      const isInit = await checkIsInit()
      if (!isInit) {
        return router.replace('/setup')
      }
      await userStore.fetchUser()
    })

    onMounted(() => {
      if (!inputRef.value) return
      inputRef.value.focus()

      document.addEventListener('keydown', (_e) => {
        inputRef.value.focus()
      })

      onBeforeUnmount(() => {
        document.onkeydown = null
      })
    })

    const postSuccessfulLogin = (token: string) => {
      updateToken(token)
      router.push(
        route.query.from ? decodeURI(route.query.from as string) : '/dashboard',
      )
      sessionStorage.setItem(SESSION_WITH_LOGIN, '1')
      toast.success('欢迎回来')
    }

    const { data: settings } = useSWRV('allow-password', async () => {
      return RESTManager.api.user('allow-login').get<
        {
          password: boolean
          passkey: boolean
        } & Record<AuthSocialProviders, boolean>
      >()
    })

    let triggerAuthnOnce = false

    const passkeyAuth = () => {
      AuthnUtils.validate().then((res) => {
        if (!res) {
          message.error('验证失败')
        }
        const token = res.token!

        postSuccessfulLogin(token)
      })
    }
    watchEffect(() => {
      if (triggerAuthnOnce) return
      if (settings.value?.password === false) {
        triggerAuthnOnce = true
        passkeyAuth()
      }
    })

    const toast = useMessage()

    const password = ref('')
    const route = useRoute()
    const handleLogin = async (e: Event) => {
      e?.stopPropagation()
      e.preventDefault()
      try {
        if (!user.value || !user.value.username) {
          toast.error('主人信息无法获取')
          return
        }
        const res = await RESTManager.api.master.login.post<{
          token: string & UserModel
        }>({
          data: {
            username: user.value?.username,
            password: password.value,
          },
        })

        if (res.token) {
          postSuccessfulLogin(res.token)
        }
      } catch {
        toast.error('登录失败')
      }
    }

    return () => {
      const showPasswordInput =
        typeof settings.value === 'undefined' ||
        settings.value?.password === true

      return (
        <div class={styles.r}>
          <div class="wrapper">
            <Avatar src={user.value?.avatar} size={80} />

            {showPasswordInput && (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleLogin(e)
                }}
              >
                <div class="input-wrap">
                  <input
                    ref={inputRef}
                    value={password.value}
                    onInput={(e: any) => {
                      password.value = e.target.value
                    }}
                    type="password"
                  />
                </div>

                <div class={'flex items-center gap-4'}>
                  {settings.value?.passkey && (
                    <div
                      class={'-mt-4 mb-4 flex w-full justify-center space-x-4'}
                    >
                      <NButton
                        color="#ACA8BF70"
                        circle
                        textColor="#fff"
                        type="info"
                        onClick={() => {
                          passkeyAuth()
                        }}
                      >
                        <PassKeyOutlineIcon />
                      </NButton>
                    </div>
                  )}

                  {settings.value?.github && (
                    <div
                      class={'-mt-4 mb-4 flex w-full justify-center space-x-4'}
                    >
                      <NButton
                        color="#ACA8BF70"
                        circle
                        textColor="#fff"
                        type="info"
                        onClick={() => {
                          authClient.signIn.social({
                            provider: 'github',
                            callbackURL: `${window.location.origin}${window.location.pathname}#${route.query.to || ''}`,
                          })
                        }}
                      >
                        <GithubIcon />
                      </NButton>
                    </div>
                  )}
                  {settings.value?.google && (
                    <div
                      class={'-mt-4 mb-4 flex w-full justify-center space-x-4'}
                    >
                      <NButton
                        color="#ACA8BF70"
                        circle
                        type="info"
                        onClick={() => {
                          authClient.signIn.social({
                            provider: 'google',
                            callbackURL: `${window.location.origin}${window.location.pathname}#${route.query.to || ''}`,
                          })
                        }}
                      >
                        <img
                          class="h-4 w-4 grayscale filter"
                          src={`https://authjs.dev/img/providers/${'google'}.svg`}
                        />
                      </NButton>
                    </div>
                  )}
                </div>
                <ParallaxButton
                  title="登录"
                  class="p-button-raised p-button-rounded"
                  onClick={handleLogin}
                />
              </form>
            )}
          </div>
        </div>
      )
    }
  },
})

export default LoginView
