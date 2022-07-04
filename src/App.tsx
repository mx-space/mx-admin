import {
  NConfigProvider,
  NDialogProvider,
  NMessageProvider,
  NNotificationProvider,
  darkTheme,
  dateZhCN,
  useDialog,
  useMessage,
  useNotification,
  zhCN,
} from 'naive-ui'
import { RouteName } from 'router/name'
import { defineComponent, onMounted } from 'vue'
import { RouterView, useRouter } from 'vue-router'

import { useUIStore } from './stores/ui'
import { useUserStore } from './stores/user'

const Root = defineComponent({
  name: 'RootView',

  setup() {
    const { fetchUser } = useUserStore()
    const router = useRouter()
    onMounted(() => {
      const message = useMessage()
      const _error = message.error
      Object.assign(message, {
        error: (...rest: any[]) => {
          // @ts-ignore
          _error.apply(this, rest)
          throw rest[0]
        },
      })

      window.message = message
      window.notification = useNotification()
      window.dialog = useDialog()

      fetchUser().then(() => {
        const toSetting = localStorage.getItem('to-setting')
        if (toSetting === 'true') {
          router.push({
            name: RouteName.Setting,
            params: {
              type: 'user',
            },
          })
          localStorage.removeItem('to-setting')
        }
      })
    })

    return () => {
      return <RouterView />
    }
  },
})

const App = defineComponent({
  setup() {
    const uiStore = useUIStore()
    return () => {
      const { isDark, naiveUIDark } = uiStore
      return (
        <NConfigProvider
          locale={zhCN}
          dateLocale={dateZhCN}
          theme={naiveUIDark ? darkTheme : isDark ? darkTheme : null}
        >
          <NNotificationProvider>
            <NMessageProvider>
              <NDialogProvider>
                <Root />
              </NDialogProvider>
            </NMessageProvider>
          </NNotificationProvider>
        </NConfigProvider>
      )
    }
  },
})

// eslint-disable-next-line import/no-default-export
export default App
