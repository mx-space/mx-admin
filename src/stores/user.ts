import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { UserModel } from '../models/user'
import { getToken, setToken } from '../utils/auth'
import { RESTManager } from '../utils/rest'
export function UserStore() {
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
        const $user = await RESTManager.api.master.get<UserModel>()
        user.value = $user
      } catch (e: any) {
        if (e.data?.message == '没有完成初始化!') {
          router.replace('/setup')
        }
      }
    },

    updateToken($token: string) {
      if ($token) {
        setToken($token, 7)
      }

      token.value = $token
    },
  }
}
