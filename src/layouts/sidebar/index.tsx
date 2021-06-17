import clsx from 'clsx'
import { NLayoutContent } from 'naive-ui'
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

    const collapse = ui.sidebarCollapse
    watchEffect(() => {
      // console.log(ui.viewport)
      collapse.value = ui.viewport.value.mobile ? true : false
    })

    const sidebarWidth = ui.sidebarWidth
    return () => (
      <div class="wrapper">
        <Sidebar
          collapse={collapse.value}
          width={sidebarWidth.value}
          onCollapseChange={s => {
            collapse.value = s
          }}
        />

        <NLayoutContent
          nativeScrollbar={false}
          class={clsx('fixed inset-0 overflow-hidden', styles['content'])}
          style={{
            left: !collapse.value ? sidebarWidth.value + 'px' : '100px',
          }}
        >
          <RouterView />
        </NLayoutContent>
      </div>
    )
  },
})
