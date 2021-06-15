import { defineComponent, onMounted } from '@vue/runtime-core'
import { NDialogProvider, NMessageProvider, useMessage } from 'naive-ui'
import { CategoryStore } from 'stores/category'
import { RouterView } from 'vue-router'
import { UIStore } from './stores/ui'
import { UserStore } from './stores/user'
import { useInjector, useProviders } from './utils/deps-injection'

const Root = defineComponent({
  name: 'home',

  setup() {
    const { fetchUser } = useInjector(UserStore)

    onMounted(() => {
      window.message = useMessage()
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
  setup({}) {
    useProviders(UIStore, UserStore, CategoryStore)

    return () => (
      // <NConfigProvider themeOverrides={themeOverrides}>
      <NMessageProvider>
        <NDialogProvider>
          <Root />
        </NDialogProvider>
      </NMessageProvider>
      // </NConfigProvider>
    )
  },
})

export default App
