import { useMessage } from 'naive-ui'
import useSWRV from 'swrv'
import { defineComponent, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { UserModel } from '../../models/user'

import ParallaxButton from '~/components/button/parallax-button.vue'
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
    })

    onMounted(() => {
      if (!inputRef.value) return
      inputRef.value.focus()

      document.onkeydown = (e) => {
        inputRef.value.focus()
      }

      onBeforeUnmount(() => {
        document.onkeydown = null
      })
    })

    const { data: settings } = useSWRV('allow-password', async () => {
      return RESTManager.api.user('allow-login').get<{
        password: boolean
        passkey: boolean
      }>()
    })

    let triggerAuthnOnce = false

    watchEffect(() => {
      if (triggerAuthnOnce) return
      if (settings.value?.password === false) {
        triggerAuthnOnce = true
        AuthnUtils.validate().then((res) => {
          if (!res) {
            message.error('验证失败，请刷新页面重试')
          }
          const token = res.token!
          updateToken(token)

          router.push(
            route.query.from
              ? decodeURI(route.query.from as string)
              : '/dashboard',
          )
          toast.success('欢迎回来')
        })
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
        updateToken(res.token)

        router.push(
          route.query.from
            ? decodeURI(route.query.from as string)
            : '/dashboard',
        )
        toast.success('欢迎回来')
      } catch (e) {
        toast.error('登录失败')
      }
    }

    return () => {
      const showPasswordInput =
        typeof settings.value === 'undefined' ||
        settings.value?.password === true

      const loginWithPassKey = settings.value?.passkey
      return (
        <div class={styles['r']}>
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
