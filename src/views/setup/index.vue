<script lang="ts">
import { useInjector } from 'hooks/use-deps-injection'
import { useMessage } from 'naive-ui'
import { defineComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
import ParallaxButtonVue from '../../components/button/parallax-button.vue'
import { UserModel } from '../../models/user'
import { UserStore } from '../../stores/user'
import { RouteName } from '../../router/name'
import { RESTManager } from '../../utils/rest'

const bgUrl =
  window.injectData.LOGIN_BG ||
  (import.meta.env.VITE_APP_LOGIN_BG as string) ||
  'https://gitee.com/xun7788/my-imagination/raw/master/uPic/1615516941397.jpg'
export const InitView = defineComponent({
  components: { ParallaxButtonVue },
  setup() {
    const loaded = ref(false)
    const { updateToken, fetchUser } = useInjector(UserStore)
    onMounted(() => {
      const $$ = new Image()
      $$.src = bgUrl
      $$.onload = (e) => {
        loaded.value = true
      }
    })
    const toast = useMessage()

    const password = ref('')
    const username = ref('')
    const router = useRouter()

    const handleRegister = async (e: Event) => {
      e?.stopPropagation()
      try {
        const res = await RESTManager.api.master.register.post<{
          token: string & UserModel
        }>({
          data: {
            username: username.value,
            password: password.value,
          },
        })
        updateToken(res.token)

        toast.success('欧尼酱!')

        setTimeout(() => {
          fetchUser().then(() => {
            window.injectData.INIT = true

            router.push({
              name: RouteName.System,
            })
          })
        }, 300)
      } catch (e: any) {
        toast.error('出了点小问题, 不要慌')
        toast.error(e.message)
      }
    }

    return {
      bgUrl,
      loaded,

      password,
      handleRegister,

      username,
    }
  },
})

export default InitView
</script>

<template>
  <div>
    <div
      class="bg transition-opacity duration-700"
      :style="{ backgroundImage: `url(${bgUrl})`, opacity: loaded ? 1 : 0 }"
    />

    <div class="wrapper">
      <form action="#" @submit.prevent="handleRegister">
        <div class="input-wrap">
          <input
            v-model="username"
            autofocus
            placeholder="这里填上你的用户名"
          />
        </div>
        <div class="input-wrap">
          <input
            v-model="password"
            type="password"
            placeholder="这里填上密码哦"
          />
        </div>
        <ParallaxButtonVue
          title="注册"
          class="p-button-raised p-button-rounded"
          @click.prevent.stop="handleRegister"
        />
      </form>
    </div>
  </div>
</template>

<style scoped>
@import '../login/index.css';
</style>
<style scoped="" lang="postcss">
form {
  @apply px-[6.25rem] py-[3rem] bg-black bg-opacity-10 backdrop-blur-xl rounded-2xl;
}

.input-wrap {
  margin: 1rem 0;
  & input {
    @apply bg-white bg-opacity-60;

    padding: 3px 14px;
    -webkit-text-fill-color: #333;
    color: #333;
    line-height: 1.8;
    backdrop-filter: blur(24px);
  }

  & * {
    outline: none;
  }
}

.password {
  @apply !mb-4;
}
</style>
