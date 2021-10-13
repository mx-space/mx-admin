<script lang="ts">
import { useInjector } from 'hooks/use-deps-injection'
import { useMessage } from 'naive-ui'
import { defineComponent, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Avatar from '../../components/avatar/index.vue'
import ParallaxButtonVue from '../../components/button/parallax-button.vue'
import { UserModel } from '../../models/user'
import { UserStore } from '../../stores/user'
import { bgUrl } from 'constants/env'
import { RESTManager } from '../../utils/rest'

export const LoginView = defineComponent({
  components: { Avatar, ParallaxButtonVue },
  setup() {
    const loaded = ref(false)
    const { user, updateToken } = useInjector(UserStore)
    const router = useRouter()
    const input = ref<HTMLInputElement>(null!)

    onBeforeMount(async () => {
      const isInit =
        window.injectData.INIT ??
        (await RESTManager.api.init.get<{ isInit: boolean }>()).isInit
      if (!isInit) {
        return router.replace('/setup')
      }
    })
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

    const toast = useMessage()

    const password = ref('')
    const route = useRoute()
    const handleLogin = async (e: Event) => {
      e?.stopPropagation()
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
    />

    <div class="wrapper">
      <Avatar
        :src="user?.avatar"
        :size="80"
      />
      <form
        action="#"
        @submit.prevent="handleLogin"
      >
        <div class="input-wrap">
          <input
            ref="input"
            v-model="password"
            type="password"
            autofocus
          />
        </div>
        <ParallaxButtonVue
          title="登陆"
          class="p-button-raised p-button-rounded"
          @click.prevent.stop="handleLogin"
        />
      </form>
    </div>
  </div>
</template>

<style scoped="">
@import './index.css';
</style>
