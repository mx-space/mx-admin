import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { UserModel } from '../models/user'

import { userApi } from '~/api/user'
import { BusinessError } from '~/utils/request'
import { getToken, setToken } from '../utils/auth'

let tokenIsUpstream = false

export const setTokenIsUpstream = (isUpstream: boolean) => {
  tokenIsUpstream = isUpstream
}

export const getTokenIsUpstream = () => {
  return tokenIsUpstream
}

export const useUserStore = defineStore('user', () => {
  const user = ref<UserModel | null>(null)
  const token = ref<string>('')

  const $token = getToken()
  if ($token) {
    token.value = $token
  }
  const router = useRouter()
  return {
    user,
    token,

    async fetchUser() {
      try {
        const $user = await userApi.getMaster()
        user.value = $user
      } catch (error) {
        if (
          error instanceof BusinessError &&
          error.message === '没有完成初始化！'
        ) {
          router.replace('/setup')
        }
      }
    },

    updateToken($token: string) {
      if ($token) {
        setToken($token)
      }

      token.value = $token
    },
  }
})

export { useUserStore as UserStore }
