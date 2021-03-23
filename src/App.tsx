import { defineComponent } from '@vue/runtime-core'
import { RouterView } from 'vue-router'
import { SidebarLayout } from './layouts/sidebar'
import { UIStore } from './stores/ui'
import { useProviders } from './utils/deps-injection'
// import { Sidebar } from './components/sidebar'
export default defineComponent({
  name: 'home',

  setup() {
    useProviders(UIStore)

    return () => {
      return (
        <SidebarLayout children={<RouterView></RouterView>}></SidebarLayout>
      )
    }
  },
})
