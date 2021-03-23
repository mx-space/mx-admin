import clsx from 'clsx'
import { defineComponent, PropType, ref, watch, watchEffect } from 'vue'
import styles from './index.module.css'
import { Sidebar } from '../../components/sidebar'
import { useInjector } from '../../utils/deps-injection'
import { UIStore } from '../../stores/ui'
export const SidebarLayout = defineComponent({
  props: {
    children: {
      type: Object as PropType<JSX.Element>,
      required: true,
    },
  },
  name: 'sidebar-layout',
  components: { Sidebar },
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
          onCollapseChange={(s) => {
            collapse.value = s
          }}
        />

        <div
          class={clsx('relative', styles['content'])}
          style={{
            marginLeft: !collapse.value ? sidebarWidth.value + 'px' : '100px',
          }}
        >
          {props.children}
        </div>
      </div>
    )
  },
})
