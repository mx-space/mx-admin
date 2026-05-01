import { NBadge } from 'naive-ui'
import { defineComponent } from 'vue'

const _Badge = defineComponent({
  props: { processing: Boolean, value: [String, Number] },
  setup(props, ctx) {
    return () => {
      if (props.value === 'N/A') {
        return ctx.slots.default?.()
      }
      return <NBadge {...props}>{ctx.slots}</NBadge>
    }
  },
})
