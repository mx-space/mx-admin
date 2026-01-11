import { NBadge } from 'naive-ui'
import { defineComponent } from 'vue'

const _Badge = defineComponent({
  props: { processing: Boolean, value: [String, Number] },
  setup(props, ctx) {
    return () => (
      <Fragment>
        {props.value === 'N/A' ? (
          ctx.slots
        ) : (
          <NBadge {...props}>{ctx.slots}</NBadge>
        )}
      </Fragment>
    )
  },
})
