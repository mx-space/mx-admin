import { Copy as MingcuteCopy2Line } from 'lucide-vue-next'
import { NButton, NIcon } from 'naive-ui'

export const CopyTextButton = defineComponent({
  props: {
    text: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    return () => (
      <NButton
        size="tiny"
        onClick={() => {
          navigator.clipboard.writeText(props.text)
          message.success('Copied to clipboard')
        }}
        text
        class={'ml-2'}
      >
        <NIcon>
          <MingcuteCopy2Line />
        </NIcon>
      </NButton>
    )
  },
})
