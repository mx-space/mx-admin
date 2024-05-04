import { NSpin } from 'naive-ui'
import { Suspense, defineComponent } from 'vue'
import { RouterView } from 'vue-router'
import type { VNode } from 'vue'
import type { RouteLocation } from 'vue-router'

const $RouterView = defineComponent({
  setup() {
    return () => (
      <RouterView>
        {{
          default({ Component }: { Component: VNode; route: RouteLocation }) {
            return (
              <Suspense>
                {{
                  default: () => Component,

                  fallback() {
                    return (
                      <div class="text-primary-default fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform">
                        <NSpin strokeWidth={14} show rotate />
                      </div>
                    )
                  },
                }}
              </Suspense>
            )
          },
        }}
      </RouterView>
    )
  },
})
export default $RouterView
