import { defineComponent, PropType } from '@vue/runtime-core'
import Button from 'primevue/button'

export const RoundedButton = defineComponent({
  props: {
    variant: {
      type: String as PropType<
        | 'secondary'
        | 'primary'
        | 'success'
        | 'info'
        | 'warning'
        | 'help'
        | 'danger'
      >,
      default: 'primary',
    },
  },
  setup({ variant }, { slots }) {
    return () => {
      return (
        <Button class={'p-button-rounded p-button-' + variant}>
          {slots.default?.()}
        </Button>
      )
    }
  },
})
