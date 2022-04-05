import { KBarWrapper } from 'components/k-bar'
import $RouterView from 'layouts/router-view'
import { NLayoutContent } from 'naive-ui'
import { CSSProperties, computed, defineComponent, watchEffect } from 'vue'

import { Sidebar } from '../../components/sidebar'
import { useInjector } from '../../hooks/use-deps-injection'
import { UIStore } from '../../stores/ui'
import styles from './index.module.css'

export const SidebarLayout = defineComponent({
  name: 'SidebarLayout',

  setup(props) {
    const ui = useInjector(UIStore)

    const collapse = ui.sidebarCollapse
    const isLaptop = computed(
      () => ui.viewport.value.mobile || ui.viewport.value.pad,
    )
    watchEffect(() => {
      collapse.value = isLaptop.value ? true : false
    })

    const sidebarWidth = ui.sidebarWidth

    return () => (
      <KBarWrapper>
        {{
          default() {
            return (
              <div class={styles['root']}>
                <Sidebar
                  collapse={collapse.value}
                  width={sidebarWidth.value}
                  onCollapseChange={(s) => {
                    collapse.value = s
                  }}
                />

                <NLayoutContent
                  embedded
                  nativeScrollbar={false}
                  class={styles['content']}
                  style={
                    {
                      left: !collapse.value
                        ? sidebarWidth.value + 'px'
                        : '100px',
                      pointerEvents:
                        isLaptop.value && !collapse.value ? 'none' : 'auto',
                    } as CSSProperties
                  }
                >
                  <$RouterView />
                </NLayoutContent>
              </div>
            )
          },
        }}
      </KBarWrapper>
    )
  },
})
