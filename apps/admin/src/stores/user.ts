import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { UserModel } from '../models/user'

import { userApi } from '~/api/user'
import { BusinessError } from '~/utils/request'

export const useUserStore = defineStore('user', () => {
  const user = ref<UserModel | null>(null)
  const router = useRouter()

  return {
    user,

    async fetchUser() {
      try {
        const $user = await userApi.getOwner()
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
  }
})

export { useUserStore as UserStore }
