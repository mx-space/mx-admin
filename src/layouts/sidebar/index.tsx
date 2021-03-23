import { defineComponent, PropType, ref } from 'vue'
import { Sidebar } from '../../components/sidebar'
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
    const collapse = ref(false)
    const sidebarWidth = ref(300)
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
          class="relative content"
          style={{
            marginLeft: !collapse.value ? sidebarWidth.value + 'px' : '50px',
          }}
        >
          {props.children}
        </div>
      </div>
    )
  },
})
