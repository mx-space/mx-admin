import { defineComponent, onMounted } from '@vue/runtime-core'
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

// const themeOverrides: GlobalThemeOverrides = {
//   common: {
//     primaryColor: '#1a9cf3',
//     primaryColorHover: '#16aae7',
//     primaryColorPressed: '#1188e8',
//     primaryColorSuppl: 'rgba(16, 133, 211, 0.5)',
//   },
// }

const App = defineComponent({
  setup() {
    useProviders(UIStore, UserStore, CategoryStore)

    return () => (
      // <NConfigProvider themeOverrides={themeOverrides}>
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
