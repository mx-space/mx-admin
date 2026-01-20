import { RefreshCcw as RefreshCircle } from 'lucide-vue-next'
import { NButton, NPopover } from 'naive-ui'
import { defineComponent } from 'vue'

import { Icon } from '@vicons/utils'

export const ResetIconButton = defineComponent({
  props: {
    resetFn: {
      type: Function,
      required: true,
    },
  },
  setup(props) {
    return () => (
      <NPopover trigger="hover">
        {{
          trigger() {
            return (
              <NButton text class="ml-2" onClick={() => props.resetFn()}>
                <Icon
                  size="20"
                  class="opacity-40 transition-opacity duration-500 hover:opacity-100"
                >
                  <RefreshCircle />
                </Icon>
              </NButton>
            )
          },
          default() {
            return '将会重置这些设定'
          },
        }}
      </NPopover>
    )
  },
})
