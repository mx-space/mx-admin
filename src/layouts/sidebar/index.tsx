import clsx from 'clsx'
import { defineComponent, ref, watchEffect } from 'vue'
import { RouterView } from 'vue-router'
import { Sidebar } from '../../components/sidebar'
import { UIStore } from '../../stores/ui'
import { useInjector } from '../../utils/deps-injection'
import styles from './index.module.css'
export const SidebarLayout = defineComponent({
  name: 'sidebar-layout',

  setup(props) {
    const ui = useInjector(UIStore)

    const collapse = ref(ui.viewport.value.mobile ? true : false)
    watchEffect(() => {
      // console.log(ui.viewport)
      collapse.value = ui.viewport.value.mobile ? true : false
    })

    const sidebarWidth = ref(250)
    return () => (
      <div class="wrapper">
        <Sidebar
          collapse={collapse.value}
          width={sidebarWidth.value}
          onCollapseChange={s => {
            collapse.value = s
          }}
        />

        <div
          class={clsx('relative', styles['content'])}
          style={{
            marginLeft: !collapse.value ? sidebarWidth.value + 'px' : '100px',
          }}
        >
          <RouterView />
        </div>
      </div>
    )
  },
})
