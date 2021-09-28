import { React } from '@vicons/fa'
import { RefreshCircle } from '@vicons/ionicons5'
import { Icon } from '@vicons/utils'
import { NButton, NPopover } from 'naive-ui'

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
                  class="opacity-40 hover:opacity-100 transition-opacity duration-500"
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
