import { React } from '@vicons/fa'
import { defineComponent } from '@vue/runtime-core'
import NLoading from 'naive-ui/es/_internal/loading/src/loading'
import { Suspense, VNode } from 'vue'
import { RouteLocation, RouterView } from 'vue-router'
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
                    return () => (
                      <div class="fixed left-1/2 top-1/2 transform text-primary-default -translate-y-1/2 -translate-x-1/2">
                        <NLoading
                          clsPrefix={'h-[50px] w-[50px] '}
                          strokeWidth={14}
                        />
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
