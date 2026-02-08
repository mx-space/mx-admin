import { computed, defineComponent, onUnmounted, watchEffect } from 'vue'
import { RouterLink } from 'vue-router'
import type { CSSProperties } from 'vue'

import { KBarWrapper } from '~/components/k-bar'
import { API_URL, GATEWAY_URL } from '~/constants/env'
import { ContentLayout } from '~/layouts/content'
import $RouterView from '~/layouts/router-view'

import { Sidebar } from '../../components/sidebar'
import { useStoreRef } from '../../hooks/use-store-ref'
import { UIStore } from '../../stores/ui'
import styles from './index.module.css'

export const SidebarLayout = defineComponent({
  name: 'SidebarLayout',

  setup() {
    const ui = useStoreRef(UIStore)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key.toLowerCase() === 'b') {
        const activeElement = document.activeElement
        const isInEditor =
          activeElement?.tagName === 'TEXTAREA' ||
          activeElement?.tagName === 'INPUT' ||
          activeElement?.getAttribute('contenteditable') === 'true' ||
          activeElement?.closest('.monaco-editor') ||
          activeElement?.closest('[role="textbox"]')

        if (!isInEditor) {
          e.preventDefault()
          collapse.value = !collapse.value
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeyDown)
    })

    const isInApiDebugMode =
      localStorage.getItem('__api') ||
      localStorage.getItem('__gateway') ||
      sessionStorage.getItem('__api') ||
      sessionStorage.getItem('__gateway') ||
      window.injectData.PAGE_PROXY

    const collapse = ui.sidebarCollapse
    const isLaptop = computed(
      () => ui.viewport.value.mobile || ui.viewport.value.pad,
    )
    watchEffect(() => {
      collapse.value = isLaptop.value ? true : false
    })

    return () => (
      <KBarWrapper>
        {{
          default() {
            return (
              <div
                class={[styles.root, collapse.value ? 'collapsed' : 'expanded']}
              >
                {isInApiDebugMode && (
                  <div
                    class={[
                      'fixed left-0 right-0 top-0 z-20 flex h-10 items-center whitespace-pre px-4 text-sm text-[var(--sidebar-text)]',
                      window.injectData.PAGE_PROXY && 'bg-red-900/20',
                    ]}
                    style={{
                      paddingLeft: !collapse.value ? '236px' : '16px',
                    }}
                  >
                    API endpoint mode:{' '}
                    <RouterLink
                      to="/setup-api"
                      class="mx-2 text-blue-400 hover:underline"
                    >
                      setup-api
                    </RouterLink>
                    | Endpoint: {API_URL} | Gateway: {GATEWAY_URL}
                    {window.injectData.PAGE_PROXY && ' | Local dev mode'}
                  </div>
                )}

                <Sidebar
                  collapse={collapse.value}
                  onCollapseChange={(s) => {
                    collapse.value = s
                  }}
                />

                {/* 移动端遮罩层 */}
                {isLaptop.value && !collapse.value && (
                  <div
                    class={styles.overlay}
                    onClick={() => (collapse.value = true)}
                  />
                )}

                <div
                  class={styles.content}
                  style={
                    {
                      left: !collapse.value ? 'var(--sidebar-width)' : '0',
                      pointerEvents:
                        isLaptop.value && !collapse.value ? 'none' : 'auto',
                      top: isInApiDebugMode ? '28px' : '0',
                    } as CSSProperties
                  }
                >
                  <div class={styles.container}>
                    <ContentLayout>
                      <$RouterView />
                    </ContentLayout>
                  </div>
                </div>
              </div>
            )
          },
        }}
      </KBarWrapper>
    )
  },
})
