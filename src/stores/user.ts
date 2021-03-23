import { ref } from '@vue/reactivity'
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

  return {
    user,
    token,

    async fetchUser() {
      const $user = await RESTManager.api.master.get<UserModel>()
      user.value = $user
    },

    updateToken($token: string) {
      if ($token) {
        setToken($token, 7)
      }

      token.value = $token
    },
  }
}
