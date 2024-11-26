import { NButton, useMessage } from 'naive-ui'
import useSWRV from 'swrv'
import { defineComponent, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { AuthSocialProviders } from '~/utils/authjs/auth'
import type { UserModel } from '../../models/user'

import ParallaxButton from '~/components/button/parallax-button.vue'
import { GithubIcon, PassKeyOutlineIcon } from '~/components/icons'
import { SESSION_WITH_LOGIN } from '~/constants/keys'
import { authClient } from '~/utils/authjs/auth'
import { AuthnUtils } from '~/utils/authn'

import Avatar from '../../components/avatar/index.vue'
import { useUserStore } from '../../stores/user'
import { checkIsInit } from '../../utils/is-init'
import { RESTManager } from '../../utils/rest'
import styles from './index.module.css'

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

      document.addEventListener('keydown', (e) => {
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
