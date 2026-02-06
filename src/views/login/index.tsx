import { KeyRound as PassKeyIcon } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import {
  defineComponent,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  ref,
  watchEffect,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

import { useQuery } from '@tanstack/vue-query'

import { userApi } from '~/api/user'
import { SESSION_WITH_LOGIN } from '~/constants/keys'
import { queryKeys } from '~/hooks/queries/keys'
import { authClient } from '~/utils/authjs/auth'
import { AuthnUtils } from '~/utils/authn'

import Avatar from '../../components/avatar'
import { useUserStore } from '../../stores/user'
import { checkIsInit } from '../../utils/is-init'

const GithubIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33c.85 0 1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
  </svg>
)

const GoogleIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

export const LoginView = defineComponent({
  setup() {
    const userStore = useUserStore()
    const { user } = storeToRefs(userStore)

    const router = useRouter()
    const route = useRoute()
    const inputRef = ref<HTMLInputElement | null>(null)
    const password = ref('')
    const isLoading = ref(false)

    onBeforeMount(async () => {
      const isInit = await checkIsInit()
      if (!isInit) {
        return router.replace('/setup')
      }
      await userStore.fetchUser()
    })

    onMounted(() => {
      const focusInput = () => {
        inputRef.value?.focus()
      }

      focusInput()
      document.addEventListener('keydown', focusInput)

      onBeforeUnmount(() => {
        document.removeEventListener('keydown', focusInput)
      })
    })

    const postSuccessfulLogin = () => {
      router.push(
        route.query.from ? decodeURI(route.query.from as string) : '/dashboard',
      )
      sessionStorage.setItem(SESSION_WITH_LOGIN, '1')
      toast.success('欢迎回来')
    }

    const { data: settings } = useQuery({
      queryKey: queryKeys.user.allowLogin(),
      queryFn: () => userApi.getAllowLogin(),
    })

    let triggerAuthnOnce = false

    const passkeyAuth = async () => {
      try {
        const res = await AuthnUtils.validate()
        if (!res) {
          toast.error('验证失败')
          return
        }
        postSuccessfulLogin()
      } catch {
        toast.error('Passkey 验证失败')
      }
    }

    watchEffect(() => {
      if (triggerAuthnOnce) return
      if (settings.value?.password === false) {
        triggerAuthnOnce = true
        passkeyAuth()
      }
    })

    const handleLogin = async (e: Event) => {
      e?.stopPropagation()
      e.preventDefault()

      if (isLoading.value) return

      try {
        const username = user.value?.username || user.value?.handle
        if (!username) {
          toast.error('主人用户名无法获取')
          return
        }

        isLoading.value = true

        await userApi.loginWithPassword({
          username,
          password: password.value,
        })

        postSuccessfulLogin()
      } catch {
        toast.error('登录失败')
      } finally {
        isLoading.value = false
      }
    }

    const handleSocialLogin = (provider: 'github' | 'google') => {
      authClient.signIn.social({
        provider,
        callbackURL: `${window.location.origin}${window.location.pathname}#${route.query.to || ''}`,
      })
    }

    return () => {
      const showPasswordInput =
        typeof settings.value === 'undefined' ||
        settings.value?.password === true

      const hasAlternativeAuth =
        settings.value?.passkey ||
        settings.value?.github ||
        settings.value?.google

      return (
        <div class="flex min-h-screen flex-col items-center justify-center p-4">
          {/* Avatar */}
          <div class="relative mb-4">
            <div class="h-[120px] w-[120px] overflow-hidden rounded-full ring-4 ring-white/30 drop-shadow-2xl">
              <Avatar src={user.value?.avatar} size={120} />
            </div>
          </div>

          {/* User Name */}
          <h1 class="mb-6 text-xl font-medium tracking-wide text-white drop-shadow-lg">
            {user.value?.name || user.value?.username || ''}
          </h1>

          {showPasswordInput && (
            <form onSubmit={handleLogin} class="w-full max-w-[280px]">
              {/* Password Input - macOS style pill */}
              <div class="relative mb-4">
                <label for="password-input" class="sr-only">
                  密码
                </label>
                <input
                  id="password-input"
                  ref={inputRef}
                  value={password.value}
                  onInput={(e: Event) => {
                    password.value = (e.target as HTMLInputElement).value
                  }}
                  type="password"
                  autocomplete="current-password"
                  placeholder="输入密码"
                  disabled={isLoading.value}
                  class="h-[38px] w-full rounded-full border-0 bg-white/20 px-4 text-center text-sm text-white outline-none ring-0 backdrop-blur-md transition-all placeholder:text-white/60 disabled:cursor-not-allowed disabled:opacity-50"
                />
                {/* Submit on Enter - hidden button */}
                <button type="submit" class="sr-only">
                  登录
                </button>
              </div>
            </form>
          )}

          {hasAlternativeAuth && (
            <div class="mt-6 flex justify-center gap-4">
              {settings.value?.passkey && (
                <button
                  type="button"
                  onClick={passkeyAuth}
                  aria-label="使用 Passkey 登录"
                  class="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white/80 backdrop-blur-sm transition-all hover:bg-white/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                  <PassKeyIcon class="h-[18px] w-[18px]" aria-hidden="true" />
                </button>
              )}

              {settings.value?.github && (
                <button
                  type="button"
                  onClick={() => handleSocialLogin('github')}
                  aria-label="使用 GitHub 登录"
                  class="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white/80 backdrop-blur-sm transition-all hover:bg-white/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                  <GithubIcon />
                </button>
              )}

              {settings.value?.google && (
                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  aria-label="使用 Google 登录"
                  class="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white/80 backdrop-blur-sm transition-all hover:bg-white/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                  <GoogleIcon />
                </button>
              )}
            </div>
          )}
        </div>
      )
    }
  },
})

export default LoginView
