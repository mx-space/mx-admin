import {
  darkTheme,
  dateZhCN,
  lightTheme,
  NConfigProvider,
  NDialogProvider,
  NElement,
  useDialog,
  useThemeVars,
  zhCN,
} from 'naive-ui'
import { defineComponent, onMounted, provide, ref, watchEffect } from 'vue'
import { RouterView } from 'vue-router'
import { Toaster } from 'vue-sonner'
import type { VNode } from 'vue'

import { AiTaskQueue } from '~/components/ai-task-queue'
import { PortalInjectKey } from '~/hooks/use-portal-element'

import { useUIStore } from './stores/ui'
import {
  commonThemeVars,
  componentThemeOverrides,
  darkThemeColors,
  lightThemeColors,
} from './utils/color'

const Root = defineComponent({
  name: 'RootView',

  setup() {
    onMounted(() => {
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
          {$portalElement.value ?? <></>}
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
      const isCurrentDark = naiveUIDark || isDark

      return (
        <NConfigProvider
          locale={zhCN}
          dateLocale={dateZhCN}
          themeOverrides={{
            common: Object.assign(
              {},
              commonThemeVars,
              isCurrentDark ? darkThemeColors : lightThemeColors,
            ),
            ...componentThemeOverrides,
          }}
          theme={isCurrentDark ? darkTheme : lightTheme}
        >
          <Toaster
            position="bottom-right"
            theme={isCurrentDark ? 'dark' : 'light'}
            closeButton
            closeButtonPosition="top-right"
            gap={12}
            toastOptions={{
              classes: {
                toast: 'sonner-toast',
                title: 'sonner-title',
                description: 'sonner-description',
                actionButton: 'sonner-action-button',
                cancelButton: 'sonner-cancel-button',
                closeButton: 'sonner-close-button',
              },
            }}
          />
          <NDialogProvider>
            <AccentColorInjector />
            <NElement>
              <Root />
            </NElement>
            <AiTaskQueue />
          </NDialogProvider>
        </NConfigProvider>
      )
    }
  },
})

const AccentColorInjector = defineComponent({
  setup() {
    const vars = useThemeVars()
    watchEffect(() => {
      const { primaryColor, primaryColorHover, primaryColorSuppl } = vars.value

      document.documentElement.style.setProperty(
        '--color-primary',
        primaryColor,
      )
      document.documentElement.style.setProperty(
        '--color-primary-shallow',
        primaryColorHover,
      )
      document.documentElement.style.setProperty(
        '--color-primary-deep',
        primaryColorSuppl,
      )
    })

    return () => <></>
  },
})
// eslint-disable-next-line import/no-default-export
export default App
