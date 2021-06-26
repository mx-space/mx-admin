import { defineComponent, onMounted } from 'vue'
import {
  NConfigProvider,
  NDialogProvider,
  NMessageProvider,
  NNotificationProvider,
  useMessage,
  useNotification,
} from 'naive-ui'
import { CategoryStore } from 'stores/category'
import { RouterView } from 'vue-router'
import { UIStore } from './stores/ui'
import { UserStore } from './stores/user'
import { useInjector, useProviders } from './utils/deps-injection'
import { zhCN, dateZhCN } from 'naive-ui'

const Root = defineComponent({
  name: 'Home',

  setup() {
    const { fetchUser } = useInjector(UserStore)

    onMounted(() => {
      window.message = useMessage()
      window.notification = useNotification()
      import('socket').then((mo) => {
        mo.socket.initIO()
      })

      fetchUser()
    })

    return () => {
      return <RouterView />
    }
  },
})

const App = defineComponent({
  setup() {
    useProviders(UIStore, UserStore, CategoryStore)

    return () => (
      <NConfigProvider locale={zhCN} dateLocale={dateZhCN}>
        <NNotificationProvider>
          <NMessageProvider>
            <NDialogProvider>
              <Root />
            </NDialogProvider>
          </NMessageProvider>
        </NNotificationProvider>
      </NConfigProvider>
    )
  },
})

export default App
