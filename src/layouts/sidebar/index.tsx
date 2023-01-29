import { KBarWrapper } from 'components/k-bar'
import { GATEWAY_URL } from 'constants/env'
import $RouterView from 'layouts/router-view'
import { NLayoutContent } from 'naive-ui'
import { RESTManager } from 'utils'
import type { CSSProperties } from 'vue'
import { computed, defineComponent, watchEffect } from 'vue'
import { RouterLink } from 'vue-router'

import { Sidebar } from '../../components/sidebar'
import { useStoreRef } from '../../hooks/use-store-ref'
import { UIStore } from '../../stores/ui'
import styles from './index.module.css'

export const SidebarLayout = defineComponent({
  name: 'SidebarLayout',

  setup() {
    const ui = useStoreRef(UIStore)

    const { meta, b } = useMagicKeys()
    watchEffect(() => {
      if (meta.value && b.value) {
        collapse.value = !collapse.value
      }
    })

    const isInApiDebugMode =
      localStorage.getItem('__api') ||
      localStorage.getItem('__gateway') ||
      new URLSearchParams(location.search).get('__api') ||
      new URLSearchParams(location.search).get('__gateway')

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
                {isInApiDebugMode && (
                  <div
                    class="h-[40px] fixed top-0 left-0 right-0 bg-dark-800 z-2 text-gray-400 flex items-center transition-all duration-500 whitespace-pre"
                    style={{
                      paddingLeft: !collapse.value ? '270px' : '80px',
                    }}
                  >
                    You are in customizing the API endpoint mode, please check:{' '}
                    <RouterLink to={'/setup-api'}>setup-api</RouterLink>.
                    Endpoint: {RESTManager.endpoint}, Gateway: {GATEWAY_URL}
                  </div>
                )}
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
                        ? `${sidebarWidth.value}px`
                        : '50px',
                      pointerEvents:
                        isLaptop.value && !collapse.value ? 'none' : 'auto',
                      top: isInApiDebugMode && '40px',
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
