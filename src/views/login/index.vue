<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref } from '@vue/runtime-core'
import Avatar from '../../components/avatar/index.vue'
import { UserStore } from '../../stores/user'
import { useInjector } from '../../utils/deps-injection'
import Button from 'primevue/button'
import { RESTManager } from '../../utils/rest'
import { useToast } from 'vue-toastification'
import { UserModel } from '../../models/user'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const bgUrl =
  'https://gitee.com/xun7788/my-imagination/raw/master/uPic/1615516941397.jpg'
export const LoginView = defineComponent({
  components: { Avatar, Button },
  setup() {
    const loaded = ref(false)
    const { user, updateToken } = useInjector(UserStore)
    const router = useRouter()
    const input = ref<HTMLInputElement>(null!)
    onMounted(() => {
      const $$ = new Image()
      $$.src = bgUrl
      $$.onload = (e) => {
        loaded.value = true
      }
      input.value.focus()

      document.onkeydown = (e) => {
        input.value.focus()
      }
    })

    onUnmounted(() => {
      document.onkeydown = null
    })

    const toast = ElMessage

    const password = ref('')

    const handleLogin = async (e) => {
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
          errorHandler() {},
        })
        updateToken(res.token)

        router.push('/dashboard')
        toast.success('欢迎回来')
      } catch (e) {
        toast.error('登陆失败')
      }
    }

    return {
      // bgUrl: loaded.value ? bgUrl : '',
      bgUrl,
      loaded,
      user,
      password,
      handleLogin,
      input,
    }
  },
})

export default LoginView
</script>

<template>
  <div>
    <div
      class="bg transition-opacity duration-700"
      :style="{ backgroundImage: `url(${bgUrl})`, opacity: loaded ? 1 : 0 }"
    ></div>

    <div class="wrapper">
      <Avatar :src="user?.avatar" :size="80" />
      <form action="#" @submit.prevent="handleLogin">
        <div class="input-wrap">
          <input v-model="password" type="password" autofocus ref="input" />
          <div class="blur"></div>
        </div>
        <Button
          label="登陆"
          @click="handleLogin"
          class="p-button-raised p-button-rounded"
        />
      </form>

      <!-- <Avatar :size="80" src="https://resume.innei.ren/avatar.ec3d4d8d.png" /> -->
    </div>
  </div>
</template>

<style scoped="">
@import './index.css';
</style>
