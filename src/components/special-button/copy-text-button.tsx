import { NButton, NIcon } from 'naive-ui'

import { MingcuteCopy2Line } from '../icons'

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
