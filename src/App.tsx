import { PortalInjectKey } from '~/hooks/use-portal-element'
import {
  NConfigProvider,
  NDialogProvider,
  NMessageProvider,
  NNotificationProvider,
  darkTheme,
  dateZhCN,
  lightTheme,
  useDialog,
  useMessage,
  useNotification,
  zhCN,
} from 'naive-ui'
import { defineComponent, onMounted } from 'vue'
import { RouterView } from 'vue-router'

import { ThemeColorConfig } from '../theme.config'
import { useUIStore } from './stores/ui'
import type { VNode } from 'vue'

const Root = defineComponent({
  name: 'RootView',

  setup() {
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
    })
    const $portalElement = ref<VNode | null>(null)

    provide(PortalInjectKey, {
      setElement(el) {
        $portalElement.value = el
        return () => {
          $portalElement.value = null
        }
      },
    })

    return () => {
      return (
        <>
          <RouterView />
          {$portalElement.value}
        </>
      )
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
          themeOverrides={{
            common: ThemeColorConfig,
          }}
          theme={naiveUIDark ? darkTheme : isDark ? darkTheme : lightTheme}
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
