import { defineComponent, onMounted } from '@vue/runtime-core'
import { RouterView } from 'vue-router'
import { UIStore } from './stores/ui'
import { UserStore } from './stores/user'
import { useInjector, useProviders } from './utils/deps-injection'
// import { Sidebar } from './components/sidebar'
const Root = defineComponent({
  name: 'home',

  setup() {
    const { fetchUser } = useInjector(UserStore)
    onMounted(() => {
      fetchUser()
    })
    return () => {
      return <RouterView />
    }
  },
})

const App = defineComponent({
  // props: {
  //   children: {
  //     type: Object as PropType<JSX.Element>,
  //     required: true,
  //   },
  // },
  setup({}) {
    useProviders(UIStore, UserStore)
    return () => <Root />
  },
})

export default App
